package expo.modules.endloopcore

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle

/**
 * Invisible, history-less step between the roast and the home screen.
 *
 * Sending the user straight home from the overlay looks like "the user left" to the app underneath,
 * and apps with auto picture-in-picture (YouTube, Chrome, Instagram video...) shrink into a PiP window
 * and keep playing. Starting one of our own activities first moves that app to the background without
 * that signal; from here we open the launcher and disappear. Both starts carry FLAG_ACTIVITY_NO_USER_ACTION:
 * without it Android still counts them as "the user is leaving" and the app goes into PiP anyway.
 */
class ExitActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    runCatching {
      startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_USER_ACTION))
    }
    finish()
    noAnimation()
  }

  @Suppress("DEPRECATION")
  private fun noAnimation() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      overrideActivityTransition(OVERRIDE_TRANSITION_CLOSE, 0, 0)
    } else {
      overridePendingTransition(0, 0)
    }
  }
}
