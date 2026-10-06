package expo.modules.endloopcore

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.content.res.ResourcesCompat
import java.io.File
import java.io.FileOutputStream

/** FileProvider of our own, so it can't clash with another library's in the merged manifest. */
class ShareProvider : FileProvider()

/**
 * "Share this roast" (Screen 9): a 1080×1920 story card with the roast, the stat, Loop / Lupe and
 * the wordmark, saved to the cache and handed to the share sheet.
 */
object ShareCard {
  private const val W = 1080
  private const val H = 1920

  data class Card(val eyebrow: String, val roast: String, val stat: String, val tagline: String, val character: Int)

  fun render(context: Context, card: Card): Bitmap {
    val bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
    val c = Canvas(bmp)
    c.drawRect(0f, 0f, W.toFloat(), H.toFloat(), Paint().apply {
      shader = LinearGradient(0f, 0f, 0f, H.toFloat(), intArrayOf(0xFFF0263D.toInt(), 0xFFC20F24.toInt(), 0xFF7A0714.toInt()), floatArrayOf(0f, 0.55f, 1f), Shader.TileMode.CLAMP)
    })

    val pad = 84f
    val clash = runCatching { ResourcesCompat.getFont(context, R.font.clash_display_bold) }.getOrNull() ?: Typeface.DEFAULT_BOLD

    val eyebrow = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = 0xFFFFE3E6.toInt(); typeface = Typeface.DEFAULT_BOLD; textSize = 40f; letterSpacing = 0.12f
    }
    c.drawText(card.eyebrow, pad, 200f, eyebrow)

    // the roast, wrapped; shrinks for long lines
    val roastPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFFFFF.toInt(); typeface = clash; textSize = 112f }
    val width = (W - pad * 2).toInt()
    var layout = wrap(card.roast, roastPaint, width)
    while (layout.height > 760 && roastPaint.textSize > 64f) {
      roastPaint.textSize -= 6f
      layout = wrap(card.roast, roastPaint, width)
    }
    c.save()
    c.translate(pad, 250f)
    layout.draw(c)
    c.restore()

    val stat = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xD9FFFFFF.toInt(); typeface = Typeface.DEFAULT_BOLD; textSize = 44f }
    c.drawText(card.stat, pad, 250f + layout.height + 90f, stat)

    // Loop / Lupe, centred above the footer
    if (card.character != 0) {
      ContextCompat.getDrawable(context, card.character)?.let { d ->
        val size = 860
        val left = (W - size) / 2
        val bottom = H - 190
        d.setBounds(left, bottom - size, left + size, bottom)
        d.draw(c)
      }
    }

    // footer: wordmark left, tagline right
    ContextCompat.getDrawable(context, R.drawable.endloop_wordmark_white)?.let { d ->
      d.setBounds(pad.toInt(), H - 150, pad.toInt() + 330, H - 150 + 91)
      d.draw(c)
    }
    val tag = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = 0xD9FFFFFF.toInt(); typeface = Typeface.DEFAULT_BOLD; textSize = 38f; textAlign = Paint.Align.RIGHT
    }
    c.drawText(card.tagline, W - pad, H - 88f, tag)
    return bmp
  }

  /** Save the card and open the share sheet on top of everything. */
  fun share(context: Context, card: Card, title: String): Boolean = shareBitmap(context, render(context, card), title)

  /** Screen 13: the weekly roast card, Stories size. */
  data class Weekly(
    val dates: String, // "MY WEEK · 22–28 SEP"
    val total: String,
    val worst: String, // "Worst offender: YouTube · 6h 10m"
    val win: String, // "4h 20m won back"
    val roast: String,
    val tagline: String, // "Get roasted too → endloop app"
    val character: Int,
  )

  fun renderWeekly(context: Context, w: Weekly): Bitmap {
    val bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
    val c = Canvas(bmp)
    c.drawRect(0f, 0f, W.toFloat(), H.toFloat(), Paint().apply {
      shader = LinearGradient(0f, 0f, 0f, H.toFloat(), intArrayOf(0xFFF0263D.toInt(), 0xFFC20F24.toInt(), 0xFF7A0714.toInt()), floatArrayOf(0f, 0.55f, 1f), Shader.TileMode.CLAMP)
    })
    val pad = 72f
    val clash = runCatching { ResourcesCompat.getFont(context, R.font.clash_display_bold) }.getOrNull() ?: Typeface.DEFAULT_BOLD
    val bold = Typeface.DEFAULT_BOLD

    // Loop / Lupe first, bottom right, so the text sits on top
    if (w.character != 0) {
      ContextCompat.getDrawable(context, w.character)?.let { d ->
        val size = 720
        d.setBounds(W - size + 140, H - size - 60, W + 140, H - 60)
        d.draw(c)
      }
    }
    ContextCompat.getDrawable(context, R.drawable.endloop_wordmark_white)?.let { d ->
      d.setBounds(pad.toInt(), 96, pad.toInt() + 330, 96 + 91)
      d.draw(c)
    }
    c.drawText(w.dates, pad, 330f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFE3E6.toInt(); typeface = bold; textSize = 36f; letterSpacing = 0.1f })
    val big = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFFFFF.toInt(); typeface = clash; textSize = 210f }
    while (big.measureText(w.total) > W - pad * 2 && big.textSize > 100f) big.textSize -= 8f
    c.drawText(w.total, pad - 6, 330f + 30 + big.textSize * 0.9f, big)
    var y = 330f + 30 + big.textSize * 0.9f + 80f
    c.drawText(w.worst, pad, y, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xE6FFFFFF.toInt(); typeface = bold; textSize = 42f })
    y += 50f

    // the win, in a white pill
    val pillText = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF141414.toInt(); typeface = bold; textSize = 38f }
    val pw = pillText.measureText(w.win) + 64f
    c.drawRoundRect(android.graphics.RectF(pad, y, pad + pw, y + 76f), 38f, 38f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFFFFF.toInt() })
    c.drawText(w.win, pad + 32f, y + 51f, pillText)
    y += 76f + 60f

    val roastPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFFFFF.toInt(); typeface = clash; textSize = 72f }
    var layout = wrap(w.roast, roastPaint, 640)
    while (layout.height > 520 && roastPaint.textSize > 44f) {
      roastPaint.textSize -= 4f
      layout = wrap(w.roast, roastPaint, 640)
    }
    c.save()
    c.translate(pad, y)
    layout.draw(c)
    c.restore()

    c.drawText(w.tagline, pad, H - 80f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xE6FFFFFF.toInt(); typeface = bold; textSize = 40f })
    return bmp
  }

  /** Save to Pictures/Endloop (Android 10+, no permission needed). */
  fun save(context: Context, bmp: Bitmap): Boolean {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.Q) return false
    return try {
      val values = android.content.ContentValues().apply {
        put(android.provider.MediaStore.Images.Media.DISPLAY_NAME, "endloop-week-${System.currentTimeMillis()}.png")
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
    val file = File(dir, "endloop-roast-${System.currentTimeMillis()}.png")
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

  private fun wrap(text: String, paint: TextPaint, width: Int): StaticLayout =
    StaticLayout.Builder.obtain(text, 0, text.length, paint, width)
      .setAlignment(Layout.Alignment.ALIGN_NORMAL)
      .setLineSpacing(0f, 1.04f)
      .setIncludePad(false)
      .build()
}
