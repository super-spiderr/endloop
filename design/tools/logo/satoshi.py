import json, math
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

S = "/tmp/claude-0/-home-claude/21a67691-555a-57b1-b43c-73e721e2012c/scratchpad"
L = f"{S}/logo"
ns = {"__file__": f"{L}/gen.py"}
exec(open(f"{L}/gen.py").read().split("# ---------- boards")[0], ns)
HEAD, tail, ROOT = ns["HEAD"], ns["tail"], ns["ROOT"]
INK, RED, WHITE = "#141414", "#E5132B", "#FFFFFF"
LOOPFACE = ns["LOOP"]
TAU = 2 * math.pi

FONTS = {w: TTFont(f"{S}/fonts/satoshi/Satoshi-{w}.woff2") for w in ("Bold", "Black")}
SW = {"Bold": 108, "Black": 140}   # loop stroke ~ the font's stem weight
BASE = 800                          # baseline y in the SVG (y grows down)

def glyph_path(font, ch, x0):
    gs = font.getGlyphSet(); g = font.getBestCmap()[ord(ch)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x0, BASE)))
    return pen.getCommands(), gs[g].width

def inf_pts(a, r, gap_deg=(8, 80), n=400):
    """Infinity made of two round lobes (circle radius r, outer half-width a) joined by
    straight crossing strokes, like the o's of the font. Returns points (math coords, y up)
    for the whole loop minus a gap on the upper right of the right lobe (B3)."""
    c = a - r
    th = math.asin(min(0.999, r / c))
    def tan_pt(sign_x, sign_y):
        return (sign_x * c * math.cos(th) ** 2, sign_y * c * math.cos(th) * math.sin(th))
    def ang(p, cx):
        return math.degrees(math.atan2(p[1], p[0] - cx))
    R_up, R_dn = tan_pt(1, 1), tan_pt(1, -1)
    L_up, L_dn = tan_pt(-1, 1), tan_pt(-1, -1)
    a_rup, a_rdn = ang(R_up, c), ang(R_dn, c)       # right arc runs a_rdn -> 0 -> a_rup (ccw)
    a_lup, a_ldn = ang(L_up, -c), ang(L_dn, -c)     # left arc runs a_ldn -> 180 -> a_lup (cw)
    def arc(cx, a0, a1, k):
        return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / k)), r * math.sin(math.radians(a0 + (a1 - a0) * i / k))) for i in range(k + 1)]
    def line(p, q, k=40):
        return [(p[0] + (q[0] - p[0]) * i / k, p[1] + (q[1] - p[1]) * i / k) for i in range(k + 1)]
    g0, g1 = gap_deg
    la_dn = a_ldn if a_ldn < 0 else a_ldn - 360     # go clockwise from lower-left tangent through 180
    pts = []
    pts += arc(c, g1, a_rup, 60)                     # after the gap, over the top of the right lobe
    pts += line(R_up, L_dn, 80)                      # down through the crossing
    pts += arc(-c, a_ldn, a_ldn - (360 - (a_lup - a_ldn)) if a_lup > a_ldn else a_lup, 160) if False else arc(-c, a_ldn + 360 if a_ldn < 0 else a_ldn, a_lup, 160)
    pts += line(L_up, R_dn, 80)                      # back through the crossing
    pts += arc(c, a_rdn, g0, 120)                    # round the right side up to the gap
    return pts

def loop_svg(color, cx, cy, a, r, sw, rot):
    cr, sr = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    out = []
    for x, y in inf_pts(a, r):
        y = -y                                        # to SVG (y down)
        out.append((cx + x * cr - y * sr, cy + x * sr + y * cr))
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in out)
    return f'<path fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" d="{d}"/>'

def wordmark(weight="Bold", rot=-8, ink=INK, loopc=RED, width=720):
    f = FONTS[weight]; sw = SW[weight]
    gs = f.getGlyphSet(); cmap = f.getBestCmap()
    o_adv = gs[cmap[ord("o")]].width
    from fontTools.pens.boundsPen import BoundsPen
    bp = BoundsPen(gs); gs[cmap[ord("o")]].draw(bp); ox0, oy0, ox1, oy1 = bp.bounds
    x = 0; parts = []
    for ch in "endl":
        d, adv = glyph_path(f, ch, x); parts.append(f'<path fill="{ink}" d="{d}"/>'); x += adv
    left, right = x + ox0, x + o_adv + ox1
    a = (right - left - sw) / 2
    hy = (oy1 - oy0 - sw) / 2
    cx = (left + right) / 2; cy = BASE - (oy0 + oy1) / 2
    loop = loop_svg(loopc, cx, cy, a * 0.97, hy * 0.97, sw, rot)
    x += 2 * o_adv
    d, adv = glyph_path(f, "p", x); parts.append(f'<path fill="{ink}" d="{d}"/>'); x += adv
    top, bot = BASE - 800, BASE + 260
    vbw = x + 40
    h = width * (bot - top) / vbw
    return (f'<svg width="{width}" height="{h:.0f}" viewBox="-20 {top} {vbw} {bot-top}" role="img" aria-label="endloop">'
            + "".join(parts) + loop + "</svg>")

def symbol(color, size, rot=-8, sw=22, pad=0.1):
    a, hy = 100, 40
    ext = a + sw
    vb = 2 * ext * (1 + pad)
    return (f'<svg width="{size}" height="{size}" viewBox="{-vb/2:.1f} {-vb/2:.1f} {vb:.1f} {vb:.1f}" aria-hidden="true">'
            + loop_svg(color, 0, 0, a, hy, sw, rot) + "</svg>")

files = {}
def board(name, title, w, h, bg, inner):
    html = HEAD.format(title=title, bg=bg) + (
        f'<div style="width: {w}px; height: {h}px; background: {bg}; position: relative; overflow: hidden; '
        f'display: flex; align-items: center; justify-content: center;">\n{inner}\n</div>\n') + tail(w, h)
    open(f"{ROOT}/project/{name}", "w").write(html)
    files[name] = (w, h, title)

lab = 'font-size: 13px; color: #5F5F5F;'
def col(*items, gap=18):
    return f'<div style="display: flex; flex-direction: column; align-items: center; gap: {gap}px;">{"".join(items)}</div>'

# 1 hero
board("SatoshiHero.dc.html", "Satoshi Bold · B3 tilted 8°", 1100, 520, WHITE, wordmark("Bold", -8, width=820))

# 2 tilt options
rows = "".join(col(wordmark("Bold", r, width=520), f'<div style="{lab}">{abs(r)}° tilt</div>', gap=8) for r in (0, -5, -8, -12))
board("SatoshiTilt.dc.html", "Tilt options", 1240, 560, WHITE,
      f'<div style="display: grid; grid-template-columns: repeat(2, 560px); gap: 40px 60px;">{rows}</div>')

# 3 weight
wt = "".join(col(wordmark(w, -8, width=520), f'<div style="{lab}">Satoshi {w}</div>', gap=8) for w in ("Bold", "Black"))
board("SatoshiWeight.dc.html", "Bold vs Black", 1240, 360, WHITE, f'<div style="display: flex; gap: 60px;">{wt}</div>')

# 4 reversed + dark
board("SatoshiReversed.dc.html", "On red", 1100, 460, RED, wordmark("Bold", -8, WHITE, WHITE, 760))
board("SatoshiDark.dc.html", "Dark mode", 1100, 460, "#140A0B", wordmark("Bold", -8, "#F6EDEE", RED, 760))

# 5 symbol + icons + notification
def icon(size, radius, bg=RED, fg=WHITE):
    return (f'<div style="width: {size}px; height: {size}px; border-radius: {radius}; background: {bg}; display: flex; align-items: center; justify-content: center; flex: none;">'
            f'{symbol(fg, int(size * 0.78), sw=26)}</div>')
cells = []
for s in (192, 96, 48):
    cells.append(col(icon(s, "50%"), f'<div style="{lab}">{s} circle</div>', gap=10))
    cells.append(col(icon(s, f"{s*0.3:.0f}px"), f'<div style="{lab}">{s} squircle</div>', gap=10))
status = (f'<div style="height: 48px; padding: 0 18px; border-radius: 24px; background: #1E1E22; display: flex; align-items: center; gap: 10px; color: #EDEDED; font-size: 13px;">'
          f'<span style="font-weight: 600;">9:41</span>{symbol(WHITE, 22, sw=30, pad=0)}<span style="width: 160px;"></span><span>84%</span></div>')
sym = (f'<div style="display: flex; flex-direction: column; gap: 40px; align-items: center;">'
       f'<div style="display: flex; gap: 40px; align-items: center;">'
       f'<div style="width: 240px; height: 240px; border: 1px solid #F1D9DC; border-radius: 28px; display: flex; align-items: center; justify-content: center;">{symbol(RED, 200)}</div>'
       f'<div style="width: 240px; height: 240px; background: {RED}; border-radius: 28px; display: flex; align-items: center; justify-content: center;">{symbol(WHITE, 200)}</div>'
       f'<div style="width: 240px; height: 240px; background: #140A0B; border-radius: 28px; display: flex; align-items: center; justify-content: center;">{symbol(RED, 200)}</div></div>'
       f'<div style="display: flex; gap: 28px; align-items: flex-end;">{"".join(cells)}</div>'
       f'{status}</div>')
board("SatoshiIcons.dc.html", "Symbol, app icon, status bar", 1240, 900, WHITE, sym)

# ---- canvas.json: merge into the latest saved copy ----
c = json.load(open(f"{S}/artifact-files/0a347c28-b730-4bd9-b505-1b2f0a8ae57c/project/canvas.json"))
X0 = 3300
layout = [("SatoshiHero.dc.html", X0, 0), ("SatoshiTilt.dc.html", X0 + 1180, 0),
          ("SatoshiWeight.dc.html", X0, 640), ("SatoshiReversed.dc.html", X0, 1100), ("SatoshiDark.dc.html", X0 + 1180, 1100),
          ("SatoshiIcons.dc.html", X0, 1660)]
for n, x, y in layout:
    c["boards"][n] = {"x": x, "y": y, "w": files[n][0], "h": files[n][1], "title": files[n][2]}
    if n not in c["order"]:
        c["order"].insert(0, n)
c["notes"]["t4"] = {"kind": "title1", "maxW": 2400, "text": "Chosen direction · B3 tilted + Satoshi", "w": 240, "x": X0, "y": -200}
json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)

open(f"{L}/prev3.html", "w").write("<body style=margin:0>" + "".join(
    f'<div style="padding:10px">{wordmark("Bold", r, width=600)}</div>' for r in (-8, -12)) +
    f'<div style="padding:10px">{wordmark("Black", -8, width=600)}</div><div style="background:{RED};padding:10px">{symbol(WHITE,150)}{symbol(WHITE,24,sw=40,pad=0)}</div></body>')
print(json.dumps({f"project/{n}": f"project/{n}" for n in files}))
