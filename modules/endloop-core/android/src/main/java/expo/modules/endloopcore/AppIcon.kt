package expo.modules.endloopcore

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log

/**
 * Screen 17: the home-screen icon (red default, Loop or Lupe).
 *
 * Each icon is an <activity-alias> added by plugins/with-app-icons.js; exactly one is enabled.
 * Switching is saved as "pending" and applied when Endloop goes to the background, because
 * some launchers close the app or drop the home-screen shortcut the moment the icon changes.
 */
object AppIcon {
  val NAMES = listOf("default", "loop", "lupe")
  private const val PREFS = "endloop_core"
  private const val KEY_PENDING = "app_icon_pending"

  private fun alias(context: Context, name: String) = ComponentName(
    context.packageName,
    "${context.packageName}.Icon${name.replaceFirstChar { it.uppercase() }}",
  )

  /** Whether the aliases exist in this build (false before `prebuild --clean` picks up the plugin). */
  fun supported(context: Context): Boolean = try {
    context.packageManager.getActivityInfo(alias(context, "default"), PackageManager.MATCH_DISABLED_COMPONENTS)
    true
  } catch (_: Exception) {
    false
  }

  /** The icon currently on the launcher. */
  fun current(context: Context): String {
    if (!supported(context)) return "default"
    val pm = context.packageManager
    return NAMES.firstOrNull { name ->
      when (pm.getComponentEnabledSetting(alias(context, name))) {
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
        PackageManager.COMPONENT_ENABLED_STATE_DEFAULT -> name == "default" // manifest default
        else -> false
      }
    } ?: "default"
  }

  /** What the user picked: the pending choice if there is one, else what's on the launcher. */
  fun chosen(context: Context): String =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_PENDING, null) ?: current(context)

  fun request(context: Context, name: String) {
    if (name !in NAMES) return
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (name == current(context)) prefs.edit().remove(KEY_PENDING).apply()
    else prefs.edit().putString(KEY_PENDING, name).apply()
  }

  /** Called when Endloop leaves the foreground. Enables the new alias before disabling the old one. */
  fun applyPending(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val want = prefs.getString(KEY_PENDING, null) ?: return
    prefs.edit().remove(KEY_PENDING).apply()
    if (!supported(context) || want == current(context)) return
    val pm = context.packageManager
    try {
      pm.setComponentEnabledSetting(alias(context, want), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
      NAMES.filter { it != want }.forEach {
        pm.setComponentEnabledSetting(alias(context, it), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
      }
      Log.i("Endloop", "app icon → $want")
    } catch (e: Exception) {
      Log.w("Endloop", "app icon switch failed", e)
    }
  }
}
