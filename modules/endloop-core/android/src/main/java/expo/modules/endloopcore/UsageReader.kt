package expo.modules.endloopcore

import android.Manifest
import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import java.util.Calendar

/**
 * Screen time from UsageStatsManager events.
 *
 * We count time between "activity resumed" and "activity paused" per package, and close every
 * open session when the screen turns off. This is more accurate than the daily buckets from
 * queryUsageStats, which lag and double count on some phones. ACTIVITY_STOPPED is ignored on
 * purpose: it arrives late when moving between screens of the same app and would cut sessions.
 */
object UsageReader {
  // UsageEvents.Event constants, kept as ints so they work on every API level we support.
  private const val RESUMED = 1 // ACTIVITY_RESUMED / MOVE_TO_FOREGROUND
  private const val PAUSED = 2 // ACTIVITY_PAUSED / MOVE_TO_BACKGROUND
  private const val SCREEN_NON_INTERACTIVE = 16 // API 28
  private const val DEVICE_SHUTDOWN = 26 // API 29

  fun hasAccess(context: Context): Boolean {
    val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    return mode == AppOpsManager.MODE_ALLOWED ||
      (mode == AppOpsManager.MODE_DEFAULT &&
        context.checkCallingOrSelfPermission(Manifest.permission.PACKAGE_USAGE_STATS) == PackageManager.PERMISSION_GRANTED)
  }

  fun startOfToday(now: Long = System.currentTimeMillis()): Long {
    val c = Calendar.getInstance()
    c.timeInMillis = now
    c.set(Calendar.HOUR_OF_DAY, 0)
    c.set(Calendar.MINUTE, 0)
    c.set(Calendar.SECOND, 0)
    c.set(Calendar.MILLISECOND, 0)
    return c.timeInMillis
  }

  /** Foreground milliseconds per package between [start] and [end]. `only` limits the packages counted. */
  fun foregroundMs(context: Context, start: Long, end: Long, only: Set<String>? = null): Map<String, Long> {
    if (!hasAccess(context)) return emptyMap()
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = usm.queryEvents(start, end) ?: return emptyMap()
    val totals = HashMap<String, Long>()
    val open = HashMap<String, Long>() // package -> resumed at
    val seen = HashSet<String>()
    val e = UsageEvents.Event()

    fun close(pkg: String, at: Long) {
      val from = open.remove(pkg) ?: return
      if (at > from) totals[pkg] = (totals[pkg] ?: 0L) + (at - from)
    }
    fun closeAll(at: Long) = open.keys.toList().forEach { close(it, at) }

    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      val pkg = e.packageName ?: continue
      when (e.eventType) {
        RESUMED -> {
          if (!open.containsKey(pkg)) closeAll(e.timeStamp)
          if (only == null || pkg in only) {
            if (!open.containsKey(pkg)) open[pkg] = e.timeStamp
          }
          seen.add(pkg)
        }
        PAUSED -> {
          if (open.containsKey(pkg)) {
            close(pkg, e.timeStamp)
          } else if (pkg !in seen && open.isEmpty() && (only == null || pkg in only)) {
            // first thing we see is a pause: the session started before the window (e.g. before midnight)
            totals[pkg] = (totals[pkg] ?: 0L) + (e.timeStamp - start).coerceAtLeast(0L)
          }
          seen.add(pkg)
        }
        SCREEN_NON_INTERACTIVE, DEVICE_SHUTDOWN -> closeAll(e.timeStamp)
      }
    }
    closeAll(end)
    return totals
  }

  /**
   * Every foreground session of [pkg] between [start] and [end] as (from, to) pairs, using the same
   * rules as [foregroundMs]: resumed → paused, cut at screen off; a session open at [end] ends there.
   */
  fun sessions(context: Context, start: Long, end: Long, pkg: String): List<Pair<Long, Long>> {
    if (!hasAccess(context)) return emptyList()
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = usm.queryEvents(start, end) ?: return emptyList()
    val out = ArrayList<Pair<Long, Long>>()
    var openAt = -1L
    var seen = false
    val e = UsageEvents.Event()
    fun closeAt(t: Long) {
      if (openAt >= 0 && t > openAt) out.add(openAt to t)
      openAt = -1L
    }
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      when (e.eventType) {
        RESUMED -> {
          if (e.packageName == pkg) {
            if (openAt < 0) openAt = e.timeStamp
          } else {
            closeAt(e.timeStamp)
          }
          if (e.packageName == pkg) seen = true
        }
        PAUSED -> if (e.packageName == pkg) {
          if (openAt >= 0) closeAt(e.timeStamp) else if (!seen) out.add(start to e.timeStamp)
          seen = true
        }
        SCREEN_NON_INTERACTIVE, DEVICE_SHUTDOWN -> closeAt(e.timeStamp)
      }
    }
    closeAt(end)
    return out
  }

  /**
   * How many times [pkg] was opened between [start] and [end]: each time it came to the front
   * from another app, the home screen or a screen-off. Moving between its own screens doesn't count.
   */
  fun opens(context: Context, start: Long, end: Long, pkg: String): Int {
    if (!hasAccess(context)) return 0
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = usm.queryEvents(start, end) ?: return 0
    val e = UsageEvents.Event()
    var last: String? = null
    var count = 0
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      when (e.eventType) {
        RESUMED -> {
          if (e.packageName == pkg && last != pkg) count++
          last = e.packageName
        }
        SCREEN_NON_INTERACTIVE, DEVICE_SHUTDOWN -> last = null
      }
    }
    return count
  }

  /**
   * Walk events from [from] to [to] and return the app in front at the end, starting from [current].
   * The watcher calls this every tick with only the new events, so an app used for an hour without
   * any new events stays "current" (a fixed look-back window would forget it).
   */
  fun advanceForeground(context: Context, current: String?, from: Long, to: Long): String? {
    if (!hasAccess(context)) return null
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = usm.queryEvents(from, to) ?: return current
    var fg = current
    val e = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      when (e.eventType) {
        RESUMED -> fg = e.packageName
        PAUSED -> if (e.packageName == fg) fg = null
        SCREEN_NON_INTERACTIVE, DEVICE_SHUTDOWN -> fg = null
      }
    }
    return fg
  }
}
