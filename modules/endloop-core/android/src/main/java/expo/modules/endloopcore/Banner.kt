package expo.modules.endloopcore

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import androidx.core.content.ContextCompat
import androidx.core.content.res.ResourcesCompat

/**
 * Draws the notification art (Screen 8) at runtime, so it follows the user's roaster and
 * the numbers can change (e.g. the late-night clock):
 * - banner(): the expanded big picture: state gradient, white wordmark, small label, one big word, Loop / Lupe.
 * - face(): the round character face used as the collapsed large icon.
 */
object Banner {
  enum class Kind(val from: Int, val to: Int) {
    HEADS_UP(0xFFF5A524.toInt(), 0xFFB86E00.toInt()),
    LAST_CALL(0xFFE08A00.toInt(), 0xFFE5132B.toInt()),
    LATE_NIGHT(0xFF6B5BFF.toInt(), 0xFF1B1464.toInt()),
    WEEKLY(0xFFF0263D.toInt(), 0xFF7A0714.toInt()),
  }

  private const val W = 1024
  private const val H = 512

  fun banner(context: Context, kind: Kind, small: String, big: String, character: Int): Bitmap {
    val bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
    val c = Canvas(bmp)

    // 135° gradient, like the mockups
    c.drawRect(0f, 0f, W.toFloat(), H.toFloat(), Paint().apply {
      shader = LinearGradient(0f, 0f, W.toFloat(), H.toFloat(), kind.from, kind.to, Shader.TileMode.CLAMP)
    })

    // Loop / Lupe, bottom right, slightly past the edges
    if (character != 0) {
      ContextCompat.getDrawable(context, character)?.let { d ->
        val size = 540
        d.setBounds(W - size + 30, H - size + 40, W + 30, H + 40)
        d.draw(c)
      }
    }

    // white wordmark, top left
    ContextCompat.getDrawable(context, R.drawable.endloop_wordmark_white)?.let { d ->
      d.setBounds(52, 46, 52 + 232, 46 + 64)
      d.draw(c)
    }

    val clash = runCatching { ResourcesCompat.getFont(context, R.font.clash_display_bold) }.getOrNull() ?: Typeface.DEFAULT_BOLD
    val bigPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.WHITE
      typeface = clash
      textSize = 132f
    }
    // keep the big word clear of the character
    val maxW = W * 0.52f
    while (bigPaint.measureText(big) > maxW && bigPaint.textSize > 60f) bigPaint.textSize -= 6f
    val smallPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = 0xD9FFFFFF.toInt()
      typeface = Typeface.DEFAULT_BOLD
      textSize = 36f
      letterSpacing = 0.1f
    }
    val baseline = H - 56f
    c.drawText(big, 52f, baseline, bigPaint)
    c.drawText(small, 56f, baseline - bigPaint.textSize * 0.82f - 18f, smallPaint)
    return bmp
  }

  /** Round crop of the character's head for the collapsed notification. */
  fun face(context: Context, character: Int, tint: Int = 0xFFFFE3E6.toInt()): Bitmap? {
    if (character == 0) return null
    val d = ContextCompat.getDrawable(context, character) ?: return null
    val src = Bitmap.createBitmap(600, 600, Bitmap.Config.ARGB_8888)
    d.setBounds(0, 0, 600, 600)
    d.draw(Canvas(src))

    val out = 256
    val bmp = Bitmap.createBitmap(out, out, Bitmap.Config.ARGB_8888)
    val c = Canvas(bmp)
    val circle = RectF(0f, 0f, out.toFloat(), out.toFloat())
    c.drawOval(circle, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = tint })
    // the head sits in the top middle of every pose
    val crop = Rect(140, 30, 460, 350)
    val head = Bitmap.createBitmap(src, crop.left, crop.top, crop.width(), crop.height())
    val scaled = Bitmap.createScaledBitmap(head, out, out, true)
    c.drawOval(circle, Paint(Paint.ANTI_ALIAS_FLAG).apply {
      shader = BitmapShader(scaled, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
    })
    return bmp
  }
}
