package expo.modules.endloopcore

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Screen 8: branded notifications.
 * One channel per type, so people can mute a type instead of uninstalling.
 * Collapsed: Loop's face, a short title, one roast line. Expanded: the gradient banner (Banner.kt).
 */
object Notifier {
  const val CHANNEL_WATCHING = "endloop_watching"
  const val CHANNEL_HEADS_UP = "endloop_heads_up"
  const val CHANNEL_LAST_CALL = "endloop_last_call"
  const val CHANNEL_LATE_NIGHT = "endloop_late_night"
  const val CHANNEL_WEEKLY = "endloop_weekly"
  private const val OLD_CHANNEL_WARNINGS = "endloop_warnings"

  const val ID_SERVICE = 1001
  const val ID_EXPLAIN = 1002
  const val ID_LATE_NIGHT = 1003
  const val ID_WEEKLY = 1004
  private const val RED = 0xFFE5132B.toInt()
  private const val WARNING_TIMEOUT_MS = 30 * 60_000L

  fun ensureChannels(context: Context) {
    val nm = NotificationManagerCompat.from(context)
    nm.deleteNotificationChannel(OLD_CHANNEL_WARNINGS)
    fun channel(id: String, importance: Int, name: String, desc: String) =
      nm.createNotificationChannel(
        NotificationChannelCompat.Builder(id, importance).setName(name).setDescription(desc).setLightColor(RED).build()
      )
    nm.createNotificationChannel(
      NotificationChannelCompat.Builder(CHANNEL_WATCHING, NotificationManagerCompat.IMPORTANCE_MIN)
        .setName("Loop is watching")
        .setDescription("The quiet notification Android needs so Endloop can keep counting. Safe to turn off.")
        .setShowBadge(false)
        .build()
    )
    channel(CHANNEL_HEADS_UP, NotificationManagerCompat.IMPORTANCE_HIGH, "Heads up", "When an app reaches 75% of its daily limit.")
    channel(CHANNEL_LAST_CALL, NotificationManagerCompat.IMPORTANCE_HIGH, "Last call", "When an app reaches 90% of its daily limit.")
    channel(CHANNEL_LATE_NIGHT, NotificationManagerCompat.IMPORTANCE_DEFAULT, "Late night", "Once a night, when you open a tracked app after bedtime.")
    channel(CHANNEL_WEEKLY, NotificationManagerCompat.IMPORTANCE_DEFAULT, "Weekly roast", "Sunday evening: your week, roasted.")
  }

  private fun openApp(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    return PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }

  /** Opens the app on a screen, e.g. "endloop://weekly" (Expo Router handles the link). */
  private fun openLink(context: Context, link: String): PendingIntent {
    val i = Intent(Intent.ACTION_VIEW, android.net.Uri.parse(link)).setPackage(context.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, 2, i, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }

  /** "Put it down": straight to the home screen. */
  private fun goHome(context: Context): PendingIntent {
    val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, 1, home, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }

  /** The white broken loop (res/drawable/endloop_notification.xml). */
  private val smallIcon get() = R.drawable.endloop_notification

  // ---- the always-on service notification ----

  fun serviceNotification(context: Context, title: String, status: String): Notification =
    NotificationCompat.Builder(context, CHANNEL_WATCHING)
      .setSmallIcon(smallIcon)
      .setColor(RED)
      .setContentTitle(title)
      .setContentText(status)
      .setStyle(NotificationCompat.BigTextStyle().bigText(status))
      .setOngoing(true)
      .setSilent(true)
      .setShowWhen(false)
      .setPriority(NotificationCompat.PRIORITY_MIN)
      .setCategory(NotificationCompat.CATEGORY_STATUS)
      .setContentIntent(openApp(context))
      .build()

  fun updateService(context: Context, title: String, status: String) =
    post(context, ID_SERVICE, serviceNotification(context, title, status))

  /** Once, when the watcher first starts: why there's a notification at all. */
  fun explain(context: Context, title: String, text: String, character: Int) {
    val n = NotificationCompat.Builder(context, CHANNEL_WATCHING)
      .setSmallIcon(smallIcon)
      .setColor(RED)
      .setLargeIcon(Banner.face(context, character))
      .setContentTitle(title)
      .setContentText(text)
      .setStyle(NotificationCompat.BigTextStyle().bigText(text))
      .setAutoCancel(true)
      .setSilent(true)
      .setContentIntent(openApp(context))
      .build()
    post(context, ID_EXPLAIN, n)
  }

  // ---- warnings (75 / 90) and late night ----

  enum class Type(val channel: String, val kind: Banner.Kind) {
    HEADS_UP(CHANNEL_HEADS_UP, Banner.Kind.HEADS_UP),
    LAST_CALL(CHANNEL_LAST_CALL, Banner.Kind.LAST_CALL),
    LATE_NIGHT(CHANNEL_LATE_NIGHT, Banner.Kind.LATE_NIGHT),
    WEEKLY(CHANNEL_WEEKLY, Banner.Kind.WEEKLY),
  }

  fun rich(
    context: Context,
    id: Int,
    type: Type,
    title: String,
    text: String,
    label: String,
    big: String,
    character: Int,
    homeAction: String?,
    openAction: String,
    link: String? = null,
  ) {
    val face: Bitmap? = runCatching { Banner.face(context, character) }.getOrNull()
    val art: Bitmap? = runCatching { Banner.banner(context, type.kind, label, big, character) }.getOrNull()
    val b = NotificationCompat.Builder(context, type.channel)
      .setSmallIcon(smallIcon)
      .setColor(RED)
      .setContentTitle(title)
      .setContentText(text)
      .setLargeIcon(face)
      .setAutoCancel(true)
      .setTimeoutAfter(if (type == Type.WEEKLY) 24 * 3_600_000L else WARNING_TIMEOUT_MS)
      .setPriority(if (type == Type.LATE_NIGHT || type == Type.WEEKLY) NotificationCompat.PRIORITY_DEFAULT else NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_REMINDER)
      .setContentIntent(if (link != null) openLink(context, link) else openApp(context))
    if (homeAction != null) b.addAction(0, homeAction, goHome(context))
    b.addAction(0, openAction, if (link != null) openLink(context, link) else openApp(context))
    if (art != null) {
      // expanded: the banner, with the face hidden so it isn't shown twice
      b.setStyle(
        NotificationCompat.BigPictureStyle()
          .bigPicture(art)
          .bigLargeIcon(null as Bitmap?)
          .setSummaryText(text)
      )
    } else {
      b.setStyle(NotificationCompat.BigTextStyle().bigText(text))
    }
    post(context, id, b.build())
  }

  private fun post(context: Context, id: Int, n: Notification) {
    val nm = NotificationManagerCompat.from(context)
    if (!nm.areNotificationsEnabled()) return
    try {
      nm.notify(id, n)
    } catch (_: SecurityException) {
      // POST_NOTIFICATIONS revoked; the overlay still works
    }
  }
}
