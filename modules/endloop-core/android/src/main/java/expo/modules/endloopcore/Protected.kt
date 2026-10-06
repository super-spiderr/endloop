package expo.modules.endloopcore

import android.content.Context
import android.content.Intent
import android.telecom.TelecomManager

/**
 * Apps Endloop must never block: blocking Settings would stop people changing permissions
 * (or turning Endloop off), and the phone, home screen and system screens have to keep working.
 * They're hidden from the app picker and the watcher ignores them even if a config lists them.
 */
object Protected {
  private val PACKAGES = setOf(
    "android",
    "com.android.systemui",
    "com.android.settings",
    "com.google.android.settings.intelligence",
    "com.android.permissioncontroller",
    "com.google.android.permissioncontroller",
    "com.android.packageinstaller",
    "com.google.android.packageinstaller",
    "com.android.phone",
    "com.android.dialer",
    "com.google.android.dialer",
    "com.android.emergency",
    "com.google.android.apps.safetyhub",
    "com.android.vending", // Play Store: updates and uninstalls
  )

  @Volatile private var dynamic: Set<String>? = null

  fun isProtected(context: Context, pkg: String): Boolean {
    if (pkg == context.packageName || pkg in PACKAGES) return true
    val extra = dynamic ?: load(context).also { dynamic = it }
    return pkg in extra
  }

  /** The phone's own home screen and dialer, whatever brand they are. */
  private fun load(context: Context): Set<String> {
    val out = HashSet<String>()
    runCatching {
      val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
      context.packageManager.queryIntentActivities(home, 0).forEach { out.add(it.activityInfo.packageName) }
    }
    runCatching {
      (context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager)?.defaultDialerPackage?.let { out.add(it) }
    }
    return out
  }
}
