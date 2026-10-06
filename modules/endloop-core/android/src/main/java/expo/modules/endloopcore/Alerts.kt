package expo.modules.endloopcore

import android.content.Context
import android.util.Log

/**
 * Screen 8 notifications, built in one place so the watcher and the in-app
 * "Test notifications" buttons send exactly the same thing.
 */
object Alerts {
  private const val TAG = "Endloop"

  enum class Pose { HEADS_UP, LAST_CALL, LATE_NIGHT, WEEKLY, EXPLAIN }

  fun drawable(context: Context, name: String): Int =
    context.resources.getIdentifier(name, "drawable", context.packageName)

  /** A random line, filled in; lines that would still show a raw {placeholder} are never used. */
  fun pickLine(lines: List<String>, app: TrackedApp, usedMin: Int, fallback: String, opens: Int = -1): String {
    val ok = lines.map { fillRoast(it, app, usedMin, opens) }.filterNot { hasPlaceholder(it) }
    return if (ok.isEmpty()) fallback else ok.random()
  }

  /** Which still of the user's roaster each notification uses (mockups, Screen 8). */
  fun character(context: Context, config: EnforcerConfig, pose: Pose): Int {
    val name = when (pose) {
      Pose.HEADS_UP -> "ahem"
      Pose.LAST_CALL -> "hourglass"
      Pose.LATE_NIGHT -> "yawning"
      Pose.WEEKLY -> "envelope"
      Pose.EXPLAIN -> "wave"
    }
    return drawable(context, "endloop_${config.roaster}_$name")
  }

  /** 75% heads up, or the 90% last call. */
  fun warning(context: Context, config: EnforcerConfig, app: TrackedApp, usedMin: Int, last: Boolean) {
    val n = config.notif
    Notifier.rich(
      context,
      id = app.packageName.hashCode() + if (last) 90 else 75,
      type = if (last) Notifier.Type.LAST_CALL else Notifier.Type.HEADS_UP,
      title = fillRoast(if (last) n.lastCallTitle else n.headsUpTitle, app, usedMin),
      text = if (last) {
        pickLine(app.lastCall, app, usedMin, "${app.limitMin - usedMin} minutes left. Make them count.")
      } else {
        pickLine(app.headsUp, app, usedMin, "You're at 75% of today's ${app.label} limit.")
      },
      label = if (last) n.lastCallLabel else n.headsUpLabel,
      big = if (last) "90%" else "75%",
      character = character(context, config, if (last) Pose.LAST_CALL else Pose.HEADS_UP),
      homeAction = n.putDown,
      openAction = n.open,
    )
    Log.i(TAG, "${if (last) "last_call" else "heads_up"}: ${app.packageName} at $usedMin/${app.limitMin} min")
  }

  fun lateNight(context: Context, config: EnforcerConfig, app: TrackedApp, usedMin: Int, now: Long) {
    val n = config.notif
    Notifier.rich(
      context, Notifier.ID_LATE_NIGHT, Notifier.Type.LATE_NIGHT,
      title = fillRoast(n.lateNightTitle, app, usedMin),
      text = pickLine(app.lateNight, app, usedMin, "The feed will still be there tomorrow. Your sleep won't."),
      label = n.lateNightLabel,
      big = java.text.SimpleDateFormat("h:mm", java.util.Locale.US).format(java.util.Date(now)),
      character = character(context, config, Pose.LATE_NIGHT),
      homeAction = n.goSleep,
      openAction = n.open,
    )
  }

  /** Minutes on tracked apps over the last 7 days, from our own daily summaries. */
  fun weekTotal(context: Context, config: EnforcerConfig, now: Long): Int {
    val store = Store(context)
    val today = UsageReader.startOfToday(now)
    val pkgs = config.apps.map { it.packageName }
    return (0 until 7).sumOf { i -> store.day(dayKey(today - i * 86_400_000L)).filterKeys { it in pkgs }.values.sum() }
  }

  fun weekly(context: Context, config: EnforcerConfig, totalMin: Int) {
    val h = totalMin / 60
    val m = totalMin % 60
    val big = if (h > 0) "${h}h ${m}m" else "${m}m"
    val n = config.notif
    Notifier.rich(
      context, Notifier.ID_WEEKLY, Notifier.Type.WEEKLY,
      title = n.weeklyTitle,
      text = n.weeklyText,
      label = n.weeklyLabel,
      big = big,
      character = character(context, config, Pose.WEEKLY),
      homeAction = null,
      openAction = n.weeklyOpen,
      link = "endloop://weekly",
    )
    Log.i(TAG, "weekly roast sent: $big")
  }

  /**
   * Dev/testing: send one notification right now, with the first tracked app and
   * believable numbers. Ignores the Settings toggles and the once-a-day rules.
   * Returns false when there's no config yet (onboarding not finished).
   */
  fun test(context: Context, kind: String): Boolean {
    val config = Store(context).config ?: return false
    val app = config.apps.firstOrNull() ?: return false
    Notifier.ensureChannels(context)
    val now = System.currentTimeMillis()
    when (kind) {
      "heads_up" -> warning(context, config, app, (app.limitMin * 0.75).toInt().coerceAtLeast(1), last = false)
      "last_call" -> warning(context, config, app, (app.limitMin * 0.9).toInt().coerceAtLeast(1), last = true)
      "late_night" -> lateNight(context, config, app, app.limitMin / 2, now)
      "weekly" -> weekly(context, config, weekTotal(context, config, now).takeIf { it > 0 } ?: 754)
      "explain" -> Notifier.explain(context, config.notif.explainTitle, config.notif.explainText, character(context, config, Pose.EXPLAIN))
      else -> return false
    }
    Log.i(TAG, "test notification: $kind")
    return true
  }
}
