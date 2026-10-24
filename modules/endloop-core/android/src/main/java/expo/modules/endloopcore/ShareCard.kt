package expo.modules.endloopcore

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.text.Layout
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.StyleSpan
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.content.res.ResourcesCompat
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

/** FileProvider of our own, so it can't clash with another library's in the merged manifest. */
class ShareProvider : FileProvider()

/**
 * Share cards (canvas Screen 21): square 1080×1080 cards that work in a feed and in Stories.
 *  A roast · the roast of the moment (red)
 *  B milestone · all-apps streak (cream)
 *  C leave · Leave Letter approved (blush)
 *  D weekly · time won back and the app swing (dark)
 * Every card: 84 px padding, eyebrow, content, Loop / Lupe bottom right, wordmark + "Get roasted. Scroll less." footer.
 */
object ShareCard {
  private const val S = 1080
  private const val PAD = 84f

  private const val RED = 0xFFE5132B.toInt()
  private const val INK = 0xFF141414.toInt()
  private const val MUTED = 0xFF5F5F5F.toInt()
  private const val WHITE = 0xFFFFFFFF.toInt()

  /** Kept for "Share this roast" from the overlay and Hall of shame. */
  data class Card(val eyebrow: String, val roast: String, val stat: String, val tagline: String, val character: Int)

  fun share(context: Context, card: Card, title: String): Boolean =
    shareBitmap(context, roast(context, card.eyebrow, card.roast, card.stat, card.tagline, card.character), title)

  /** JSON from JS: { kind: roast|milestone|leave|weekly, character: drawable name, tagline, ...kind fields }. */
  fun render(context: Context, o: JSONObject): Bitmap {
    val res = context.resources.getIdentifier(o.optString("character"), "drawable", context.packageName)
    val tagline = o.optString("tagline", "Get roasted. Scroll less.")
    return when (o.optString("kind")) {
      "milestone" -> milestone(context, o, res, tagline)
      "leave" -> leave(context, o, res, tagline)
      "weekly" -> weekly(context, o, res, tagline)
      else -> roast(context, o.optString("eyebrow", "I GOT ROASTED"), o.optString("roast"), o.optString("stat"), tagline, res)
    }
  }

  /* ---------- A · roast ---------- */

  private fun roast(context: Context, eyebrow: String, text: String, stat: String, tagline: String, character: Int): Bitmap {
    val (bmp, c) = canvas()
    c.drawRect(0f, 0f, S.toFloat(), S.toFloat(), Paint().apply {
      shader = LinearGradient(0f, 0f, 0f, S.toFloat(), intArrayOf(0xFFF0263D.toInt(), 0xFFC20F24.toInt(), 0xFF7A0714.toInt()), floatArrayOf(0f, 0.55f, 1f), Shader.TileMode.CLAMP)
    })
    character(context, c, character, right = 40, size = 400)
    var y = eyebrow(c, eyebrow, 0xFFFFE3E6.toInt())
    val big = text(clash(context), 76f, WHITE)
    var layout = wrap(text, big, 900)
    while (layout.height > 420 && big.textSize > 48f) {
      big.textSize -= 4f
      layout = wrap(text, big, 900)
    }
    y += 28f
    draw(c, layout, y)
    y += layout.height + 28f
    if (stat.isNotBlank()) draw(c, wrap(stat, text(Typeface.DEFAULT, 34f, 0xE0FFFFFF.toInt()), 520), y)
    footer(context, c, tagline, light = false)
    return bmp
  }

  /* ---------- B · milestone ---------- */

  private fun milestone(context: Context, o: JSONObject, character: Int, tagline: String): Bitmap {
    val (bmp, c) = canvas(0xFFFFF3E0.toInt())
    character(context, c, character, right = 30, size = 470)
    // pill: "All apps streak"
    val pillText = text(Typeface.DEFAULT_BOLD, 30f, RED)
    val label = o.optString("pill", "All apps streak")
    val pw = pillText.measureText(label) + 56f + 30f
    c.drawRoundRect(RectF(PAD, PAD, PAD + pw, PAD + 64f), 32f, 32f, fill(0xFFFFE3E6.toInt()))
    drawFlame(c, PAD + 28f, PAD + 32f)
    c.drawText(label, PAD + 28f + 30f, PAD + 43f, pillText)

    val num = text(clash(context), 360f, RED)
    c.drawText(o.optString("days"), PAD - 10f, PAD + 64f + 24f + 300f, num)
    var y = PAD + 64f + 24f + 300f + 40f
    val days = text(clash(context), 72f, INK)
    c.drawText(o.optString("label", "days present."), PAD, y + 62f, days)
    y += 62f + 30f
    draw(c, wrap(o.optString("line"), text(Typeface.DEFAULT_BOLD, 38f, INK), 470), y)
    footer(context, c, tagline, light = true)
    return bmp
  }

  /* ---------- C · leave letter ---------- */

  private fun leave(context: Context, o: JSONObject, character: Int, tagline: String): Bitmap {
    val (bmp, c) = canvas(0xFFFFF4F5.toInt())
    character(context, c, character, right = 0, size = 360)
    var y = eyebrow(c, o.optString("eyebrow", "MY LEAVE LETTER"), 0xFFB80F22.toInt()) + 28f

    // the letter
    val inner = 640 - 96
    val body = text(Typeface.DEFAULT, 34f, INK)
    val parts = listOf(
      wrap(o.optString("date"), text(Typeface.DEFAULT_BOLD, 26f, MUTED), inner),
      wrap(rich("${o.optString("to")}, " to true, o.optString("toRole") to false), body, inner, 1.25f),
      wrap(rich(o.optString("pre", "I am suffering from ") to false, o.optString("reason") to true, o.optString("post") to false), body, inner, 1.25f),
      wrap(rich(o.optString("signoff", "Yours obediently,") + "\n" to false, o.optString("name") to true), body, inner, 1.25f),
    )
    val h = 48f * 2 + parts.sumOf { it.height } + 22f * (parts.size - 1)
    val card = RectF(PAD, y, PAD + 640f, y + h)
    c.drawRoundRect(RectF(card.left, card.top + 2f, card.right, card.bottom + 2f), 28f, 28f, fill(0xFFF1D9DC.toInt()))
    c.drawRoundRect(card, 28f, 28f, fill(WHITE))
    var ly = y + 48f
    for (p in parts) {
      c.save(); c.translate(PAD + 48f, ly); p.draw(c); c.restore()
      ly += p.height + 22f
    }

    // APPROVED stamp, rotated over the top-right corner
    val stamp = text(clash(context), 72f, RED).apply { letterSpacing = 0.04f }
    val word = o.optString("stamp", "APPROVED")
    val sw = stamp.measureText(word) + 52f
    val sh = 72f + 20f
    c.save()
    c.translate(card.right + 60f - sw / 2f, y + 60f + sh / 2f)
    c.rotate(-12f)
    val r = RectF(-sw / 2f, -sh / 2f, sw / 2f, sh / 2f)
    c.drawRoundRect(r, 22f, 22f, fill(0xEBFFFFFF.toInt()))
    c.drawRoundRect(r, 22f, 22f, Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeWidth = 8f; color = RED })
    c.drawText(word, -sw / 2f + 26f, sh / 2f - 22f, stamp)
    c.restore()

    y = card.bottom + 34f
    draw(c, wrap(o.optString("line"), text(clash(context), 44f, INK), 600, 1.12f), y)
    footer(context, c, tagline, light = true)
    return bmp
  }

  /* ---------- D · weekly ---------- */

  private fun weekly(context: Context, o: JSONObject, character: Int, tagline: String): Bitmap {
    val (bmp, c) = canvas(INK)
    character(context, c, character, right = 10, size = 400)
    var y = eyebrow(c, o.optString("dates"), 0xFFFFB38A.toInt()) + 30f
    c.drawText(o.optString("label", "Time won back"), PAD, y + 36f, text(Typeface.DEFAULT_BOLD, 40f, 0xCCFFFFFF.toInt()))
    y += 50f
    val big = text(clash(context), 220f, WHITE)
    val total = o.optString("total")
    while (big.measureText(total) > S - PAD * 2 && big.textSize > 120f) big.textSize -= 8f
    c.drawText(total, PAD - 6f, y + big.textSize * 0.8f, big)
    y += big.textSize * 0.95f + 40f

    val apps = o.optJSONArray("apps")
    val name = text(Typeface.DEFAULT_BOLD, 38f, WHITE)
    val letter = text(Typeface.DEFAULT_BOLD, 30f, WHITE).apply { textAlign = Paint.Align.CENTER }
    val line = fill(0x26FFFFFF)
    for (i in 0 until (apps?.length() ?: 0).coerceAtMost(3)) {
      val a = apps!!.getJSONObject(i)
      val tile = runCatching { Color.parseColor(a.optString("color", "#555555")) }.getOrDefault(0xFF555555.toInt())
      c.drawRoundRect(RectF(PAD, y, PAD + 64f, y + 64f), 18f, 18f, fill(tile))
      c.drawText(a.optString("label").take(1).uppercase(), PAD + 32f, y + 43f, letter)
      c.drawText(ellipsize(a.optString("label"), name, 360f), PAD + 86f, y + 45f, name)
      val change = a.optString("change")
      if (change.isNotBlank()) {
        val ch = text(Typeface.DEFAULT_BOLD, 38f, if (a.optBoolean("up")) 0xFFFF8A96.toInt() else 0xFF6FE0B0.toInt()).apply { textAlign = Paint.Align.RIGHT }
        c.drawText(change, PAD + 560f, y + 45f, ch)
      }
      y += 64f + 18f
      c.drawRect(PAD, y, PAD + 560f, y + 2f, line)
      y += 18f
    }
    y += 16f
    draw(c, wrap(o.optString("roast"), text(Typeface.DEFAULT_BOLD, 40f, WHITE), 600, 1.15f), y)
    footer(context, c, tagline, light = false)
    return bmp
  }

  /* ---------- parts ---------- */

  private fun canvas(bg: Int? = null): Pair<Bitmap, Canvas> {
    val bmp = Bitmap.createBitmap(S, S, Bitmap.Config.ARGB_8888)
    val c = Canvas(bmp)
    if (bg != null) c.drawColor(bg)
    return bmp to c
  }

  /** Eyebrow at the top; returns its bottom. */
  private fun eyebrow(c: Canvas, s: String, color: Int): Float {
    val p = text(Typeface.DEFAULT_BOLD, 30f, color).apply { letterSpacing = 0.13f }
    c.drawText(ellipsize(s, p, S - PAD * 2), PAD, PAD + 26f, p)
    return PAD + 34f
  }

  /** Loop / Lupe bottom right, 150 px above the bottom edge (the drawables already fade out at the bottom). */
  private fun character(context: Context, c: Canvas, res: Int, right: Int, size: Int) {
    if (res == 0) return
    ContextCompat.getDrawable(context, res)?.let { d ->
      val r = S - right
      val b = S - 150
      d.setBounds(r - size, b - size, r, b)
      d.draw(c)
    }
  }

  private fun footer(context: Context, c: Canvas, tagline: String, light: Boolean) {
    val res = if (light) R.drawable.endloop_wordmark_ink else R.drawable.endloop_wordmark_white
    ContextCompat.getDrawable(context, res)?.let { d ->
      d.setBounds(PAD.toInt(), S - 72 - 66, PAD.toInt() + 240, S - 72)
      d.draw(c)
    }
    val p = text(Typeface.DEFAULT_BOLD, 32f, if (light) MUTED else 0xE6FFFFFF.toInt()).apply { textAlign = Paint.Align.RIGHT }
    c.drawText(tagline, S - PAD, S - 72f - 22f, p)
  }

  private fun drawFlame(c: Canvas, x: Float, cy: Float) {
    val path = android.graphics.Path().apply {
      moveTo(x + 10f, cy - 15f)
      cubicTo(x + 20f, cy - 4f, x + 22f, cy + 4f, x + 20f, cy + 9f)
      cubicTo(x + 18f, cy + 15f, x + 2f, cy + 15f, x, cy + 9f)
      cubicTo(x - 2f, cy + 2f, x + 4f, cy - 3f, x + 6f, cy - 6f)
      cubicTo(x + 7f, cy - 2f, x + 9f, cy - 1f, x + 10f, cy - 2f)
      cubicTo(x + 11f, cy - 7f, x + 10f, cy - 11f, x + 10f, cy - 15f)
      close()
    }
    c.drawPath(path, fill(RED))
  }

  private fun clash(context: Context): Typeface =
    runCatching { ResourcesCompat.getFont(context, R.font.clash_display_bold) }.getOrNull() ?: Typeface.DEFAULT_BOLD

  private fun text(tf: Typeface, size: Float, color: Int) = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = tf; textSize = size; this.color = color }
  private fun fill(color: Int) = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color }

  /** Text runs, each plain or bold: rich("To Loop, " to true, "Head of My Screen Time" to false). */
  private fun rich(vararg runs: Pair<String, Boolean>): CharSequence {
    val sb = SpannableStringBuilder()
    for ((t, isBold) in runs) {
      val start = sb.length
      sb.append(t)
      if (isBold && t.isNotEmpty()) sb.setSpan(StyleSpan(Typeface.BOLD), start, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    }
    return sb
  }

  private fun ellipsize(s: String, p: Paint, max: Float): String {
    if (p.measureText(s) <= max) return s
    var t = s
    while (t.isNotEmpty() && p.measureText("$t…") > max) t = t.dropLast(1)
    return "$t…"
  }

  private fun draw(c: Canvas, layout: StaticLayout, y: Float) {
    c.save(); c.translate(PAD, y); layout.draw(c); c.restore()
  }

  private fun wrap(text: CharSequence, paint: TextPaint, width: Int, spacing: Float = 1.04f): StaticLayout =
    StaticLayout.Builder.obtain(text, 0, text.length, paint, width)
      .setAlignment(Layout.Alignment.ALIGN_NORMAL)
      .setLineSpacing(0f, spacing)
      .setIncludePad(false)
      .build()

  /* ---------- out ---------- */

  /** Save to Pictures/Endloop (Android 10+, no permission needed). */
  fun save(context: Context, bmp: Bitmap): Boolean {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.Q) return false
    return try {
      val values = android.content.ContentValues().apply {
        put(android.provider.MediaStore.Images.Media.DISPLAY_NAME, "endloop-${System.currentTimeMillis()}.png")
        put(android.provider.MediaStore.Images.Media.MIME_TYPE, "image/png")
        put(android.provider.MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Endloop")
      }
      val uri = context.contentResolver.insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: return false
      context.contentResolver.openOutputStream(uri)?.use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
      true
    } catch (e: Exception) {
      android.util.Log.e("Endloop", "save failed", e)
      false
    }
  }

  fun shareBitmap(context: Context, bmp: Bitmap, title: String): Boolean = try {
    val dir = File(context.cacheDir, "roasts").apply { mkdirs() }
    dir.listFiles()?.forEach { it.delete() } // keep only the latest card
    val file = File(dir, "endloop-${System.currentTimeMillis()}.png")
    FileOutputStream(file).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    val uri = FileProvider.getUriForFile(context, "${context.packageName}.endloop.share", file)
    val send = Intent(Intent.ACTION_SEND).apply {
      type = "image/png"
      putExtra(Intent.EXTRA_STREAM, uri)
      clipData = ClipData.newRawUri(null, uri)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    context.startActivity(Intent.createChooser(send, title).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION))
    true
  } catch (e: Exception) {
    android.util.Log.e("Endloop", "share failed", e)
    false
  }
}
