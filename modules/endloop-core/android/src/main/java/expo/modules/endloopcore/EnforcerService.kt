package expo.modules.endloopcore

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.SystemClock
import android.provider.Settings
import android.media.AudioManager
import android.util.Log
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/**
 * The always-on watcher. Every few seconds: which app is in front, how long has it been used
 * today, and is it time to warn (75%, 90%) or roast (100%)?
 *
 * Runs as a foreground service (specialUse) with a quiet, minimal notification, on its own
 * background thread so the app's UI never stutters. It survives the app being closed and
 * restarts after reboot (BootReceiver). A heartbeat timestamp lets the app notice when the
 * phone killed it.
 */
class EnforcerService : Service() {
  private lateinit var thread: HandlerThread
  private lateinit var handler: Handler
  private lateinit var store: Store
  private lateinit var overlay: RoastOverlay

  // Foreground app, advanced with only the new usage events each tick.
  private var foreground: String? = null
  private var eventsUpTo = 0L
  // Apps paused but not stopped, and since when: the ones still on screen in picture-in-picture.
  private val paused = HashMap<String, Long>()
  // Today's usage of a tracked app in picture-in-picture (pkg -> checked at, ms), refreshed at most every CACHE_MS.
  private val pipUsage = HashMap<String, Pair<Long, Long>>()

  // Today's usage for the app in front, refreshed at most every CACHE_MS.
  private var cachedPkg: String? = null
  private var cachedAt = 0L
  private var cachedMs = 0L

  // The app the roast is currently covering, and since when another app has been in front (0 = it isn't).
  private var overlayFor: String? = null
  private var awaySince = 0L
  // The roast last moved its app to the background: not again before this (see [keepUnderRoast]).
  private var leaveAgainAt = 0L
  private var homePkg: String? = null
  // The app in front hid our roast (it hides overlays), so we sent the user home to show it there.
  @Volatile private var sentHome = false

  // The roast was just closed and we left that app through ExitActivity: checked two ticks later.
  @Volatile private var exitFor: String? = null
  @Volatile private var exitAt = 0L

  // Screen 9: when each app's roast was last closed, how often it came straight back, and the
  // short pause after sharing a roast.
  private val closedAt = HashMap<String, Long>()
  private val reopens = HashMap<String, Int>()
  @Volatile private var shareGraceUntil = 0L

  // When the quiet "Loop is watching" status line was last refreshed.
  private var statusAt = 0L

  private val tick = object : Runnable {
    override fun run() {
      try {
        check()
      } catch (e: Exception) {
        // never let one bad tick kill the watcher
        Log.w(TAG, "tick failed", e)
      }
      store.heartbeat = System.currentTimeMillis()
      // Faster while the roast is up, so the app under it can't sneak back for long (see [keepUnderRoast]).
      handler.postDelayed(this, if (overlay.isShowing) ROAST_TICK_MS else TICK_MS)
    }
  }

  override fun onCreate() {
    super.onCreate()
    store = Store(this)
    overlay = RoastOverlay(this)
    overlay.onHiddenBySystem = { handler.post { sendHomeForRoast() } }
    Notifier.ensureChannels(this)
    thread = HandlerThread("endloop-watcher").apply { start() }
    handler = Handler(thread.looper)
    homePkg = runCatching {
      packageManager.resolveActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0)?.activityInfo?.packageName
    }.getOrNull()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val config = store.config
    // Always go foreground first: stopping a service started with startForegroundService
    // before calling startForeground crashes the app on Android 8+.
    try {
      val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0
      val n = config?.apps?.size ?: 0
      val title = config?.notif?.watchingTitle ?: NotifCopy.DEFAULT.watchingTitle
      ServiceCompat.startForeground(this, Notifier.ID_SERVICE, Notifier.serviceNotification(this, title, "Watching $n app${if (n == 1) "" else "s"}"), type)
    } catch (_: Exception) {
      // e.g. ForegroundServiceStartNotAllowedException when restarted from the background
      stopSelf()
      return START_NOT_STICKY
    }
    if (config == null || !config.enabled || config.apps.isEmpty()) {
      stopSelf()
      return START_NOT_STICKY
    }
    if (!store.explained) {
      store.explained = true
      Notifier.explain(this, config.notif.explainTitle, config.notif.explainText, Alerts.character(this, config, Alerts.Pose.EXPLAIN))
    }
    noteOffGap()
    statusAt = 0L
    handler.removeCallbacks(tick)
    handler.post(tick)
    return START_STICKY
  }

  override fun onDestroy() {
    Log.i(TAG, "watcher stopped")
    handler.removeCallbacks(tick)
    overlay.hide()
    thread.quitSafely()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun check() {
    val config = store.config ?: return
    if (!config.enabled) return
    val now = System.currentTimeMillis()
    checkClock(now)

    // H1: never cover a phone or WhatsApp/Meet call. Take the roast down if one starts; roast after it ends.
    if (inCall()) {
      if (overlay.isShowing) {
        Log.i(TAG, "call started: roast down until it ends")
        overlay.hide()
        overlayFor = null
      }
      return
    }

    if (now - statusAt > STATUS_MS) {
      statusAt = now
      refreshStatus(config, now)
      maybeWeekly(config, now)
    }

    // Paused for today (Settings): keep counting for Stats, but no warnings or roasts until midnight.
    if (now < config.pausedUntil) {
      if (overlay.isShowing) overlay.hide()
      eventsUpTo = 0L
      foreground = null
      return
    }

    if (eventsUpTo == 0L) paused.clear()
    val from = if (eventsUpTo == 0L) UsageReader.startOfToday(now) else eventsUpTo
    val pkg = UsageReader.advanceForeground(this, foreground, from, now, paused)
    eventsUpTo = now

    if (overlay.isShowing) keepOrDropRoast(pkg, now)
    if (overlay.isShowing) keepUnderRoast(pkg, now)
    checkExit(pkg, now)
    if (pkg != foreground) {
      Log.d(TAG, "foreground: $foreground -> $pkg")
      foreground = pkg
      cachedAt = 0L
      if (pkg != null) maybeBrowserNudge(config, pkg, now)
    }
    if (pkg == null) return
    // Picture-in-picture over the home screen or an untracked app (never over Settings, the dialer...).
    if (!overlay.isShowing && config.app(pkg) == null && (pkg == homePkg || !Protected.isProtected(this, pkg))) roastPip(config, pkg, now)
    if (Protected.isProtected(this, pkg)) return
    val app = config.app(pkg) ?: return

    if (pkg != cachedPkg || cachedAt == 0L || now - cachedAt > CACHE_MS) {
      cachedMs = UsageReader.foregroundMs(this, UsageReader.startOfToday(now), now, setOf(pkg))[pkg] ?: 0L
      cachedPkg = pkg
      cachedAt = now
    }
    val usedMin = ((cachedMs + (now - cachedAt)) / 60_000L).toInt()
    // H6: the clock was moved, so today's numbers can't be trusted: count as over until the real midnight.
    val pct = if (tampering()) maxOf(1.0, usedMin.toDouble() / app.limitMin.coerceAtLeast(1)) else usedMin.toDouble() / app.limitMin.coerceAtLeast(1)

    if (pct < 1.0 && config.notify.lateNight && isLateNight(config) && !store.lateNightSent()) {
      store.markLateNight()
      Alerts.lateNight(this, config, app, usedMin, now)
    }

    when {
      pct >= 1.0 -> {
        store.markWarned(pkg, 75)
        store.markWarned(pkg, 90)
        roast(config, app, usedMin, now)
      }
      pct >= 0.9 && !store.wasWarned(pkg, 90) -> {
        store.markWarned(pkg, 75)
        store.markWarned(pkg, 90)
        warn(config, app, usedMin, Notifier.Type.LAST_CALL)
      }
      pct >= 0.75 && !store.wasWarned(pkg, 75) -> {
        store.markWarned(pkg, 75)
        warn(config, app, usedMin, Notifier.Type.HEADS_UP)
      }
    }
  }

  private fun warn(config: EnforcerConfig, app: TrackedApp, usedMin: Int, type: Notifier.Type) {
    val last = type == Notifier.Type.LAST_CALL
    if (if (last) !config.notify.lastCall else !config.notify.headsUp) return
    Alerts.warning(this, config, app, usedMin, last)
  }

  /** Sunday from 7 pm: "Your weekly roast is ready." Once a week; opens the report (Screen 13). */
  private fun maybeWeekly(config: EnforcerConfig, now: Long) {
    val c = java.util.Calendar.getInstance()
    if (!config.notify.weekly) return
    if (c.get(java.util.Calendar.DAY_OF_WEEK) != java.util.Calendar.SUNDAY || c.get(java.util.Calendar.HOUR_OF_DAY) < 19) return
    val sunday = dayKey(now)
    if (store.weeklySent(sunday)) return
    store.markWeekly(sunday)
    Alerts.weekly(this, config, Alerts.weekTotal(this, config, now))
  }

  /** From bedtime until 5 am. */
  private fun isLateNight(config: EnforcerConfig): Boolean {
    if (config.bedtimeMin < 0) return false
    val c = java.util.Calendar.getInstance()
    val min = c.get(java.util.Calendar.HOUR_OF_DAY) * 60 + c.get(java.util.Calendar.MINUTE)
    val end = 5 * 60
    return if (config.bedtimeMin > end) min >= config.bedtimeMin || min < end else min in config.bedtimeMin until end
  }

  /** "Instagram 45/60 min · YouTube over · Snapchat 12/30 min" on the quiet service notification. */
  private fun refreshStatus(config: EnforcerConfig, now: Long) {
    // Screen 16: permission turned off → the quiet notification says so and taps through to the app.
    if (!UsageReader.hasAccess(this)) {
      Notifier.updateService(this, "I've been turned off.", "Tap to fix. I can't see your screen time right now.")
      return
    }
    val totals = UsageReader.foregroundMs(this, UsageReader.startOfToday(now), now, config.apps.map { it.packageName }.toSet())
    // Swiped away today: leave it gone (it comes back tomorrow). Minimal: no live counter.
    val dismissedToday = store.statusDismissedAt >= UsageReader.startOfToday(now)
    if (!dismissedToday) {
      val status = if (config.statusMinimal) config.notif.minimalText else config.apps.joinToString(" · ") { a ->
        val used = ((totals[a.packageName] ?: 0L) / 60_000L).toInt()
        if (used >= a.limitMin) "${a.label} ${config.notif.over}" else "${a.label} $used/${a.limitMin} min"
      }
      Notifier.updateService(this, config.notif.watchingTitle, status)
    }
    // keep our own daily summary for Stats (Android only keeps about a week of detail)
    store.saveDay(dayKey(now), totals.mapValues { (it.value / 60_000L).toInt() })
  }


  /**
   * The roast stays up until Close / snooze, or until the user has really moved on:
   * - a call, Settings and other protected apps take it down at once (never cover an incoming
   *   call or the way to change permissions); so does the home screen, unless we moved the user
   *   there ourselves (the roast leaves the app underneath as soon as it shows, see [leaveUnderRoast]);
   * - while the user is answering "Convince me" it stays, whatever the app underneath does
   *   (Settings opened its search activity by itself and closed the step mid-answer);
   * - any other app must stay in front for [AWAY_MS], so short blips don't flash it.
   */
  private fun keepOrDropRoast(pkg: String?, now: Long) {
    if (pkg == null || pkg == overlayFor || pkg in IGNORED) {
      awaySince = 0L
      return
    }
    // We moved the user to the home screen so the roast could show (passing through ExitActivity): keep it up there.
    if (sentHome && (pkg == homePkg || pkg == packageName)) {
      awaySince = 0L
      return
    }
    if (awaySince == 0L) awaySince = now
    val immediate = pkg == homePkg || Protected.isProtected(this, pkg)
    if (immediate || (!overlay.busy && now - awaySince >= AWAY_MS)) {
      Log.i(TAG, "roast down: $pkg in front (was $overlayFor)")
      overlay.hide()
      overlayFor = null
      awaySince = 0L
      sentHome = false
    }
  }

  /**
   * While the roast is up, the app under it stays out of sight. It can come back to the front behind
   * the roast (Recents, the quick-switch swipe, its icon, a notification, a link) and start playing
   * again; the next Home or Recents would then shrink it into picture-in-picture. So whenever it's
   * back in front, or already in picture-in-picture, take audio focus again (it pauses) and leave it
   * again through ExitActivity. Not more often than every [LEAVE_AGAIN_MS].
   */
  private fun keepUnderRoast(pkg: String?, now: Long) {
    val app = overlayFor ?: return
    if (now < leaveAgainAt) return
    val inFront = pkg == app
    val inPip = !inFront && paused[app]?.let { now - it >= UsageReader.VISIBLE_AFTER_MS } == true
    if (!inFront && !inPip) return
    if (!canLeave()) return
    Log.i(TAG, if (inFront) "$app back in front under the roast: leaving it again" else "$app in picture-in-picture under the roast: closing it")
    overlay.reclaimAudio()
    leaveUnderRoast(app, pip = inPip)
  }

  /** Activity starts are skipped while the phone is locked or the screen is off. */
  private fun canLeave(): Boolean {
    val pm = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
    val km = getSystemService(Context.KEYGUARD_SERVICE) as android.app.KeyguardManager
    return pm.isInteractive && !km.isKeyguardLocked
  }

  /**
   * Apps like Files ask Android to hide overlays from other apps, so the roast was drawn but
   * invisible until the user left. Instead: take them to the home screen, where it shows.
   * Skipped when the phone is locked or the screen is off (the lock screen hides overlays too).
   */
  private fun sendHomeForRoast() {
    val pkg = overlayFor ?: return
    if (sentHome || !overlay.isShowing) return
    if (!canLeave()) return
    sentHome = true
    overlay.leave()
    Log.i(TAG, "roast hidden by $pkg; sent home to show it")
  }

  /**
   * Safety net after closing the roast, two ticks on:
   * - the app is still in front (the exit didn't take): forget the close, so the next tick shows
   *   the roast again as a plain roast rather than "back already?";
   * - the app is still on screen without being in front (picture-in-picture): pause its media again
   *   and take back the win, because the user hasn't really left.
   */
  private fun checkExit(pkg: String?, now: Long) {
    val left = exitFor ?: return
    if (now - exitAt < 2 * TICK_MS - 500) return
    exitFor = null
    when {
      pkg == left -> {
        Log.w(TAG, "exit didn't take: $left still in front")
        closedAt.remove(left)
        store.undoWin()
      }
      UsageReader.stillVisibleInBackground(this, left, exitAt - 1_000L, now) -> {
        Log.w(TAG, "$left still on screen after the roast (picture-in-picture?): pausing it")
        overlay.pauseMedia()
        store.undoWin()
      }
      else -> Log.d(TAG, "left $left cleanly")
    }
  }

  /**
   * A tracked app over its limit is still playing in a picture-in-picture window while something
   * else (usually the home screen) is in front: roast it like any other time. Only over the launcher
   * or an ordinary app; never over Settings and the other protected apps (checked by the caller).
   */
  private fun roastPip(config: EnforcerConfig, front: String, now: Long) {
    for ((pip, since) in paused) {
      if (pip == front || now - since < UsageReader.VISIBLE_AFTER_MS) continue
      val app = config.app(pip) ?: continue
      if (Protected.isProtected(this, pip)) continue
      val cached = pipUsage[pip]
      val ms = if (cached != null && now - cached.first < CACHE_MS) cached.second
      else (UsageReader.foregroundMs(this, UsageReader.startOfToday(now), now, setOf(pip))[pip] ?: 0L).also { pipUsage[pip] = now to it }
      val usedMin = (ms / 60_000L).toInt()
      if (!tampering() && usedMin < app.limitMin) continue
      Log.i(TAG, "$pip is over its limit in picture-in-picture")
      roast(config, app, usedMin, now, pip = true)
      return
    }
  }

  /**
   * The roast is on screen: move the app underneath to the background now, through ExitActivity, so
   * the Home key has nothing to shrink into picture-in-picture. A picture-in-picture window is pulled
   * back to full screen first (behind the roast), so leaving closes it instead of leaving it playing.
   * Skipped when the phone is locked or the screen is off.
   */
  private fun leaveUnderRoast(pkg: String, pip: Boolean) {
    if (overlayFor != pkg || !overlay.isShowing) return
    if (!canLeave()) return
    sentHome = true
    // a picture-in-picture window is in front while it grows back: don't leave it again mid-way
    leaveAgainAt = System.currentTimeMillis() + LEAVE_AGAIN_MS + if (pip) PIP_EXPAND_MS else 0L
    if (!pip) {
      overlay.leave()
      Log.i(TAG, "left $pkg under the roast")
      return
    }
    overlay.open(pkg)
    handler.postDelayed({
      if (overlayFor == pkg && overlay.isShowing) {
        overlay.leave()
        Log.i(TAG, "closed $pkg picture-in-picture under the roast")
      }
    }, PIP_EXPAND_MS)
  }

  private fun roast(config: EnforcerConfig, app: TrackedApp, usedMin: Int, now: Long, pip: Boolean = false) {
    if (overlay.isShowing || now < store.snoozedUntil(app.packageName) || now < shareGraceUntil) return
    if (exitFor == app.packageName) return // just closed: checkExit decides what happens next
    val pkg = app.packageName
    overlayFor = pkg
    awaySince = 0L
    sentHome = false
    val t = config.roastText
    val used = store.snoozesUsed(pkg)
    val canSnooze = used < config.maxSnoozesPerDay
    val opens = runCatching { UsageReader.opens(this, UsageReader.startOfToday(now), now, pkg) }.getOrDefault(-1)

    // Back within 10 minutes of closing it: the roast escalates.
    val closed = closedAt[pkg]
    val reopened = closed != null && now - closed < REOPEN_WINDOW_MS
    val eyebrow: String
    val line: String
    val stat: String
    val image: Int
    when {
      tampering() -> {
        eyebrow = t.clockEyebrow
        line = t.clockLine
        stat = statLine(t.stat, app, usedMin, opens)
        image = drawable("endloop_${config.roaster}_finger_wag")
      }
      reopened -> {
        val n = (reopens[pkg] ?: 0) + 1
        reopens[pkg] = n
        val secs = ((now - closed!!) / 1000).toInt()
        val ago = if (secs < 90) "$secs seconds" else "${secs / 60} minutes"
        eyebrow = t.reopenEyebrow
        line = t.reopenLines[(n - 1).coerceAtMost(t.reopenLines.size - 1)].replace("{ago}", ago)
        stat = t.reopenStat.replace("{app}", app.label).replace("{n}", n.toString())
        image = drawable("endloop_${config.roaster}_hands_on_hips")
      }
      !canSnooze -> {
        eyebrow = t.usedUpEyebrow
        line = Alerts.pickLine(app.snoozesUsedUp, app, usedMin, "No more snoozes today. This one's final.", opens)
        stat = statLine(t.stat, app, usedMin, opens)
        image = drawable("endloop_${config.roaster}_finger_wag")
      }
      else -> {
        eyebrow = t.eyebrow
        line = Alerts.pickLine(app.limitHit, app, usedMin, "That's your ${app.label} time for today.", opens)
        stat = statLine(t.stat, app, usedMin, opens)
        image = drawable("endloop_${config.roaster}_${config.intensity}")
      }
    }
    Log.i(TAG, "roast up: $pkg at $usedMin/${app.limitMin} min, opens=$opens, reopened=$reopened")
    store.logRoast(pkg, line)

    overlay.show(
      RoastCopy(
        appLabel = app.label,
        eyebrow = eyebrow,
        roast = line,
        stat = stat,
        close = config.closeLabel,
        snooze = if (canSnooze) config.snoozeLabel else null,
        note = if (canSnooze) null else t.usedUpNote,
        shareLabel = t.shareLabel,
        // facts can mention today's time: fill them now
        friction = config.friction.copy(facts = config.friction.facts.map { fillFact(it, app, usedMin) }),
        // the second snooze of the day: longer sentence, longer wait
        waitSec = if (used == 0) 10 else 20,
        second = used > 0,
        roastImage = image,
        convinceImage = drawable("endloop_${config.roaster}_convince"),
        stareImage = drawable("endloop_${config.roaster}_stopwatch"),
        readyImage = drawable("endloop_${config.roaster}_fine_go"),
        proudImage = drawable("endloop_${config.roaster}_slow_clap"),
      ),
      onClose = {
        overlayFor = null
        closedAt[pkg] = System.currentTimeMillis()
        if (!reopened) reopens[pkg] = 0
        store.addWin()
        exitFor = pkg
        exitAt = System.currentTimeMillis()
        overlay.leave()
      },
      onSnooze = { reason ->
        overlayFor = null
        // The roast had already moved the app to the background: take them back to it.
        if (sentHome) overlay.open(pkg)
        sentHome = false
        closedAt.remove(pkg)
        store.addSnooze(pkg, SNOOZE_MIN)
        store.logSnoozeReason(pkg, reason)
        Log.i(TAG, "snoozed $pkg: $reason")
      },
      onShare = {
        // The share sheet must sit above everything, so the roast steps aside for a moment.
        // A short grace stops it jumping onto the app they share to (often Instagram itself).
        overlay.hide()
        overlayFor = null
        shareGraceUntil = System.currentTimeMillis() + SHARE_GRACE_MS
        val card = ShareCard.Card(t.shareEyebrow, line, statLine(t.shareStat, app, usedMin, opens), t.shareTagline, image)
        if (!ShareCard.share(this, card, t.shareLabel)) shareGraceUntil = 0L
        Log.i(TAG, "shared roast for $pkg")
      },
      onVisible = { handler.post { leaveUnderRoast(pkg, pip) } },
    )
  }

  /** {app} {time} {weekHours} {yearDays} in a fact card, from today's usage. */
  private fun fillFact(f: Fact, app: TrackedApp, usedMin: Int): Fact {
    val week = (usedMin * 7 / 60.0).let { if (it < 10) String.format(java.util.Locale.US, "%.1f", it).removeSuffix(".0") else it.toInt().toString() }
    val year = (usedMin * 365 / 1440.0).toInt().coerceAtLeast(1).toString()
    val text = fillRoast(f.text, app, usedMin).replace("{weekHours}", week).replace("{yearDays}", year)
    return f.copy(text = text)
  }

  private fun statLine(template: String, app: TrackedApp, usedMin: Int, opens: Int): String {
    val filled = fillRoast(template, app, usedMin, opens)
    // no open count available: drop that part rather than show a raw {opens}
    return if (hasPlaceholder(filled)) filled.substringBeforeLast(" · ") else filled
  }

  // ---- H2: the browser loophole ----
  /**
   * A roast was closed (or hit) in the last 3 minutes and an untracked browser just came to the front:
   * probably the same app on its website. We can't see which site (that needs Accessibility), so nudge
   * once a day to add the browser too.
   */
  private fun maybeBrowserNudge(config: EnforcerConfig, pkg: String, now: Long) {
    if (pkg !in BROWSERS || config.app(pkg) != null || store.browserNudged()) return
    val recent = closedAt.entries.filter { now - it.value < BROWSER_WINDOW_MS }.maxByOrNull { it.value } ?: return
    val from = config.app(recent.key) ?: return
    store.markBrowserNudged()
    Notifier.nudge(
      this, Notifier.ID_BROWSER,
      config.notif.browserTitle,
      config.notif.browserText.replace("{app}", from.label),
      Alerts.character(this, config, Alerts.Pose.EXPLAIN),
    )
    Log.i(TAG, "browser right after ${from.label}'s roast: nudged")
  }

  // ---- H1: calls ----
  /** A phone call, or a VoIP call (WhatsApp, Meet, Telegram...) that set the audio mode. No permission needed. */
  private fun inCall(): Boolean {
    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    return am.mode == AudioManager.MODE_IN_CALL || am.mode == AudioManager.MODE_IN_COMMUNICATION || am.mode == AudioManager.MODE_RINGTONE
  }

  // ---- H6: clock changes ----
  private fun bootCount(): Int = runCatching { Settings.Global.getInt(contentResolver, Settings.Global.BOOT_COUNT) }.getOrDefault(-1)

  private fun tampering(): Boolean = SystemClock.elapsedRealtime() < store.tamperUntilElapsed

  /**
   * Wall clock minus time since boot only changes when the clock is moved (or after a reboot,
   * which resets the boot count). A jump of more than 30 minutes is treated as cheating: every
   * tracked app counts as over its limit until the real midnight, then the new clock is trusted.
   * Time zones don't matter (the wall clock is UTC underneath); small network corrections pass.
   */
  private fun checkClock(now: Long) {
    val elapsed = SystemClock.elapsedRealtime()
    val offset = now - elapsed
    val boot = bootCount()
    val saved = store.clockOffset
    if (saved == Long.MIN_VALUE || boot != store.bootCount) {
      // first run or a reboot: time since boot restarted, so start fresh (an old tamper window is meaningless now)
      store.clockOffset = offset
      store.bootCount = boot
      store.tamperUntilElapsed = 0L
      return
    }
    val drift = kotlin.math.abs(offset - saved)
    if (tampering()) {
      // already counting as over: just follow the clock, so moving it back doesn't trigger again later
      if (drift > 1_000L) store.clockOffset = offset
      return
    }
    if (drift > CLOCK_JUMP_MS) {
      val trustedNow = elapsed + saved
      val c = java.util.Calendar.getInstance().apply {
        timeInMillis = trustedNow
        add(java.util.Calendar.DAY_OF_YEAR, 1)
        set(java.util.Calendar.HOUR_OF_DAY, 0); set(java.util.Calendar.MINUTE, 0); set(java.util.Calendar.SECOND, 0); set(java.util.Calendar.MILLISECOND, 0)
      }
      store.tamperUntilElapsed = elapsed + (c.timeInMillis - trustedNow)
      Log.w(TAG, "clock moved by ${(offset - saved) / 60_000} min: treating tracked apps as over until real midnight")
    }
    if (drift > 1_000L) store.clockOffset = offset
  }

  // ---- H7: switched off ----
  /**
   * The watcher just (re)started. If its last heartbeat is more than 10 minutes old and the phone
   * didn't reboot in between, Endloop was off while the phone was on (force stop, killed, or turned
   * off): log the gap for the weekly roast.
   */
  private fun noteOffGap() {
    val last = store.heartbeat
    val now = System.currentTimeMillis()
    if (last <= 0L || now - last < OFF_GAP_MS) return
    val sameBoot = bootCount() == store.bootCount && SystemClock.elapsedRealtime() > now - last
    if (sameBoot) {
      store.logOffGap(last, now)
      Log.i(TAG, "watcher was off for ${(now - last) / 60_000} min")
    }
  }

  /** Loop / Lupe images live in the module's res/drawable-nodpi; 0 when missing. */
  private fun drawable(name: String): Int = resources.getIdentifier(name, "drawable", packageName)


  companion object {
    private const val TAG = "Endloop"
    private val IGNORED = setOf("android", "com.android.systemui")
    private const val TICK_MS = 4_000L
    // While the roast is up: how often we check, and how soon the app under it may be left again.
    private const val ROAST_TICK_MS = 1_000L
    private const val LEAVE_AGAIN_MS = 1_500L
    // Another app in front this long takes the roast down (two ticks, before ticks got faster under the roast).
    private const val AWAY_MS = TICK_MS
    private const val CACHE_MS = 30_000L
    private const val STATUS_MS = 60_000L
    private const val REOPEN_WINDOW_MS = 10 * 60_000L
    private const val SHARE_GRACE_MS = 90_000L
    private const val SNOOZE_MIN = 5
    // Time for a picture-in-picture window to grow back to full screen before we leave it.
    private const val PIP_EXPAND_MS = 1_200L
    private const val CLOCK_JUMP_MS = 30 * 60_000L
    private const val BROWSER_WINDOW_MS = 3 * 60_000L
    private val BROWSERS = setOf(
      "com.android.chrome", "com.chrome.beta", "org.mozilla.firefox", "com.brave.browser", "com.microsoft.emmx",
      "com.opera.browser", "com.opera.mini.native", "com.sec.android.app.sbrowser", "com.mi.globalbrowser",
      "com.android.browser", "com.UCMobile.intl", "com.heytap.browser", "com.vivo.browser", "com.duckduckgo.mobile.android",
    )
    private const val OFF_GAP_MS = 10 * 60_000L

    /** Start only when there's something to watch. */
    fun start(context: Context) {
      val cfg = Store(context).config
      if (cfg == null || !cfg.enabled || cfg.apps.isEmpty()) return
      ContextCompat.startForegroundService(context, Intent(context, EnforcerService::class.java))
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, EnforcerService::class.java))
    }
  }
}
