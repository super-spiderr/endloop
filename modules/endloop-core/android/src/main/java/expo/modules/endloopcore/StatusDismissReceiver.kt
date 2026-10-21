package expo.modules.endloopcore

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** The user swiped "Loop is watching" away: keep it hidden until tomorrow (the watcher keeps running). */
class StatusDismissReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    Store(context).statusDismissedAt = System.currentTimeMillis()
  }
}
