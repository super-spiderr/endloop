package expo.modules.endloopcore

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.widget.Toast

/**
 * Brings Endloop back by itself once the user switches on Usage access or Display over other apps,
 * instead of leaving them to find their way back from deep in Settings.
 *
 * Watches the app-op with AppOpsManager.startWatchingMode while the Settings page is open, and stops
 * when the grant arrives, after 3 minutes, or when Endloop comes back to the front on its own.
 */
object PermissionReturn {
  private const val TAG = "Endloop"
  private const val TIMEOUT_MS = 3 * 60_000L

  enum class Kind(val op: String) {
    USAGE(AppOpsManager.OPSTR_GET_USAGE_STATS),
    OVERLAY(AppOpsManager.OPSTR_SYSTEM_ALERT_WINDOW),
  }

  private val main = Handler(Looper.getMainLooper())
  private var listener: AppOpsManager.OnOpChangedListener? = null
  private val timeout = Runnable { stop("timed out") }

  /** Call right after opening the Settings page for [kind]. */
  fun start(context: Context, kind: Kind) {
    val app = context.applicationContext
    stop(null)
    if (granted(app, kind)) return
    val ops = app.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    appOps = ops
    val l = AppOpsManager.OnOpChangedListener { op, pkg ->
      if (op != kind.op || pkg != app.packageName) return@OnOpChangedListener
      // the callback can arrive before the new mode is readable: check on the main thread a moment later
      main.postDelayed({
        if (listener != null && granted(app, kind)) {
          stop("granted ${kind.name.lowercase()}")
          bringBack(app)
        }
      }, 300)
    }
    listener = l
    ops.startWatchingMode(kind.op, app.packageName, l)
    main.postDelayed(timeout, TIMEOUT_MS)
    hint(app, kind)
  }

  /** Endloop is in front again (or the watch is no longer needed). */
  fun stop(reason: String?) {
    main.removeCallbacks(timeout)
    val l = listener ?: return
    listener = null
    reason?.let { Log.d(TAG, "permission return stopped: $it") }
    runCatching { appOps?.stopWatchingMode(l) }
  }

  private var appOps: AppOpsManager? = null

  private fun granted(context: Context, kind: Kind): Boolean = when (kind) {
    Kind.USAGE -> UsageReader.hasAccess(context)
    Kind.OVERLAY -> Settings.canDrawOverlays(context)
  }

  /**
   * Endloop's own task holds the Settings page on top of MainActivity (see EndloopCoreModule.open),
   * so relaunching MainActivity with CLEAR_TOP pops Settings off and shows Endloop again.
   */
  private fun bringBack(context: Context) {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    try {
      context.startActivity(launch)
      Log.i(TAG, "permission granted: brought Endloop back")
    } catch (e: Exception) {
      Log.w(TAG, "couldn't bring Endloop back", e)
    }
  }

  /** A plain Toast over Settings: where to tap. */
  private fun hint(context: Context, kind: Kind) {
    // The overlay page is always a list on Android 11+ (Endloop opens a sub-page with the switch).
    // Usage access opens on Endloop's own switch on some phones and on the list on others.
    val text = when {
      kind == Kind.OVERLAY && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> "Find Endloop, tap it, then switch it on."
      kind == Kind.OVERLAY -> "Switch it on and you'll be back."
      else -> "Find Endloop and switch it on."
    }
    main.postDelayed({ Toast.makeText(context, text, Toast.LENGTH_LONG).show() }, 600)
  }
}
