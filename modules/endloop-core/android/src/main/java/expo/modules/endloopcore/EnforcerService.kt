package expo.modules.endloopcore

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
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

  // Today's usage for the app in front, refreshed at most every CACHE_MS.
  private var cachedPkg: String? = null
  private var cachedAt = 0L
  private var cachedMs = 0L

  // The app the roast is currently covering, and how many ticks in a row another app was in front.
  private var overlayFor: String? = null
  private var awayTicks = 0
  private var homePkg: String? = null
  // The app in front hid our roast (it hides overlays), so we sent the user home to show it there.
  @Volatile private var sentHome = false

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
      } catch (_: Exception) {
        // never let one bad tick kill the watcher
      }
      store.heartbeat = System.currentTimeMillis()
      handler.postDelayed(this, TICK_MS)
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

    val from = if (eventsUpTo == 0L) UsageReader.startOfToday(now) else eventsUpTo
    val pkg = UsageReader.advanceForeground(this, foreground, from, now)
    eventsUpTo = now

    if (overlay.isShowing) keepOrDropRoast(pkg)
    if (pkg != foreground) {
      Log.d(TAG, "foreground: $foreground -> $pkg")
      foreground = pkg
      cachedAt = 0L
    }
    if (pkg == null || Protected.isProtected(this, pkg)) return
    val app = config.app(pkg) ?: return

    if (pkg != cachedPkg || cachedAt == 0L || now - cachedAt > CACHE_MS) {
      cachedMs = UsageReader.foregroundMs(this, UsageReader.startOfToday(now), now, setOf(pkg))[pkg] ?: 0L
      cachedPkg = pkg
      cachedAt = now
    }
    val usedMin = ((cachedMs + (now - cachedAt)) / 60_000L).toInt()
    val pct = usedMin.toDouble() / app.limitMin.coerceAtLeast(1)

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
    val status = config.apps.joinToString(" · ") { a ->
      val used = ((totals[a.packageName] ?: 0L) / 60_000L).toInt()
      if (used >= a.limitMin) "${a.label} ${config.notif.over}" else "${a.label} $used/${a.limitMin} min"
    }
    Notifier.updateService(this, config.notif.watchingTitle, status)
    // keep our own daily summary for Stats (Android only keeps about a week of detail)
    store.saveDay(dayKey(now), totals.mapValues { (it.value / 60_000L).toInt() })
  }


  /**
   * The roast stays up until Close / snooze, or until the user has really moved on:
   * - home screen, recents, a call, Settings and other protected apps take it down at once
   *   (never cover an incoming call or the way to change permissions);
   * - while the user is answering "Convince me" it stays, whatever the app underneath does
   *   (Settings opened its search activity by itself and closed the step mid-answer);
   * - any other app must be in front for two ticks in a row, so short blips don't flash it.
   */
  private fun keepOrDropRoast(pkg: String?) {
    if (pkg == null || pkg == overlayFor || pkg in IGNORED) {
      awayTicks = 0
      return
    }
    // We moved the user to the home screen so the roast could show: keep it up there.
    if (sentHome && pkg == homePkg) {
      awayTicks = 0
      return
    }
    awayTicks++
    val now = pkg == homePkg || Protected.isProtected(this, pkg)
    if (now || (!overlay.busy && awayTicks >= 2)) {
      Log.i(TAG, "roast down: $pkg in front (was $overlayFor)")
      overlay.hide()
      overlayFor = null
      awayTicks = 0
      sentHome = false
    }
  }

  /**
   * Apps like Files ask Android to hide overlays from other apps, so the roast was drawn but
   * invisible until the user left. Instead: take them to the home screen, where it shows.
   * Skipped when the phone is locked or the screen is off (the lock screen hides overlays too).
   */
  private fun sendHomeForRoast() {
    val pkg = overlayFor ?: return
    if (sentHome || !overlay.isShowing) return
    val pm = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
    val km = getSystemService(Context.KEYGUARD_SERVICE) as android.app.KeyguardManager
    if (!pm.isInteractive || km.isKeyguardLocked) return
    sentHome = true
    try {
      startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      Log.i(TAG, "roast hidden by $pkg; sent home to show it")
    } catch (e: Exception) {
      Log.w(TAG, "couldn't go home", e)
    }
  }

  private fun roast(config: EnforcerConfig, app: TrackedApp, usedMin: Int, now: Long) {
    if (overlay.isShowing || now < store.snoozedUntil(app.packageName) || now < shareGraceUntil) return
    val pkg = app.packageName
    overlayFor = pkg
    awayTicks = 0
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
        overlay.goHome()
      },
      onSnooze = { reason ->
        overlayFor = null
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

  /** Loop / Lupe images live in the module's res/drawable-nodpi; 0 when missing. */
  private fun drawable(name: String): Int = resources.getIdentifier(name, "drawable", packageName)


  companion object {
    private const val TAG = "Endloop"
    private val IGNORED = setOf("android", "com.android.systemui")
    private const val TICK_MS = 4_000L
    private const val CACHE_MS = 30_000L
    private const val STATUS_MS = 60_000L
    private const val REOPEN_WINDOW_MS = 10 * 60_000L
    private const val SHARE_GRACE_MS = 90_000L
    private const val SNOOZE_MIN = 5

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
