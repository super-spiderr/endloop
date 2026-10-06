import json, os, math, datetime

ROOT = os.path.dirname(os.path.abspath(__file__)) + "/out"
os.makedirs(ROOT + "/project", exist_ok=True)
LOOP = "/_blob/e522f24a8570ff1023b4f6de9ce44479"
INK, RED, WHITE, BLUSH, SURF = "#141414", "#E5132B", "#FFFFFF", "#FFE3E6", "#FFF4F5"
SW = 24  # stroke width

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#141414;background:{bg}}}
</style>
</helmet>
"""

def tail(w, h):
    return """</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":%d,"height":%d}}'>
class Component extends DCLogic {
renderVals() { return {}; }
}
</script>
</body>
</html>
""" % (w, h)

# ---------- geometry ----------
A = 84.0   # infinity half-width (Gerono lemniscate, rounder lobes)
HY = 0.4524  # lobe half-height ratio: HY*A = 38 = bowl radius
LEFT = 392   # left outer edge of the loop in the wordmark

def lemni(cx, cy, a=A, gap=None, steps=240):
    """Return list of SVG path strings. gap=(t0,t1) radians removed (around t=0 is the right lobe tip)."""
    def pt(t):
        return cx + a * math.cos(t), cy + HY * a * math.sin(2 * t)
    if gap is None:
        ts = [2 * math.pi * i / steps for i in range(steps)]
        p = "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in map(pt, ts)) + " Z"
        return [p]
    g0, g1 = gap  # draw from g1 to 2pi+g0
    n = steps
    ts = [g1 + (2 * math.pi + g0 - g1) * i / n for i in range(n + 1)]
    return ["M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in map(pt, ts))]

GAP = (0.08, 0.74)  # small break on the lower right of the right lobe, echoing the e

def endpoint(cx, cy, t, a=A):
    d = 1 + math.sin(t) ** 2
    return cx + a * math.cos(t) / d, cy + a * math.sin(t) * math.cos(t) / d

def letters(ink):
    s = f'fill="none" stroke="{ink}" stroke-width="{SW}"'
    out = []
    # e  (cx=62)
    cx = 62
    ex, ey = cx + 38 * math.cos(math.radians(40)), 150 + 38 * math.sin(math.radians(40))
    out.append(f'<path {s} d="M{cx+38} 150 A38 38 0 1 0 {ex:.2f} {ey:.2f}"/>')
    out.append(f'<path {s} stroke-width="20" d="M{cx-38} 150 H{cx+38}"/>')
    # n  (stem 138)
    x0 = 138
    out.append(f'<path {s} d="M{x0} 100 V200 M{x0} 200 V138 A38 38 0 0 1 {x0+76} 138 V200"/>')
    # d  (cx 290)
    cx = 290
    out.append(f'<circle {s} cx="{cx}" cy="150" r="38"/>')
    out.append(f'<path {s} d="M{cx+38} 40 V200"/>')
    # l
    out.append(f'<path {s} d="M366 40 V200"/>')
    # p (cx 695)
    cx = PX
    out.append(f'<circle {s} cx="{cx}" cy="150" r="38"/>')
    out.append(f'<path {s} d="M{cx-38} 100 V260"/>')
    return "\n".join(out)

OX = LEFT + SW / 2 + A
PX = OX + A + SW / 2 + 14 + 50
END = PX + 50

def loop_paths(color, variant, cx=OX, cy=150, a=A, sw=SW):
    cap = "round" if variant != "closed" else "butt"
    gap = None if variant == "closed" else GAP
    ps = lemni(cx, cy, a, gap)
    out = [f'<path fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="{cap}" stroke-linejoin="round" d="{p}"/>' for p in ps]
    return "\n".join(out)

def wordmark_svg(ink, loopc, variant, width):
    vb_w = END + 12 + (46 if variant == "dot" else 0)
    body = letters(ink) + "\n" + loop_paths(loopc, "closed" if variant == "closed" else "broken")
    if variant == "dot":
        body += f'\n<circle cx="{END+30}" cy="188" r="16" fill="{loopc}"/>'
    h = width * 244 / vb_w
    return (f'<svg width="{width}" height="{h:.0f}" viewBox="0 28 {vb_w} 244" role="img" aria-label="endloop">'
            f'{body}</svg>')

def symbol_svg(color, variant, size, sw=None, pad=0.14):
    # square viewBox around the lemniscate
    a = 100
    sw = sw or 28
    span = 2 * a + sw
    m = span * pad
    vb = span + 2 * m
    cx = cy = vb / 2
    body = loop_paths(color, variant, cx, cy, a, sw)
    return f'<svg width="{size}" height="{size}" viewBox="0 0 {vb:.1f} {vb:.1f}" aria-hidden="true">{body}</svg>'

# ---------- boards ----------
files = {}

def board(name, title, w, h, bg, inner):
    html = HEAD.format(title=title, bg=bg) + (
        f'<div style="width: {w}px; height: {h}px; background: {bg}; position: relative; overflow: hidden; '
        f'display: flex; align-items: center; justify-content: center;">\n{inner}\n</div>\n') + tail(w, h)
    open(f"{ROOT}/project/{name}", "w").write(html)
    files[name] = (w, h, title)

WW, WH = 960, 440
board("WordmarkClosed.dc.html", "A · Closed infinity", WW, WH, WHITE, wordmark_svg(INK, RED, "closed", 720))
board("WordmarkBroken.dc.html", "B · Broken loop", WW, WH, WHITE, wordmark_svg(INK, RED, "broken", 720))
board("WordmarkDot.dc.html", "C · Broken loop + full stop", WW, WH, WHITE, wordmark_svg(INK, RED, "dot", 740))
board("WordmarkReversed.dc.html", "B reversed · white on red", WW, WH, RED, wordmark_svg(WHITE, WHITE, "broken", 720))
board("WordmarkDark.dc.html", "B on dark mode", WW, WH, "#140A0B", wordmark_svg("#F6EDEE", RED, "broken", 720))

# symbols
def tile(bg, content, label, border=False):
    b = f"border: 1px solid #F1D9DC;" if border else ""
    return (f'<div style="display: flex; flex-direction: column; align-items: center; gap: 14px;">'
            f'<div style="width: 240px; height: 240px; border-radius: 28px; background: {bg}; {b} display: flex; align-items: center; justify-content: center; overflow: hidden;">{content}</div>'
            f'<div style="font-size: 14px; color: #5F5F5F;">{label}</div></div>')

badge = (f'<img src="{LOOP}" alt="Loop" style="width: 330px; height: 330px; object-fit: cover; margin-top: 70px;">')
sym = "\n".join([
    tile(WHITE, symbol_svg(RED, "closed", 190), "Closed", True),
    tile(WHITE, symbol_svg(RED, "broken", 190), "Broken", True),
    tile(RED, symbol_svg(WHITE, "broken", 190), "Broken, reversed"),
    tile(RED, badge, "Loop badge (placeholder art)"),
])
board("Symbols.dc.html", "Symbols", 1180, 380, WHITE,
      f'<div style="display: flex; gap: 40px; align-items: flex-start;">{sym}</div>')

# app icons
def icon_mark(size, radius, kind):
    if kind == "loop":
        inner = f'<img src="{LOOP}" alt="" style="width: {size*1.35:.0f}px; height: {size*1.35:.0f}px; object-fit: cover; margin-top: {size*0.32:.0f}px;">'
    else:
        inner = symbol_svg(WHITE, "broken", int(size * 0.66), sw=30, pad=0.06)
    return (f'<div style="width: {size}px; height: {size}px; border-radius: {radius}; background: {RED}; display: flex; '
            f'align-items: center; justify-content: center; overflow: hidden; flex: none; box-shadow: 0 1px 2px rgba(0,0,0,.08);">{inner}</div>')

def size_row(kind, title):
    cells = []
    for s in (192, 96, 48):
        for shape, r in (("circle", "50%"), ("squircle", f"{s*0.3:.0f}px")):
            cells.append(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">{icon_mark(s, r, kind)}'
                         f'<div style="font-size: 12px; color: #5F5F5F;">{s} · {shape}</div></div>')
    return (f'<div style="display: flex; flex-direction: column; gap: 16px;"><div style="font-size: 15px; font-weight: 600;">{title}</div>'
            f'<div style="display: flex; gap: 28px; align-items: flex-end;">{"".join(cells)}</div></div>')

def home_row(kind):
    others = [("#3D6BE0", "Notes"), ("#1C9C6B", "Wallet"), ("#F2A93B", "Photos")]
    cells = []
    for c, n in others[:2]:
        cells.append((f'<div style="width: 56px; height: 56px; border-radius: 50%; background: {c};"></div>', n))
    cells.append((icon_mark(56, "50%", kind), "Endloop"))
    c, n = others[2]
    cells.append((f'<div style="width: 56px; height: 56px; border-radius: 50%; background: {c};"></div>', n))
    items = "".join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 72px;">{i}'
                    f'<div style="font-size: 12px; color: #FFFFFF;">{n}</div></div>' for i, n in cells)
    return (f'<div style="display: flex; gap: 14px; padding: 22px 20px; border-radius: 24px; '
            f'background: linear-gradient(160deg, #2A2F45, #121420);">{items}</div>')

icons = (f'<div style="display: flex; flex-direction: column; gap: 36px; padding: 40px;">'
         f'{size_row("mark", "Mark icon (broken loop)")}'
         f'{size_row("loop", "Loop face icon (placeholder art)")}'
         f'<div style="display: flex; gap: 28px;">{home_row("mark")}{home_row("loop")}</div></div>')
board("AppIcons.dc.html", "App icon", 1180, 900, WHITE, icons)

# notification icon
nicon_small = symbol_svg(WHITE, "broken", 18, sw=34, pad=0.02)
nicon_big = symbol_svg(WHITE, "broken", 96, sw=34, pad=0.02)
notif = f"""<div style="display: flex; gap: 40px; align-items: center;">
<div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
<div style="width: 160px; height: 160px; background: #1E1E22; border-radius: 20px; display: flex; align-items: center; justify-content: center;">{nicon_big}</div>
<div style="font-size: 12px; color: #A39E94;">24dp, white only</div></div>
<div style="width: 380px; background: #1E1E22; border-radius: 28px; padding: 14px 16px 18px; display: flex; flex-direction: column; gap: 14px;">
<div style="display: flex; align-items: center; gap: 10px; color: #EDEDED; font-size: 13px;">
<span style="font-weight: 600;">9:41</span>{nicon_small}<span style="flex: 1;"></span><span>84%</span></div>
<div style="background: #2B2B30; border-radius: 20px; padding: 14px 16px; display: flex; gap: 12px;">
<div style="width: 30px; height: 30px; border-radius: 50%; background: {RED}; display: flex; align-items: center; justify-content: center; flex: none;">{symbol_svg(WHITE, "broken", 20, sw=34, pad=0.02)}</div>
<div style="display: flex; flex-direction: column; gap: 3px; color: #EDEDED;">
<div style="font-size: 12px; color: #A39E94;">Endloop · now</div>
<div style="font-size: 15px; font-weight: 600;">Instagram: 1h 12m. Limit was 45m.</div>
<div style="font-size: 14px; color: #CFCFCF;">Your thumb has done a half marathon today.</div>
</div></div></div></div>"""
board("NotificationIcon.dc.html", "Notification icon", 760, 380, "#0E0E10", notif)

# ---------- canvas.json ----------
layout = [
    ("WordmarkBroken.dc.html", 0, 0), ("WordmarkClosed.dc.html", 1040, 0), ("WordmarkDot.dc.html", 2080, 0),
    ("WordmarkReversed.dc.html", 0, 540), ("WordmarkDark.dc.html", 1040, 540),
    ("Symbols.dc.html", 0, 1240), ("NotificationIcon.dc.html", 1260, 1240),
    ("AppIcons.dc.html", 0, 1880),
]
boards = {n: {"x": x, "y": y, "w": files[n][0], "h": files[n][1], "title": files[n][2]} for n, x, y in layout}
notes = {
    "t0": {"x": 0, "y": -200, "text": "Wordmark", "kind": "title1", "maxW": 3000},
    "t1": {"x": 0, "y": 1040, "text": "Symbol and notification icon", "kind": "title1", "maxW": 2000},
    "t2": {"x": 0, "y": 1680, "text": "App icon", "kind": "title1", "maxW": 1200},
}
canvas = {"v": 3, "createdOnFiles": {"v": 1, "at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")},
          "title": "Endloop Logo Explorations", "launch": {"view": "canvas"}, "pages": [],
          "boards": boards, "order": [n for n, _, _ in layout], "notes": notes, "designSystems": []}
json.dump(canvas, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
print(json.dumps({f"project/{n}": f"project/{n}" for n in files}))
