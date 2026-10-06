package expo.modules.endloopcore

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Restart the watcher after a reboot or an app update. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_MY_PACKAGE_REPLACED) return
    if (Store(context).config?.enabled != true) return
    try {
      EnforcerService.start(context)
    } catch (_: Exception) {
      // some phones block starting services this early; the app restarts it on next open
    }
  }
}
