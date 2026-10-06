package expo.modules.endloopcore

import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.content.res.ResourcesCompat

/** Everything the roast screen says, already in the user's language. */
data class RoastCopy(
  val appLabel: String,
  val eyebrow: String, // TIME'S UP / BACK ALREADY? / NO MORE SNOOZES
  val roast: String,
  val stat: String, // "Instagram · 1h 10m today · opened 14 times"
  val close: String,
  val snooze: String?, // null when today's snoozes are used up
  val note: String?, // small line under the buttons, e.g. "Snoozes reset at midnight."
  val shareLabel: String,
  val friction: Friction,
  val waitSec: Int, // step 3 wait: 10 s, 20 s on the second snooze
  val second: Boolean, // second snooze today: longer sentence
  val roastImage: Int, // drawable of Loop / Lupe for the roast (0 = none)
  val convinceImage: Int, // and for "Convince me"
  val stareImage: Int, // the face in the countdown ring
  val readyImage: Int, // the ring face once the wait is over ("fine, go")
  val proudImage: Int, // "Never mind, close it"
)

/**
 * The native roast screen (Screen 9), drawn edge to edge over the app that hit its limit,
 * status bar and navigation bar included.
 *
 * "5 more minutes" doesn't snooze straight away: it flips to a "Convince me" step where you
 * pick a reason and wait out a short countdown. The reason is kept for the AI roasts later.
 */
class RoastOverlay(private val context: Context) {
  private val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val main = Handler(Looper.getMainLooper())
  @Volatile private var view: View? = null

  val isShowing get() = view != null

  /** True while the user is on the "Convince me" step, i.e. actively answering the roast. */
  @Volatile var busy = false

  /** Some apps (Files, Settings-like screens) tell Android to hide other apps' overlays. Called when that happens. */
  @Volatile var onHiddenBySystem: (() -> Unit)? = null

  fun show(copy: RoastCopy, onClose: () -> Unit, onSnooze: (reason: String) -> Unit, onShare: () -> Unit) = main.post {
    try {
      build(copy, onClose, onSnooze, onShare)
    } catch (e: Exception) {
      // never crash the app (and the watcher with it) over the overlay
      Log.e(TAG, "roast overlay failed", e)
    }
  }

  fun hide() = main.post {
    busy = false
    main.removeCallbacksAndMessages(COUNTDOWN)
    val v = view
    view = null
    v?.let { runCatching { wm.removeView(it) } }
  }

  /** Leave the app that hit its limit. */
  fun goHome() {
    val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    runCatching { context.startActivity(home) }
  }

  // ---------------------------------------------------------------------------

  private fun build(copy: RoastCopy, onClose: () -> Unit, onSnooze: (String) -> Unit, onShare: () -> Unit) {
    if (view != null) return
    if (!Settings.canDrawOverlays(context)) {
      Log.w(TAG, "no overlay permission, roast skipped")
      return
    }

    var onBack: () -> Unit = {}
    val root = object : FrameLayout(context) {
      // Back acts as "Close it" (on "Convince me" it steps back to the roast); the roast can't be swiped away.
      override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK) {
          if (event.action == KeyEvent.ACTION_UP) onBack()
          return true
        }
        return super.dispatchKeyEvent(event)
      }

      override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        // Our own hide() clears `view` first, so only log hiding we didn't ask for.
        if (visibility == View.VISIBLE) Log.i(TAG, "overlay window visible")
        else if (view === this) {
          Log.w(TAG, "overlay window hidden by system ($visibility)")
          onHiddenBySystem?.invoke()
        }
      }
    }.apply {
      background = GradientDrawable(
        GradientDrawable.Orientation.TOP_BOTTOM,
        intArrayOf(0xFFF0263D.toInt(), 0xFFC20F24.toInt(), 0xFF7A0714.toInt()),
      )
      isClickable = true // swallow touches meant for the app underneath
      isFocusableInTouchMode = true
    }

    // The gradient runs under the status and navigation bars; only the content keeps clear of them.
    val top = systemBar("status_bar_height")
    val column = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(24), top + dp(72), dp(24), systemBar("navigation_bar_height") + dp(28))
    }
    val scroll = ScrollView(context).apply {
      isFillViewport = true
      isVerticalScrollBarEnabled = false
      overScrollMode = View.OVER_SCROLL_NEVER
      addView(column, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    }
    root.addView(scroll, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    // Edge to edge means Android won't shrink the window for the keyboard on 11+: lift the content ourselves.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      root.setOnApplyWindowInsetsListener { _, insets ->
        val ime = insets.getInsets(android.view.WindowInsets.Type.ime()).bottom
        scroll.setPadding(0, 0, 0, ime)
        // The real navigation bar (3-button or gesture) on this phone: the dimen above is only a guess.
        val nav = insets.getInsets(android.view.WindowInsets.Type.navigationBars()).bottom
        if (nav > 0) column.setPadding(column.paddingLeft, column.paddingTop, column.paddingRight, nav + dp(28))
        insets
      }
    }

    // Branding: the white wordmark, top left.
    val brand = ImageView(context).apply {
      setImageResource(R.drawable.endloop_wordmark_white)
      scaleType = ImageView.ScaleType.FIT_START
      contentDescription = "endloop"
    }
    root.addView(brand, FrameLayout.LayoutParams(dp(104), dp(29)).apply {
      gravity = Gravity.TOP or Gravity.START
      leftMargin = dp(28)
      topMargin = top + dp(26)
    })

    // Share this roast: top right.
    val share = ImageView(context).apply {
      setImageResource(R.drawable.endloop_share)
      scaleType = ImageView.ScaleType.CENTER
      contentDescription = copy.shareLabel
      background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(0x29FFFFFF) }
      setOnClickListener { onShare() }
    }
    root.addView(share, FrameLayout.LayoutParams(dp(44), dp(44)).apply {
      gravity = Gravity.TOP or Gravity.END
      rightMargin = dp(20)
      topMargin = top + dp(18)
    })

    fun close() {
      hide()
      onClose()
    }

    fun roastStep() {
      busy = false
      onBack = { close() }
      share.visibility = View.VISIBLE
      column.removeAllViews()
      character(copy.roastImage, 250)?.let { column.addView(it, imageParams(250)) }
      column.addView(label(copy.eyebrow))
      val roast = headline("", size = 32f, bottom = 12, display = true)
      column.addView(roast)
      column.addView(body(copy.stat))
      column.addView(View(context), LinearLayout.LayoutParams(1, 0, 1f)) // push buttons down
      column.addView(primaryButton(copy.close) { close() }, fullWidth(60))
      copy.snooze?.let { s ->
        column.addView(quietButton(s, underline = true) { convinceStep(column, copy, ::close, onSnooze) { share.visibility = View.GONE; onBack = { roastStep() } } })
      }
      copy.note?.let { n -> column.addView(quietButton(n) {}.apply { isClickable = false }) }
      typeOut(roast, copy.roast)
    }

    roastStep()

    root.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
      override fun onViewAttachedToWindow(v: View) {
        Log.i(TAG, "overlay attached")
      }
      override fun onViewDetachedFromWindow(v: View) {
        // Removed without us calling hide(): forget it so the watcher can put the roast back.
        if (view === v) {
          Log.w(TAG, "overlay removed by system")
          view = null
          busy = false
        }
      }
    })
    wm.addView(root, params())
    view = root
    root.requestFocus()
    enter(root)
    runCatching { buzz() }
  }

  /** Slides up from the bottom with a quick deceleration. */
  private fun enter(root: View) {
    val h = context.resources.displayMetrics.heightPixels.toFloat()
    root.translationY = h
    root.animate().translationY(0f).setDuration(320).setInterpolator(DecelerateInterpolator(2f)).start()
  }

  /**
   * The roast appears word by word (about half a second in total). The full text is laid out
   * from the start with the unrevealed words transparent, so nothing below it jumps.
   */
  private fun typeOut(view: TextView, text: String) {
    val ends = Regex("\\S+").findAll(text).map { it.range.last + 1 }.toList()
    fun reveal(words: Int) {
      val upTo = if (words <= 0) 0 else ends[(words - 1).coerceAtMost(ends.size - 1)]
      view.text = android.text.SpannableString(text).apply {
        if (upTo < text.length) setSpan(android.text.style.ForegroundColorSpan(0x00FFFFFF), upTo, text.length, 0)
      }
    }
    reveal(0)
    if (ends.isEmpty()) return
    ValueAnimator.ofInt(0, ends.size).apply {
      startDelay = 260
      duration = (ends.size * 45L).coerceIn(300L, 700L)
      addUpdateListener { a -> reveal(a.animatedValue as Int) }
    }.start()
  }

  /**
   * Screen 10, snooze friction, in three steps (dots at the top):
   * 1 pick a reason, 2 type the confession that reason leads to, 3 wait it out with a fact.
   * "Never mind, close it" on every step counts as a win.
   */
  private fun convinceStep(column: LinearLayout, copy: RoastCopy, close: () -> Unit, onSnooze: (String) -> Unit, onEnter: () -> Unit) {
    val f = copy.friction
    busy = true
    onEnter()
    main.removeCallbacksAndMessages(COUNTDOWN)
    column.removeAllViews()
    column.addView(stepDots(1))
    character(copy.convinceImage, 170)?.let { column.addView(it, imageParams(170)) }
    column.addView(label(f.eyebrow))
    column.addView(headline(f.title, size = 34f, bottom = 8))
    column.addView(body(fill(f.subtitle, copy.appLabel)))

    var picked = -1
    val next = primaryButton(f.pick) {}.apply { alpha = 0.45f; isEnabled = false }
    val chips = f.reasons.map { r -> chip(r) }
    chips.forEachIndexed { i, c ->
      c.setOnClickListener {
        picked = i
        chips.forEach { other -> styleChip(other, other === c) }
        next.isEnabled = true
        next.alpha = 1f
        next.text = f.next
      }
      column.addView(c, fullWidth(50).apply { bottomMargin = dp(10) })
    }
    next.setOnClickListener {
      if (picked < 0) return@setOnClickListener
      val sentence = if (copy.second) f.secondSentences.random() else f.sentences[picked]
      typeStep(column, copy, fill(sentence, copy.appLabel), f.reasons[picked], close, onSnooze)
    }
    column.addView(View(context), LinearLayout.LayoutParams(1, 0, 1f))
    column.addView(next, fullWidth(60).apply { topMargin = dp(8) })
    column.addView(quietButton(f.back, underline = true) { backedOut(column, copy, close) })
  }

  /** Step 2: type the sentence exactly (case aside). Paste and suggestions are blocked. */
  private fun typeStep(column: LinearLayout, copy: RoastCopy, sentence: String, reason: String, close: () -> Unit, onSnooze: (String) -> Unit) {
    val f = copy.friction
    column.removeAllViews()
    column.addView(stepDots(2))
    column.addView(label(if (copy.second) f.secondEyebrow else f.typeEyebrow))
    column.addView(headline(if (copy.second) f.secondTitle else f.typeTitle, size = 28f, bottom = 14))

    val target = TextView(context).apply {
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 21f)
      typeface = Typeface.DEFAULT_BOLD
      setLineSpacing(0f, 1.2f)
      setPadding(dp(18), dp(16), dp(18), dp(16))
      background = GradientDrawable().apply { setColor(0xFFFFFFFF.toInt()); cornerRadius = dp(18).toFloat() }
    }
    column.addView(target, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
    column.addView(label(f.typeHint).apply { setPadding(0, dp(16), 0, dp(6)) })

    val hint = body("").apply { setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f); setPadding(0, dp(6), 0, 0) }
    val input = android.widget.EditText(context).apply {
      setTextColor(0xFFFFFFFF.toInt())
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 17f)
      setPadding(dp(16), dp(14), dp(16), dp(14))
      background = GradientDrawable().apply {
        setColor(0x24FFFFFF); cornerRadius = dp(14).toFloat(); setStroke(dp(1), 0x99FFFFFF.toInt())
      }
      // plain keyboard: no suggestions or autocorrect (they'd type for you)
      inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD or
        android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
      imeOptions = android.view.inputmethod.EditorInfo.IME_FLAG_NO_EXTRACT_UI
      isLongClickable = false
      setTextIsSelectable(false)
      customSelectionActionModeCallback = NoMenu
      customInsertionActionModeCallback = NoMenu
      // one character at a time: pasting (or any multi-letter insert) is dropped
      filters = arrayOf(android.text.InputFilter { src, start, end, _, _, _ -> if (end - start > 1) "" else null })
    }
    column.addView(input, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
    column.addView(hint)

    fun paint(typed: String) {
      var ok = 0
      while (ok < typed.length && ok < sentence.length && typed[ok].equals(sentence[ok], ignoreCase = true)) ok++
      val typo = ok < typed.length
      val sp = android.text.SpannableString(sentence)
      sp.setSpan(android.text.style.ForegroundColorSpan(0xFFC9A3A8.toInt()), 0, sentence.length, 0)
      if (ok > 0) sp.setSpan(android.text.style.ForegroundColorSpan(0xFF16895F.toInt()), 0, ok, 0)
      if (typo && ok < sentence.length) {
        sp.setSpan(android.text.style.ForegroundColorSpan(0xFFFFFFFF.toInt()), ok, ok + 1, 0)
        sp.setSpan(android.text.style.BackgroundColorSpan(0xFF7A0714.toInt()), ok, ok + 1, 0)
      }
      target.text = sp
      hint.text = if (typo) f.typoHint else ""
      if (!typo && typed.trim().length >= sentence.length && typed.trim().equals(sentence, ignoreCase = true)) {
        hideKeyboard(input)
        waitStep(column, copy, reason, close, onSnooze)
      }
    }
    input.addTextChangedListener(object : android.text.TextWatcher {
      override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
      override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
      override fun afterTextChanged(s: android.text.Editable?) = paint(s?.toString() ?: "")
    })
    paint("")
    column.addView(View(context), LinearLayout.LayoutParams(1, 0, 1f))
    column.addView(quietButton(f.back, underline = true) { hideKeyboard(input); backedOut(column, copy, close) })
    input.requestFocus()
    main.postDelayed({ showKeyboard(input) }, 150)
  }

  /** Step 3: the countdown ring around Loop's stare, and a fact to read while it runs. */
  private fun waitStep(column: LinearLayout, copy: RoastCopy, reason: String, close: () -> Unit, onSnooze: (String) -> Unit) {
    val f = copy.friction
    column.removeAllViews()
    column.addView(stepDots(3))
    val ring = Ring(context, runCatching { Banner.face(context, copy.stareImage) }.getOrNull(), dp(10).toFloat())
    column.addView(ring, LinearLayout.LayoutParams(dp(190), dp(190)).apply { gravity = Gravity.CENTER_HORIZONTAL; bottomMargin = dp(14) })
    val eyebrow = label(f.waitEyebrow)
    val title = headline(f.waitTitle, size = 28f, bottom = 16)
    column.addView(eyebrow)
    column.addView(title)
    if (f.facts.isNotEmpty()) column.addView(factCard(f.factLabel, f.facts.random()))
    column.addView(View(context), LinearLayout.LayoutParams(1, 0, 1f))
    val give = primaryButton("") {
      hide()
      onSnooze(reason)
    }
    column.addView(give, fullWidth(60).apply { topMargin = dp(12) })
    column.addView(quietButton(f.back, underline = true) { backedOut(column, copy, close) })

    var left = copy.waitSec
    fun refresh() {
      ring.set(left, copy.waitSec)
      val ready = left <= 0
      give.isEnabled = ready
      give.alpha = if (ready) 1f else 0.45f
      give.text = if (ready) f.confirm else f.wait.replace("{n}", left.toString())
      if (ready) {
        runCatching { Banner.face(context, copy.readyImage) }.getOrNull()?.let { ring.face = it }
        eyebrow.text = f.readyEyebrow
        title.text = f.readyTitle
      }
    }
    val tick = object : Runnable {
      override fun run() {
        left--
        refresh()
        if (left > 0) main.postAtTime(this, COUNTDOWN, android.os.SystemClock.uptimeMillis() + 1000)
      }
    }
    refresh()
    main.removeCallbacksAndMessages(COUNTDOWN)
    main.postAtTime(tick, COUNTDOWN, android.os.SystemClock.uptimeMillis() + 1000)
  }

  /** "Never mind, close it": a proud beat, then home. Counts as a win. */
  private fun backedOut(column: LinearLayout, copy: RoastCopy, close: () -> Unit) {
    val f = copy.friction
    main.removeCallbacksAndMessages(COUNTDOWN)
    column.removeAllViews()
    character(copy.proudImage, 250)?.let { column.addView(it, imageParams(250)) }
    column.addView(label(f.backoutEyebrow))
    column.addView(headline(f.backoutLines.random(), size = 34f))
    main.postDelayed({ close() }, 1800)
  }

  private fun factCard(labelText: String, fact: Fact): View {
    val card = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(16), dp(14), dp(16), dp(14))
      background = GradientDrawable().apply {
        setColor(0x21FFFFFF); cornerRadius = dp(16).toFloat(); setStroke(dp(1), 0x47FFFFFF)
      }
    }
    card.addView(label(labelText).apply { setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f) })
    card.addView(TextView(context).apply {
      text = fact.text
      setTextColor(0xFFFFFFFF.toInt())
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
      setLineSpacing(0f, 1.2f)
      setPadding(0, dp(4), 0, dp(4))
    })
    if (fact.source.isNotBlank()) {
      card.addView(TextView(context).apply {
        text = "Source: ${fact.source}"
        setTextColor(0xB8FFFFFF.toInt())
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
      })
    }
    return card
  }

  /** Three small dots: which snooze step this is. */
  private fun stepDots(step: Int): View = LinearLayout(context).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.END
    contentDescription = "Step $step of 3"
    for (i in 1..3) {
      addView(View(context).apply {
        background = GradientDrawable().apply {
          cornerRadius = dp(3).toFloat()
          setColor(if (i <= step) 0xFFFFFFFF.toInt() else 0x59FFFFFF)
        }
      }, LinearLayout.LayoutParams(dp(if (i == step) 18 else 6), dp(6)).apply { leftMargin = dp(4) })
    }
    setPadding(0, 0, 0, dp(8))
  }

  private fun showKeyboard(v: View) {
    val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
    imm.showSoftInput(v, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
  }

  private fun hideKeyboard(v: View) {
    val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
    imm.hideSoftInputFromWindow(v.windowToken, 0)
  }

  /** No cut / copy / paste menu on the confession field. */
  private object NoMenu : android.view.ActionMode.Callback {
    override fun onCreateActionMode(mode: android.view.ActionMode?, menu: android.view.Menu?) = false
    override fun onPrepareActionMode(mode: android.view.ActionMode?, menu: android.view.Menu?) = false
    override fun onActionItemClicked(mode: android.view.ActionMode?, item: android.view.MenuItem?) = false
    override fun onDestroyActionMode(mode: android.view.ActionMode?) {}
  }

  /** The countdown ring with Loop / Lupe's face inside and the seconds left in a badge. */
  private class Ring(context: Context, face: android.graphics.Bitmap?, private val stroke: Float) : View(context) {
    var face = face
      set(value) { field = value; invalidate() }
    private var left = 0
    private var total = 1
    private val track = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
      style = android.graphics.Paint.Style.STROKE; strokeWidth = stroke; color = 0x38FFFFFF
    }
    private val arc = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
      style = android.graphics.Paint.Style.STROKE; strokeWidth = stroke; color = 0xFFFFFFFF.toInt(); strokeCap = android.graphics.Paint.Cap.ROUND
    }
    private val badge = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFFFFF.toInt() }
    private val num = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
      color = 0xFFE5132B.toInt(); textAlign = android.graphics.Paint.Align.CENTER; typeface = Typeface.DEFAULT_BOLD
    }

    fun set(left: Int, total: Int) {
      this.left = left.coerceAtLeast(0)
      this.total = total.coerceAtLeast(1)
      contentDescription = "$left seconds left"
      invalidate()
    }

    override fun onDraw(c: android.graphics.Canvas) {
      val w = width.toFloat()
      val h = height.toFloat()
      val r = minOf(w, h) / 2f - stroke
      val cx = w / 2f
      val cy = h / 2f
      c.drawCircle(cx, cy, r, track)
      val sweep = 360f * left / total
      c.drawArc(cx - r, cy - r, cx + r, cy + r, -90f, sweep, false, arc)
      face?.let {
        val fr = r - stroke * 1.6f
        c.drawBitmap(it, null, android.graphics.RectF(cx - fr, cy - fr, cx + fr, cy + fr), null)
      }
      if (left > 0) {
        val br = r * 0.28f
        val bx = cx + r * 0.72f
        val by = cy + r * 0.72f
        c.drawCircle(bx, by, br, badge)
        num.textSize = br * 1.1f
        c.drawText(left.toString(), bx, by + num.textSize * 0.36f, num)
      }
    }
  }

  // ---- window ----

  private fun params(): WindowManager.LayoutParams {
    @Suppress("DEPRECATION")
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE
    // Size to the whole physical screen so nothing of the app underneath peeks out at the edges.
    val (w, h) = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      wm.maximumWindowMetrics.bounds.let { it.width() to it.height() }
    } else {
      WindowManager.LayoutParams.MATCH_PARENT to WindowManager.LayoutParams.MATCH_PARENT
    }
    return WindowManager.LayoutParams(
      w,
      h,
      type,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
        // focusable, so the back button/gesture reaches us (it acts as "Close it")
        WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = 0
      y = 0
      // the confession field (Screen 10) needs the keyboard; content scrolls above it
      softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        // By default overlay windows are fitted inside the status/nav bars; we want edge to edge.
        fitInsetsTypes = 0
        layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      }
    }
  }

  // ---- views ----

  /** Loop or Lupe; the drawables already fade out at the bottom so they sit on the gradient. */
  private fun character(res: Int, heightDp: Int): ImageView? {
    if (res == 0) return null
    return ImageView(context).apply {
      setImageResource(res)
      scaleType = ImageView.ScaleType.FIT_CENTER
      adjustViewBounds = true
      maxHeight = dp(heightDp)
      importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }
  }

  private fun imageParams(heightDp: Int) =
    LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(heightDp)).apply { bottomMargin = dp(4) }

  private fun label(text: String) = TextView(context).apply {
    this.text = text
    setTextColor(0xFFFFE3E6.toInt())
    letterSpacing = 0.12f
    setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
    typeface = Typeface.DEFAULT_BOLD
  }

  private val clash: Typeface by lazy {
    runCatching { ResourcesCompat.getFont(context, R.font.clash_display_bold) }.getOrNull() ?: Typeface.create("sans-serif-black", Typeface.NORMAL)
  }

  private fun headline(text: String, size: Float = 34f, bottom: Int = 36, display: Boolean = true) = TextView(context).apply {
    this.text = text
    setTextColor(0xFFFFFFFF.toInt())
    setTextSize(TypedValue.COMPLEX_UNIT_SP, size)
    typeface = if (display) clash else Typeface.create("sans-serif-black", Typeface.NORMAL)
    setLineSpacing(0f, 1.08f)
    setPadding(0, dp(12), 0, dp(bottom))
  }

  private fun body(text: String) = TextView(context).apply {
    this.text = text
    setTextColor(0xE6FFFFFF.toInt())
    setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
    setLineSpacing(0f, 1.15f)
    setPadding(0, 0, 0, dp(24))
  }

  private fun primaryButton(text: String, onClick: () -> Unit) = TextView(context).apply {
    this.text = text
    gravity = Gravity.CENTER
    setTextColor(0xFFE5132B.toInt())
    setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
    typeface = Typeface.DEFAULT_BOLD
    background = GradientDrawable().apply {
      setColor(0xFFFFFFFF.toInt())
      cornerRadius = dp(18).toFloat()
    }
    setOnClickListener { onClick() }
  }

  private fun quietButton(text: String, underline: Boolean = false, onClick: () -> Unit) = TextView(context).apply {
    this.text = text
    if (underline) paintFlags = paintFlags or android.graphics.Paint.UNDERLINE_TEXT_FLAG
    gravity = Gravity.CENTER
    setTextColor(0xCCFFFFFF.toInt())
    setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
    setPadding(0, dp(18), 0, dp(8))
    setOnClickListener { onClick() }
  }

  private fun chip(text: String) = TextView(context).apply {
    this.text = text
    gravity = Gravity.CENTER_VERTICAL
    setPadding(dp(18), 0, dp(18), 0)
    setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
    typeface = Typeface.DEFAULT_BOLD
    styleChip(this, false)
  }

  private fun styleChip(v: TextView, selected: Boolean) {
    v.setTextColor(if (selected) 0xFFC20F24.toInt() else 0xFFFFFFFF.toInt())
    v.background = GradientDrawable().apply {
      cornerRadius = dp(14).toFloat()
      if (selected) setColor(0xFFFFFFFF.toInt()) else {
        setColor(0x1FFFFFFF)
        setStroke(dp(1), 0x59FFFFFF)
      }
    }
  }

  private fun fullWidth(heightDp: Int) = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(heightDp))

  private fun fill(t: String, app: String) = t.replace("{app}", app)

  private fun systemBar(name: String): Int {
    val id = context.resources.getIdentifier(name, "dimen", "android")
    return if (id > 0) context.resources.getDimensionPixelSize(id) else dp(24)
  }

  private fun buzz() {
    @Suppress("DEPRECATION")
    val v = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      v.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 60, 80, 120), -1))
    } else {
      @Suppress("DEPRECATION")
      v.vibrate(longArrayOf(0, 60, 80, 120), -1)
    }
  }

  private fun dp(v: Int) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), context.resources.displayMetrics).toInt()

  companion object {
    private const val TAG = "Endloop"
    private val COUNTDOWN = Any()
  }
}
