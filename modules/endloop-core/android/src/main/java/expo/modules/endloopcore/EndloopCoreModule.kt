package expo.modules.endloopcore

import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
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
    // Both come back to Endloop by themselves once the switch is on (PermissionReturn).
    AsyncFunction<Unit>("openUsageAccessSettings") {
      // Android 10+ can jump straight to Endloop's row on most phones; fall back to the list.
      val opened = open(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.parse("package:${context.packageName}")))
        || open(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
      if (opened) PermissionReturn.start(context, PermissionReturn.Kind.USAGE)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction<Unit>("openOverlaySettings") {
      val opened = open(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}")))
        || open(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION))
      if (opened) PermissionReturn.start(context, PermissionReturn.Kind.OVERLAY)
    }.runOnQueue(Queues.MAIN)
    // Back in Endloop (by itself or by the user): no need to keep watching.
    OnActivityEntersForeground { PermissionReturn.stop("Endloop in front") }

    /** Settings → Status notification: the system page for just the "Loop is watching" channel. */
    AsyncFunction<Unit>("openStatusNotificationSettings") {
      open(
        Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
          .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
          .putExtra(Settings.EXTRA_CHANNEL_ID, Notifier.CHANNEL_WATCHING)
      ) || open(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName))
    }.runOnQueue(Queues.MAIN)

    // ---- where Endloop was installed from ----
    /** Package of the store that installed Endloop ("com.android.vending" for Play), or null when sideloaded. */
    Function<String?>("installSource") { installer() }
    /**
     * Android 13+ greys out Usage access and Display over other apps until the user allows
     * "restricted settings" in App info, but only for APKs installed from a file or a download.
     * Store installs (Play, Galaxy Store...) and adb installs aren't affected, so check the
     * install source Android recorded rather than just "not the Play Store".
     */
    Function<Boolean>("isRestrictedSettingsLikely") {
      if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.TIRAMISU) return@Function false
      val source = runCatching { context.packageManager.getInstallSourceInfo(context.packageName).packageSource }
        .getOrDefault(PackageInstaller.PACKAGE_SOURCE_UNSPECIFIED)
      when (source) {
        PackageInstaller.PACKAGE_SOURCE_LOCAL_FILE, PackageInstaller.PACKAGE_SOURCE_DOWNLOADED_FILE -> true
        PackageInstaller.PACKAGE_SOURCE_UNSPECIFIED -> installer().let { it != null && it != PLAY_STORE }
        else -> false // a store or other trusted source
      }
    }
    /**
     * Endloop's own App info page (Battery → Unrestricted, 2 taps) instead of the full optimisation list,
     * and back to Endloop by itself once it's exempt. No REQUEST_IGNORE_BATTERY_OPTIMIZATIONS:
     * Play only allows that one-tap dialog for some app categories, and screen-time apps aren't one.
     */
    AsyncFunction<Unit>("openBatterySettings") {
      val opened = open(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
        || open(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
      if (opened) PermissionReturn.startBattery(context)
    }.runOnQueue(Queues.MAIN)
    /**
     * The phone maker's own autostart / background page (Xiaomi, Oppo/Realme, Vivo/iQOO, OnePlus, Samsung).
     * Component names differ by OS version, so try each and fall back to App info. False if nothing opened.
     */
    AsyncFunction<Boolean>("openBrandBackgroundSettings") {
      val brand = (android.os.Build.MANUFACTURER ?: "").lowercase()
      val candidates = BRAND_PAGES.filter { (key, _) -> key.any { brand.contains(it) } }.flatMap { it.second }
      candidates.any { (pkg, cls) -> open(Intent().setClassName(pkg, cls)) }
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

    /**
     * Screen 21 share cards (roast, milestone, leave, weekly), square 1080×1080, from a JSON description (see ShareCard.render).
     * `share` true = share sheet, false = save to Pictures/Endloop.
     */
    AsyncFunction("shareCard") { json: String, share: Boolean ->
      val o = org.json.JSONObject(json)
      val bmp = ShareCard.render(context, o)
      if (share) ShareCard.shareBitmap(context, bmp, o.optString("shareTitle", "Share")) else ShareCard.save(context, bmp)
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
    /** H7: JSON array of { from, to } when Endloop was off while the phone was on. */
    Function<String>("offGaps") { Store(context).offGapsJson }

    // ---- the snooze ladder (src/app/snooze.tsx) ----
    /** Snoozes today across all apps: which ladder step comes next (it resets at midnight). */
    Function<Int>("snoozesToday") { Store(context).snoozesToday() }
    /** Won the step (or waited it out): snooze this app for [minutes] and log the reason. */
    Function("grantSnooze") { pkg: String, minutes: Int, reason: String ->
      val store = Store(context)
      store.addSnooze(pkg, minutes.coerceIn(1, 15))
      store.logSnoozeReason(pkg, reason)
    }
    /** Bunk today: no roasts for this app until midnight. [how] = "leave" | "timeout" | "payback" (logged). */
    Function("bunk") { pkg: String, how: String ->
      val store = Store(context)
      store.bunk(pkg)
      store.logSnoozeReason(pkg, "bunk:$how")
    }
    /** "Never mind, close it" in the snooze screen: a win for the day, like closing the roast. */
    Function<Unit>("addWin") { Store(context).addWin() }
    /** "Never mind, close it" in the snooze screen: straight to the home screen, not back to the app being snoozed. */
    Function<Boolean>("goHome") {
      runCatching {
        context.startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }.isSuccess
    }
    /** Back to the app the snooze was for. False if it can't be opened. */
    Function("openApp") { pkg: String ->
      val launch = context.packageManager.getLaunchIntentForPackage(pkg) ?: return@Function false
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
      runCatching { context.startActivity(launch) }.isSuccess
    }
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

  private fun installer(): String? = runCatching {
    val pm = context.packageManager
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
      pm.getInstallSourceInfo(context.packageName).installingPackageName
    } else {
      @Suppress("DEPRECATION")
      pm.getInstallerPackageName(context.packageName)
    }
  }.getOrNull()

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
    private const val PLAY_STORE = "com.android.vending"

    /** Known autostart / background pages per brand (dontkillmyapp.com). First one that opens wins. */
    private val BRAND_PAGES: List<Pair<List<String>, List<Pair<String, String>>>> = listOf(
      listOf("xiaomi", "redmi", "poco") to listOf(
        "com.miui.securitycenter" to "com.miui.permcenter.autostart.AutoStartManagementActivity",
      ),
      listOf("oppo", "realme", "oneplus") to listOf(
        "com.coloros.safecenter" to "com.coloros.safecenter.permission.startup.StartupAppListActivity",
        "com.coloros.safecenter" to "com.coloros.safecenter.startupapp.StartupAppListActivity",
        "com.oppo.safe" to "com.oppo.safe.permission.startup.StartupAppListActivity",
        "com.oneplus.security" to "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity",
      ),
      listOf("vivo", "iqoo") to listOf(
        "com.vivo.permissionmanager" to "com.vivo.permissionmanager.activity.BgStartUpManagerActivity",
        "com.iqoo.secure" to "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager",
        "com.iqoo.secure" to "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity",
      ),
      listOf("samsung") to listOf(
        "com.samsung.android.lool" to "com.samsung.android.sm.battery.ui.BatteryActivity",
        "com.samsung.android.lool" to "com.samsung.android.sm.ui.battery.BatteryActivity",
      ),
    )
  }
}
