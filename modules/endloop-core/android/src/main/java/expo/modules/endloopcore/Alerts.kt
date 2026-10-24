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

  /** "Instagram ↓ 32%, YouTube ↑ 12%.": the two biggest swings vs the week before (5% or more). */
  fun appSwing(context: Context, config: EnforcerConfig, now: Long): String {
    val store = Store(context)
    val today = UsageReader.startOfToday(now)
    fun sum(pkg: String, from: Int) = (from until from + 7).sumOf { i -> store.day(dayKey(today - i * 86_400_000L))[pkg] ?: 0 }
    return config.apps
      .map { a -> Triple(a.label, sum(a.packageName, 0), sum(a.packageName, 7)) }
      .filter { it.third > 0 }
      .map { (label, now7, before) -> label to Math.round((now7 - before) * 100.0 / before).toInt() }
      .filter { kotlin.math.abs(it.second) >= 5 }
      .sortedByDescending { kotlin.math.abs(it.second) }
      .take(2)
      .joinToString(", ") { (label, ch) -> "$label ${if (ch > 0) "↑" else "↓"} ${kotlin.math.abs(ch)}%" }
      .let { if (it.isEmpty()) it else "$it." }
  }

  /** Sunday 7 pm: the weekly roast and the Loops last call in one notification (Product Book A7). */
  fun weekly(context: Context, config: EnforcerConfig, totalMin: Int, now: Long = System.currentTimeMillis()) {
    val h = totalMin / 60
    val m = totalMin % 60
    val big = if (h > 0) "${h}h ${m}m" else "${m}m"
    val n = config.notif
    val swing = runCatching { appSwing(context, config, now) }.getOrDefault("")
    val loops = config.loopsFor(mondayKey(now))
    val tail = if (loops != null && loops > 0 && !config.loopsCarry) n.weeklyLoopsTail.replace("{n}", loops.toString()) else ""
    val text = if (swing.isEmpty() && tail.isEmpty()) n.weeklyText else listOf(n.weeklyIn, swing, tail).filter { it.isNotBlank() }.joinToString(" ")
    Notifier.rich(
      context, Notifier.ID_WEEKLY, Notifier.Type.WEEKLY,
      title = n.weeklyTitle,
      text = text,
      label = n.weeklyLabel,
      big = big,
      character = character(context, config, Pose.WEEKLY),
      homeAction = null,
      openAction = n.weeklyOpen,
      link = "endloop://weekly",
    )
    Log.i(TAG, "weekly roast sent: $big")
  }

  /** Saturday 10 am: "You've got 180 Loops. Write a Leave Letter!" Only when the app told us this week's Loops. */
  fun loopsReminder(context: Context, config: EnforcerConfig, now: Long): Boolean {
    val loops = config.loopsFor(mondayKey(now)) ?: return false
    if (loops <= 0) return false
    val n = config.notif
    val enough = loops >= config.letterCost
    val title = (if (enough) n.loopsTitleEnough else n.loopsTitleShort)
      .replace("{n}", loops.toString())
      .replace("{short}", (config.letterCost - loops).coerceAtLeast(0).toString())
    Notifier.rich(
      context, Notifier.ID_LOOPS, Notifier.Type.WEEKLY,
      title = title,
      text = n.loopsText,
      label = n.loopsLabel,
      big = loops.toString(),
      character = character(context, config, Pose.WEEKLY),
      homeAction = null,
      openAction = if (enough) n.loopsOpen else n.loopsOpenShort,
      link = if (enough) "endloop://leave-letter" else "endloop://attendance",
    )
    Log.i(TAG, "loops reminder sent: $loops")
    return true
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
      "weekly" -> weekly(context, config, weekTotal(context, config, now).takeIf { it > 0 } ?: 754, now)
      "loops" -> if (!loopsReminder(context, config, now)) return false
      "explain" -> Notifier.explain(context, config.notif.explainTitle, config.notif.explainText, character(context, config, Pose.EXPLAIN))
      else -> return false
    }
    Log.i(TAG, "test notification: $kind")
    return true
  }
}
