package expo.modules.endloopcore

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import androidx.core.graphics.drawable.toBitmap
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

/** JS bridge for Endloop's native core: usage data, permission checks and the watcher service. */
class EndloopCoreModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("EndloopCore")

    // ---- permission checks ----
    Function<Boolean>("hasUsageAccess") { UsageReader.hasAccess(context) }
    Function<Boolean>("canDrawOverlays") { Settings.canDrawOverlays(context) }
    Function<Boolean>("isIgnoringBatteryOptimizations") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }
    Function<Boolean>("areNotificationsEnabled") { NotificationManagerCompat.from(context).areNotificationsEnabled() }

    // ---- open the right Settings page ----
    AsyncFunction<Unit>("openUsageAccessSettings") {
      // Android 10+ can jump straight to Endloop's row on most phones; fall back to the list.
      open(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.parse("package:${context.packageName}")))
        || open(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    }.runOnQueue(Queues.MAIN)
    AsyncFunction<Unit>("openOverlaySettings") {
      open(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}")))
        || open(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION))
    }.runOnQueue(Queues.MAIN)
    AsyncFunction<Unit>("openBatterySettings") {
      open(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        || open(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
    }.runOnQueue(Queues.MAIN)

    // ---- usage data ----
    /** Launcher apps with their total foreground time over the last `days` days, worst first. */
    AsyncFunction("listApps") { days: Int ->
      val end = System.currentTimeMillis()
      val start = UsageReader.startOfToday(end) - (days - 1).coerceAtLeast(0) * DAY_MS
      val totals = UsageReader.foregroundMs(context, start, end)
      val pm = context.packageManager
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val seen = HashSet<String>()
      pm.queryIntentActivities(launcher, 0)
        .mapNotNull { ri ->
          val pkg = ri.activityInfo.packageName
          if (Protected.isProtected(context, pkg) || !seen.add(pkg)) return@mapNotNull null
          mapOf(
            "packageName" to pkg,
            "label" to ri.loadLabel(pm).toString(),
            "totalMs" to (totals[pkg] ?: 0L).toDouble(),
            "iconUri" to iconUri(pm, pkg),
          )
        }
        .sortedByDescending { it["totalMs"] as Double }
    }

    /** Minutes used today (since local midnight) for each package. */
    AsyncFunction("todayMinutes") { packages: List<String> ->
      val end = System.currentTimeMillis()
      val totals = UsageReader.foregroundMs(context, UsageReader.startOfToday(end), end, packages.toSet())
      packages.associateWith { ((totals[it] ?: 0L) / 60_000.0) }
    }

    /**
     * Screen 11, app detail: minutes per day for the last [days] days (oldest first, today last),
     * today's opens and longest session, and minutes by part of day over the whole period.
     */
    AsyncFunction("appDetail") { pkg: String, days: Int ->
      val now = System.currentTimeMillis()
      val today = UsageReader.startOfToday(now)
      val n = days.coerceIn(1, 14)
      val start = today - (n - 1) * DAY_MS
      val sessions = UsageReader.sessions(context, start, now, pkg)

      val daily = LongArray(n)
      val parts = LongArray(4) // morning 6–12, afternoon 12–17, evening 17–22, late night 22–6
      val cal = java.util.Calendar.getInstance()
      var longestToday = 0L
      for ((from, to) in sessions) {
        if (to > today) longestToday = maxOf(longestToday, to - maxOf(from, today))
        // walk the session a minute at a time: simple, and a week is only a few thousand minutes
        var t = from
        while (t < to) {
          val step = minOf(60_000L, to - t)
          val dayIndex = ((t - start) / DAY_MS).toInt().coerceIn(0, n - 1)
          daily[dayIndex] += step
          cal.timeInMillis = t
          val h = cal.get(java.util.Calendar.HOUR_OF_DAY)
          val part = when (h) { in 6..11 -> 0; in 12..16 -> 1; in 17..21 -> 2; else -> 3 }
          parts[part] += step
          t += step
        }
      }
      mapOf(
        "daily" to daily.mapIndexed { i, ms -> mapOf("day" to (start + i * DAY_MS).toDouble(), "minutes" to ms / 60_000.0) },
        "opensToday" to UsageReader.opens(context, today, now, pkg),
        "longestTodayMin" to longestToday / 60_000.0,
        "parts" to parts.map { it / 60_000.0 },
      )
    }

    /**
     * Screen 12: the last [days] days (oldest first) with minutes per tracked app, roasts, snoozes and
     * wins. Recent days are read fresh from Android (and saved); older ones come from our own summary.
     */
    AsyncFunction("history") { days: Int, packages: List<String> ->
      val store = Store(context)
      val now = System.currentTimeMillis()
      val today = UsageReader.startOfToday(now)
      val n = days.coerceIn(1, 62)
      val set = packages.toSet()
      fun countByDay(json: String): Map<String, Int> {
        val arr = runCatching { org.json.JSONArray(json) }.getOrDefault(org.json.JSONArray())
        val out = HashMap<String, Int>()
        for (i in 0 until arr.length()) {
          val o = arr.optJSONObject(i) ?: continue
          if (set.isNotEmpty() && o.optString("packageName") !in set) continue
          val k = dayKey(o.optLong("at"))
          out[k] = (out[k] ?: 0) + 1
        }
        return out
      }
      val roasts = countByDay(store.roastLogJson)
      val snoozes = countByDay(store.snoozeLogJson)
      (0 until n).map { i ->
        val start = today - (n - 1 - i) * DAY_MS
        val key = dayKey(start)
        val apps: Map<String, Int> = if (i >= n - 8) {
          val end = minOf(start + DAY_MS, now)
          val live = UsageReader.foregroundMs(context, start, end, set).mapValues { (it.value / 60_000L).toInt() }
          store.saveDay(key, live)
          store.day(key).filterKeys { it in set }
        } else {
          store.day(key).filterKeys { it in set }
        }
        mapOf(
          "day" to start.toDouble(),
          "apps" to apps,
          "roasts" to (roasts[key] ?: 0),
          "snoozes" to (snoozes[key] ?: 0),
          "wins" to store.wins(key),
        )
      }
    }

    /** JSON array of { packageName, text, at } for every roast shown (Hall of shame). */
    Function<String>("roastLog") { Store(context).roastLogJson }

    /** Share a past roast as the story card (Hall of shame). */
    AsyncFunction("shareRoast") { text: String, stat: String ->
      val cfg = Store(context).config
      val t = cfg?.roastText ?: RoastText.DEFAULT
      val res = context.resources.getIdentifier("endloop_${cfg?.roaster ?: "loop"}_${cfg?.intensity ?: "honest"}", "drawable", context.packageName)
      ShareCard.share(context, ShareCard.Card(t.shareEyebrow, text, stat, t.shareTagline, res), t.shareLabel)
    }

    /** Screen 13: the weekly card. `share` true = share sheet, false = save to Pictures/Endloop. */
    AsyncFunction("weeklyCard") { json: String, share: Boolean ->
      val o = org.json.JSONObject(json)
      val cfg = Store(context).config
      val res = context.resources.getIdentifier(o.optString("character", "endloop_${cfg?.roaster ?: "loop"}_savage"), "drawable", context.packageName)
      val card = ShareCard.Weekly(
        dates = o.optString("dates"),
        total = o.optString("total"),
        worst = o.optString("worst"),
        win = o.optString("win"),
        roast = o.optString("roast"),
        tagline = o.optString("tagline", "Get roasted too → endloop app"),
        character = res,
      )
      val bmp = ShareCard.renderWeekly(context, card)
      if (share) ShareCard.shareBitmap(context, bmp, o.optString("shareTitle", "Share your roast")) else ShareCard.save(context, bmp)
    }

    /** Settings → Delete all my data: stop watching, wipe our storage and cached cards/icons. */
    AsyncFunction<Unit>("clearData") {
      EnforcerService.stop(context)
      Store(context).clearAll()
      runCatching { java.io.File(context.cacheDir, "roasts").deleteRecursively() }
      runCatching { java.io.File(context.cacheDir, "app-icons").deleteRecursively() }
      runCatching { androidx.core.app.NotificationManagerCompat.from(context).cancelAll() }
      AppIcon.request(context, "default")
    }

    // ---- testing: send any Screen 8 notification now ----
    /** kind: heads_up | last_call | late_night | weekly | explain. False if onboarding isn't finished. */
    AsyncFunction("testNotification") { kind: String -> Alerts.test(context, kind) }

    // ---- Screen 17: app icon ----
    /** False until a `prebuild --clean` build includes the icon aliases. */
    Function<Boolean>("appIconSupported") { AppIcon.supported(context) }
    /** "default" | "loop" | "lupe": what the user picked (it may still be waiting to apply). */
    Function<String>("appIcon") { AppIcon.chosen(context) }
    /** Saved now, applied when Endloop goes to the background. */
    Function("setAppIcon") { name: String -> AppIcon.request(context, name) }
    OnActivityEntersBackground { appContext.reactContext?.let { AppIcon.applyPending(it) } }

    /** Screen 16: tracked apps that are still installed (uninstalled ones are dropped quietly). */
    Function("installed") { packages: List<String> ->
      packages.filter { pkg ->
        runCatching { context.packageManager.getApplicationInfo(pkg, 0); true }.getOrDefault(false)
      }
    }

    // ---- the watcher ----
    /** Save limits and roast lines where the service can read them, then refresh the service. */
    AsyncFunction("setConfig") { json: String ->
      val store = Store(context)
      store.configJson = json
      val cfg = store.config
      if (cfg?.enabled == true && cfg.apps.isNotEmpty()) EnforcerService.start(context) else EnforcerService.stop(context)
    }
    AsyncFunction<Unit>("startWatcher") { EnforcerService.start(context) }
    AsyncFunction<Unit>("stopWatcher") { EnforcerService.stop(context) }
    /** Last time the watcher ticked (ms since epoch); 0 if it never ran. Older than a minute means the phone killed it. */
    /** JSON array of { packageName, reason, at } from the "Convince me" step. */
    Function<String>("snoozeLog") { Store(context).snoozeLogJson }
    Function<Double>("lastHeartbeat") { Store(context).heartbeat.toDouble() }
  }

  /**
   * Open a Settings page on top of Endloop's own activity (not as a separate new task:
   * some Android versions close the overlay page straight away when it's started that way).
   */
  private fun open(intent: Intent): Boolean = try {
    val activity = appContext.currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
    true
  } catch (_: Exception) {
    false
  }

  /** App icon as a small PNG in the cache folder, returned as a file:// URI for <Image>. */
  private fun iconUri(pm: PackageManager, pkg: String): String? = try {
    val dir = File(context.cacheDir, "app-icons").apply { mkdirs() }
    val file = File(dir, "$pkg.png")
    if (!file.exists()) {
      val bmp = pm.getApplicationIcon(pkg).toBitmap(96, 96, Bitmap.Config.ARGB_8888)
      FileOutputStream(file).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
    Uri.fromFile(file).toString()
  } catch (_: Exception) {
    null
  }

  companion object {
    private const val DAY_MS = 24L * 60 * 60 * 1000
  }
}
