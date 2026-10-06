package expo.modules.endloopcore

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** One tracked app as sent from JS, with its roast lines already chosen for the user's language, heat and roaster. */
data class TrackedApp(
  val packageName: String,
  val label: String,
  val limitMin: Int,
  val headsUp: List<String>,
  val lastCall: List<String>,
  val limitHit: List<String>,
  val lateNight: List<String>,
  val snoozesUsedUp: List<String>,
)

/** A real, sourced fact, already in the user's tone (Screen 10's wait step). */
data class Fact(val text: String, val source: String)

/**
 * Screen 10, snooze friction, in the user's language: 1 pick a reason, 2 type the confession
 * the reason leads to, 3 wait it out (with a fact). {app} and {n} are filled natively.
 */
data class Friction(
  // 1 · why
  val eyebrow: String,
  val title: String,
  val subtitle: String,
  val reasons: List<String>,
  val pick: String,
  val next: String,
  // 2 · type it
  val typeEyebrow: String,
  val typeTitle: String,
  val typeHint: String,
  val typoHint: String,
  val sentences: List<String>, // one per reason
  val secondEyebrow: String,
  val secondTitle: String,
  val secondSentences: List<String>, // second snooze of the day: longer
  // 3 · wait
  val waitEyebrow: String,
  val waitTitle: String,
  val wait: String, // button while counting: "Give me 5 minutes · {n}"
  val readyEyebrow: String,
  val readyTitle: String,
  val confirm: String,
  val factLabel: String,
  val facts: List<Fact>,
  // way out, on every step
  val back: String,
  val backoutEyebrow: String,
  val backoutLines: List<String>,
) {
  companion object {
    val DEFAULT = Friction(
      eyebrow = "5 MORE MINUTES?",
      title = "Oh? Convince me.",
      subtitle = "Why do you need more {app}? Pick one. Be honest, I'll know.",
      reasons = listOf("It's actually for work", "Replying to someone", "Finishing what I started", "No reason. I'm weak."),
      pick = "Pick a reason first",
      next = "Next",
      typeEyebrow = "YOUR CONFESSION",
      typeTitle = "Type this. Exactly.",
      typeHint = "Type it exactly. No pasting.",
      typoHint = "Typo. Letters must match exactly.",
      sentences = listOf(
        "This is for work and I will close it right after.",
        "I am replying to one message and then leaving.",
        "I will finish this one thing and close it.",
        "I am choosing reels over my dreams.",
      ),
      secondEyebrow = "SECOND SNOOZE",
      secondTitle = "Longer sentence. Longer wait.",
      secondSentences = listOf("I, a fully grown adult, cannot stop watching strangers dance."),
      waitEyebrow = "TYPED. NOW WAIT.",
      waitTitle = "I'm staring. You're waiting.",
      wait = "Give me 5 minutes · {n}",
      readyEyebrow = "FINE.",
      readyTitle = "Five minutes. I'm counting.",
      confirm = "Give me 5 minutes",
      factLabel = "WHILE YOU WAIT",
      facts = listOf(Fact("Every extra hour on your phone is linked to going to bed about 13 minutes later.", "Frontiers in Psychiatry, 2025")),
      back = "Never mind, close it",
      backoutEyebrow = "CLOSED WITHOUT A FIGHT",
      backoutLines = listOf("Look at you. Choosing yourself."),
    )

    fun parse(o: JSONObject?): Friction {
      if (o == null) return DEFAULT
      val d = DEFAULT
      fun s(k: String, def: String) = o.optString(k, def).ifBlank { def }
      fun l(k: String, def: List<String>) =
        o.optJSONArray(k)?.let { a -> (0 until a.length()).map { a.getString(it) } }?.takeIf { it.isNotEmpty() } ?: def
      val facts = o.optJSONArray("facts")?.let { a ->
        (0 until a.length()).mapNotNull { i -> a.optJSONObject(i)?.let { f -> Fact(f.optString("text"), f.optString("source")) } }
          .filter { it.text.isNotBlank() }
      }?.takeIf { it.isNotEmpty() } ?: d.facts
      val reasons = l("reasons", d.reasons)
      val sentences = l("sentences", d.sentences)
      return Friction(
        eyebrow = s("eyebrow", d.eyebrow),
        title = s("title", d.title),
        subtitle = s("subtitle", d.subtitle),
        reasons = reasons,
        pick = s("pick", d.pick),
        next = s("next", d.next),
        typeEyebrow = s("typeEyebrow", d.typeEyebrow),
        typeTitle = s("typeTitle", d.typeTitle),
        typeHint = s("typeHint", d.typeHint),
        typoHint = s("typoHint", d.typoHint),
        // keep one sentence per reason even if JS sent fewer
        sentences = reasons.indices.map { sentences.getOrElse(it) { sentences.last() } },
        secondEyebrow = s("secondEyebrow", d.secondEyebrow),
        secondTitle = s("secondTitle", d.secondTitle),
        secondSentences = l("secondSentences", d.secondSentences),
        waitEyebrow = s("waitEyebrow", d.waitEyebrow),
        waitTitle = s("waitTitle", d.waitTitle),
        wait = s("wait", d.wait),
        readyEyebrow = s("readyEyebrow", d.readyEyebrow),
        readyTitle = s("readyTitle", d.readyTitle),
        confirm = s("confirm", d.confirm),
        factLabel = s("factLabel", d.factLabel),
        facts = facts,
        back = s("back", d.back),
        backoutEyebrow = s("backoutEyebrow", d.backoutEyebrow),
        backoutLines = l("backoutLines", d.backoutLines),
      )
    }
  }
}

/** Notification copy (Screen 8) in the user's language. {app}, {left}, {clock} are filled natively. */
data class NotifCopy(
  val headsUpTitle: String,
  val lastCallTitle: String,
  val lateNightTitle: String,
  val headsUpLabel: String,
  val lastCallLabel: String,
  val lateNightLabel: String,
  val putDown: String,
  val goSleep: String,
  val open: String,
  val watchingTitle: String,
  val over: String,
  val explainTitle: String,
  val explainText: String,
  val weeklyTitle: String,
  val weeklyText: String,
  val weeklyLabel: String,
  val weeklyOpen: String,
) {
  companion object {
    val DEFAULT = NotifCopy(
      headsUpTitle = "{app}: {left} left",
      lastCallTitle = "{app}: {left}.",
      lateNightTitle = "It's {clock}.",
      headsUpLabel = "HEADS UP",
      lastCallLabel = "LAST CALL",
      lateNightLabel = "STILL UP?",
      putDown = "Put it down",
      goSleep = "Go to sleep",
      open = "Open Endloop",
      watchingTitle = "Loop is watching",
      over = "over",
      explainTitle = "One quiet notification, sorry",
      explainText = "Android makes me show one quiet notification so I can keep watching. Swipe it away if it bugs you. I'll still be here.",
      weeklyTitle = "Your weekly roast is ready.",
      weeklyText = "Brace yourself.",
      weeklyLabel = "THIS WEEK",
      weeklyOpen = "See my roast",
    )

    fun parse(o: JSONObject?): NotifCopy {
      if (o == null) return DEFAULT
      val d = DEFAULT
      fun s(k: String, def: String) = o.optString(k, def).ifBlank { def }
      return NotifCopy(
        headsUpTitle = s("headsUpTitle", d.headsUpTitle),
        lastCallTitle = s("lastCallTitle", d.lastCallTitle),
        lateNightTitle = s("lateNightTitle", d.lateNightTitle),
        headsUpLabel = s("headsUpLabel", d.headsUpLabel),
        lastCallLabel = s("lastCallLabel", d.lastCallLabel),
        lateNightLabel = s("lateNightLabel", d.lateNightLabel),
        putDown = s("putDown", d.putDown),
        goSleep = s("goSleep", d.goSleep),
        open = s("open", d.open),
        watchingTitle = s("watchingTitle", d.watchingTitle),
        over = s("over", d.over),
        explainTitle = s("explainTitle", d.explainTitle),
        explainText = s("explainText", d.explainText),
        weeklyTitle = s("weeklyTitle", d.weeklyTitle),
        weeklyText = s("weeklyText", d.weeklyText),
        weeklyLabel = s("weeklyLabel", d.weeklyLabel),
        weeklyOpen = s("weeklyOpen", d.weeklyOpen),
      )
    }
  }
}

/** Roast screen copy (Screen 9) in the user's language. */
data class RoastText(
  val eyebrow: String,
  val stat: String, // {app} {time} {opens}
  val reopenEyebrow: String,
  val reopenStat: String, // {app} {n}
  val reopenLines: List<String>, // {ago}
  val usedUpEyebrow: String,
  val usedUpNote: String,
  val shareEyebrow: String,
  val shareStat: String,
  val shareTagline: String,
  val shareLabel: String,
) {
  companion object {
    val DEFAULT = RoastText(
      eyebrow = "TIME'S UP",
      stat = "{app} · {time} today · opened {opens} times",
      reopenEyebrow = "BACK ALREADY?",
      reopenStat = "{app} · reopened {n} times since your roast",
      reopenLines = listOf("It's been {ago}. I'm not tired. Are you?", "{ago}. That's all you lasted.", "We can do this all day. I literally can."),
      usedUpEyebrow = "NO MORE SNOOZES",
      usedUpNote = "Snoozes reset at midnight.",
      shareEyebrow = "I GOT ROASTED",
      shareStat = "{app} · {time} today",
      shareTagline = "Get roasted. Scroll less.",
      shareLabel = "Share this roast",
    )

    fun parse(o: JSONObject?): RoastText {
      if (o == null) return DEFAULT
      val d = DEFAULT
      fun s(k: String, def: String) = o.optString(k, def).ifBlank { def }
      val lines = o.optJSONArray("reopenLines")?.let { l -> (0 until l.length()).map { l.getString(it) } }?.takeIf { it.isNotEmpty() }
      return RoastText(
        eyebrow = s("eyebrow", d.eyebrow),
        stat = s("stat", d.stat),
        reopenEyebrow = s("reopenEyebrow", d.reopenEyebrow),
        reopenStat = s("reopenStat", d.reopenStat),
        reopenLines = lines ?: d.reopenLines,
        usedUpEyebrow = s("usedUpEyebrow", d.usedUpEyebrow),
        usedUpNote = s("usedUpNote", d.usedUpNote),
        shareEyebrow = s("shareEyebrow", d.shareEyebrow),
        shareStat = s("shareStat", d.shareStat),
        shareTagline = s("shareTagline", d.shareTagline),
        shareLabel = s("shareLabel", d.shareLabel),
      )
    }
  }
}

/** Settings (Screen 14): notification types the user left on. */
data class Notify(val headsUp: Boolean, val lastCall: Boolean, val lateNight: Boolean, val weekly: Boolean)

data class EnforcerConfig(
  val enabled: Boolean,
  val apps: List<TrackedApp>,
  val closeLabel: String,
  val snoozeLabel: String,
  val maxSnoozesPerDay: Int,
  val friction: Friction,
  val roaster: String, // "loop" | "lupe"
  val intensity: String, // "polite" | "honest" | "savage"
  val notif: NotifCopy,
  val roastText: RoastText,
  val bedtimeMin: Int, // minutes after midnight; late-night nudges run from here until 5 am. -1 = off
  val notify: Notify, // Settings: which notification types are on
  val pausedUntil: Long, // Settings → Pause for today: no warnings or roasts before this (ms)
) {
  fun app(pkg: String) = apps.firstOrNull { it.packageName == pkg }

  companion object {
    fun parse(json: String?): EnforcerConfig? {
      if (json.isNullOrBlank()) return null
      return try {
        val o = JSONObject(json)
        val arr = o.optJSONArray("apps")
        val apps = (0 until (arr?.length() ?: 0)).map { i ->
          val a = arr!!.getJSONObject(i)
          val lines = a.optJSONObject("lines") ?: JSONObject()
          fun list(key: String) = lines.optJSONArray(key)?.let { l -> (0 until l.length()).map { l.getString(it) } } ?: emptyList()
          TrackedApp(
            packageName = a.getString("packageName"),
            label = a.optString("label", a.getString("packageName")),
            limitMin = a.optInt("limitMin", 60),
            headsUp = list("heads_up"),
            lastCall = list("last_call"),
            limitHit = list("limit_hit"),
            lateNight = list("late_night"),
            snoozesUsedUp = list("snoozes_used_up"),
          )
        }
        EnforcerConfig(
          enabled = o.optBoolean("enabled", false),
          apps = apps,
          closeLabel = o.optString("closeLabel", "Close it"),
          snoozeLabel = o.optString("snoozeLabel", "5 more minutes"),
          maxSnoozesPerDay = o.optInt("maxSnoozesPerDay", 2),
          friction = Friction.parse(o.optJSONObject("friction")),
          roaster = o.optString("roaster", "loop"),
          intensity = o.optString("intensity", "honest"),
          notif = NotifCopy.parse(o.optJSONObject("notif")),
          roastText = RoastText.parse(o.optJSONObject("roast")),
          bedtimeMin = o.optInt("bedtimeMin", 23 * 60 + 30),
          notify = o.optJSONObject("notify").let { n ->
            Notify(
              headsUp = n?.optBoolean("headsUp", true) ?: true,
              lastCall = n?.optBoolean("lastCall", true) ?: true,
              lateNight = n?.optBoolean("lateNight", true) ?: true,
              weekly = n?.optBoolean("weekly", true) ?: true,
            )
          },
          pausedUntil = o.optLong("pausedUntil", 0L),
        )
      } catch (e: Exception) {
        null
      }
    }
  }
}

/** Plain SharedPreferences: config from JS, per-day warning state, snoozes and the service heartbeat. */
class Store(context: Context) {
  private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences("endloop_core", Context.MODE_PRIVATE)

  var configJson: String?
    get() = prefs.getString("config", null)
    set(v) = prefs.edit().putString("config", v).apply()

  val config: EnforcerConfig? get() = EnforcerConfig.parse(configJson)

  var heartbeat: Long
    get() = prefs.getLong("heartbeat", 0L)
    set(v) = prefs.edit().putLong("heartbeat", v).apply()

  private fun today() = dayKey(System.currentTimeMillis())

  /** Remember that a warning (75 / 90) was sent today, so it's sent once per app per day. */
  fun markWarned(pkg: String, level: Int) = prefs.edit().putBoolean("warn:${today()}:$pkg:$level", true).apply()
  fun wasWarned(pkg: String, level: Int) = prefs.getBoolean("warn:${today()}:$pkg:$level", false)

  /** Late night: once per night. A "night" is keyed by the date it started (before 5 am counts as the day before). */
  private fun night(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(System.currentTimeMillis() - 5 * 3_600_000L))
  fun lateNightSent() = prefs.getBoolean("late:${night()}", false)
  fun markLateNight() = prefs.edit().putBoolean("late:${night()}", true).apply()

  /** The one-time "why this notification" explainer. */
  var explained: Boolean
    get() = prefs.getBoolean("explained", false)
    set(v) = prefs.edit().putBoolean("explained", v).apply()

  fun snoozesUsed(pkg: String) = prefs.getInt("snooze:${today()}:$pkg", 0)
  fun addSnooze(pkg: String, minutes: Int) {
    prefs.edit()
      .putInt("snooze:${today()}:$pkg", snoozesUsed(pkg) + 1)
      .putLong("snoozeUntil:$pkg", System.currentTimeMillis() + minutes * 60_000L)
      .apply()
  }
  fun snoozedUntil(pkg: String) = prefs.getLong("snoozeUntil:$pkg", 0L)

  /** Every "Convince me" answer (newest last, capped), for the stats screen and AI roasts later. */
  fun logSnoozeReason(pkg: String, reason: String) {
    val arr = runCatching { org.json.JSONArray(snoozeLogJson) }.getOrDefault(org.json.JSONArray())
    arr.put(JSONObject().put("packageName", pkg).put("reason", reason).put("at", System.currentTimeMillis()))
    while (arr.length() > 500) arr.remove(0)
    prefs.edit().putString("snoozeLog", arr.toString()).apply()
  }
  val snoozeLogJson: String get() = prefs.getString("snoozeLog", "[]") ?: "[]"

  // ---- daily summary (Screen 12): Android keeps only about a week of detail, so we keep our own ----

  /** Save a day's minutes per app, e.g. "2026-09-25" -> {pkg: minutes}. Keeps the larger value per app. */
  fun saveDay(day: String, minutes: Map<String, Int>) {
    val old = runCatching { JSONObject(prefs.getString("sum:$day", "{}") ?: "{}") }.getOrDefault(JSONObject())
    for ((pkg, m) in minutes) old.put(pkg, maxOf(m, old.optInt(pkg, 0)))
    prefs.edit().putString("sum:$day", old.toString()).apply()
  }
  fun day(day: String): Map<String, Int> {
    val o = runCatching { JSONObject(prefs.getString("sum:$day", "{}") ?: "{}") }.getOrDefault(JSONObject())
    return o.keys().asSequence().associateWith { o.optInt(it, 0) }
  }

  /** Settings → Delete all my data. */
  fun clearAll() = prefs.edit().clear().apply()

  /** The Sunday weekly roast: once per week, keyed by that Sunday's date. */
  fun weeklySent(sunday: String) = prefs.getBoolean("weekly:$sunday", false)
  fun markWeekly(sunday: String) = prefs.edit().putBoolean("weekly:$sunday", true).apply()

  /** "Closed it" on a roast without snoozing (or backed out of a snooze): a win for the day. */
  fun addWin() = prefs.edit().putInt("wins:${today()}", wins(today()) + 1).apply()
  fun wins(day: String) = prefs.getInt("wins:$day", 0)

  /** Every roast shown (newest last, capped): Screen 11's Hall of shame. */
  fun logRoast(pkg: String, text: String) {
    val arr = runCatching { org.json.JSONArray(roastLogJson) }.getOrDefault(org.json.JSONArray())
    arr.put(JSONObject().put("packageName", pkg).put("text", text).put("at", System.currentTimeMillis()))
    while (arr.length() > 500) arr.remove(0)
    prefs.edit().putString("roastLog", arr.toString()).apply()
  }
  val roastLogJson: String get() = prefs.getString("roastLog", "[]") ?: "[]"
}

/** Local date key, e.g. "2026-09-25". */
fun dayKey(ms: Long): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(ms))

/** Fill {app}, {time}, {limit}, {left}, {over}, {clock} in a roast line (keep in sync with NATIVE_VARS in JS). */
fun fillRoast(template: String, app: TrackedApp, usedMin: Int, opens: Int = -1): String {
  fun fmt(min: Int): String {
    val h = min / 60
    val m = min % 60
    return when {
      h == 0 -> "${m}m"
      m == 0 -> "${h}h"
      else -> "${h}h ${m}m"
    }
  }
  return template
    .replace("{app}", app.label)
    .replace("{time}", fmt(usedMin))
    .replace("{limit}", fmt(app.limitMin))
    .replace("{left}", fmt((app.limitMin - usedMin).coerceAtLeast(0)))
    .replace("{over}", fmt((usedMin - app.limitMin).coerceAtLeast(0)))
    .replace("{clock}", SimpleDateFormat("h:mm a", Locale.US).format(Date()))
    .let { if (opens >= 0) it.replace("{opens}", opens.toString()) else it }
}

private val PLACEHOLDER = Regex("\\{\\w+\\}")

/** True when a filled line still has a raw {placeholder} left in it. */
fun hasPlaceholder(text: String) = PLACEHOLDER.containsMatchIn(text)
