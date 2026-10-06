import json, math
S = "/tmp/claude-0/-home-claude/21a67691-555a-57b1-b43c-73e721e2012c/scratchpad/logo"
ns = {"__file__": f"{S}/gen.py"}
exec(open(f"{S}/gen.py").read().split("# ---------- boards")[0], ns)
g = ns
A, HY, SW, OX, PX, END = g["A"], g["HY"], g["SW"], g["OX"], g["PX"], g["END"]
INK, RED, WHITE = g["INK"], g["RED"], g["WHITE"]
TAU = 2 * math.pi

def P(cx, cy, a, t):
    return cx + a * math.cos(t), cy + HY * a * math.sin(2 * t)

def seg(cx, cy, a, t0, t1, n=160, dx=0, dy=0):
    pts = [P(cx, cy, a, t0 + (t1 - t0) * i / n) for i in range(n + 1)]
    return "M" + " L".join(f"{x+dx:.2f} {y+dy:.2f}" for x, y in pts)

def stroke(d, color, sw, cap="round", extra=""):
    return f'<path fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="{cap}" stroke-linejoin="round" d="{d}" {extra}/>'

# each builder: (color, cx, cy, a, sw, ctx) -> svg string. ctx: "word" or "sym"
def v_b(c, cx, cy, a, sw, ctx):
    return stroke(seg(cx, cy, a, 0.74, TAU + 0.08), c, sw)

def v_cross(c, cx, cy, a, sw, ctx):
    # one strand stops short of the crossing: an over/under you can untie
    g0 = math.pi / 2 - 0.34; g1 = math.pi / 2 + 0.34
    return stroke(seg(cx, cy, a, g1, TAU + g0), c, sw)

def v_top(c, cx, cy, a, sw, ctx):
    return stroke(seg(cx, cy, a, TAU - 0.2, TAU + 4.95 - 0.0), c, sw) if False else stroke(seg(cx, cy, a, -0.06, 5.2), c, sw)

def v_escape(c, cx, cy, a, sw, ctx):
    # loop runs to the top of the right lobe, then leaves in a straight line
    t_end = 5.5
    d = seg(cx, cy, a, 0.0, t_end)
    x, y = P(cx, cy, a, t_end)
    if ctx == "word":
        d += f" L{PX - 62:.2f} {y:.2f}"   # runs right up to the p stem
    else:
        d += f" L{cx + a + 46:.2f} {y:.2f}"
    return stroke(d, c, sw)

def v_snip(c, cx, cy, a, sw, ctx):
    k = a / A
    main = stroke(seg(cx, cy, a, 0.72, TAU + 0.02), c, sw)
    piece = stroke(seg(cx, cy, a, 0.17, 0.52, 40, dx=10 * k, dy=13 * k), c, sw)
    return main + piece

def v_fade(c, cx, cy, a, sw, ctx):
    t0, t1, n = 0.62, TAU + 0.02, 260
    L, R = [], []
    for i in range(n + 1):
        s = i / n
        t = t0 + (t1 - t0) * s
        x, y = P(cx, cy, a, t)
        dx, dy = -a * math.sin(t), 2 * HY * a * math.cos(2 * t)
        m = math.hypot(dx, dy) or 1
        nx, ny = -dy / m, dx / m
        w = sw / 2 if s < 0.5 else sw / 2 * max(0.06, 1 - ((s - 0.5) / 0.5) ** 1.2)
        L.append((x + nx * w, y + ny * w)); R.append((x - nx * w, y - ny * w))
    pts = L + R[::-1]
    d = "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + " Z"
    sx, sy = P(cx, cy, a, t0)
    return f'<path fill="{c}" d="{d}"/><circle cx="{sx:.2f}" cy="{sy:.2f}" r="{sw/2}" fill="{c}"/>'

_uid = [0]
def v_slice(c, cx, cy, a, sw, ctx):
    _uid[0] += 1
    i = _uid[0]
    k = a / A
    full = stroke(seg(cx, cy, a, 0, TAU) + " Z", c, sw, cap="butt")
    # diagonal slice through the right lobe; the outer part drops
    x0 = cx + a * 0.55
    big = a * 3
    left = f"M{x0 - big:.1f} {cy - big:.1f} L{x0 + 26*k:.1f} {cy - big:.1f} L{x0 - 26*k:.1f} {cy + big:.1f} L{x0 - big:.1f} {cy + big:.1f} Z"
    right = f"M{x0 + 26*k + 7*k:.1f} {cy - big:.1f} L{x0 + big:.1f} {cy - big:.1f} L{x0 + big:.1f} {cy + big:.1f} L{x0 - 26*k + 7*k:.1f} {cy + big:.1f} Z"
    return (f'<defs><clipPath id="sl{i}a"><path d="{left}"/></clipPath><clipPath id="sl{i}b"><path d="{right}"/></clipPath></defs>'
            f'<g clip-path="url(#sl{i}a)">{full}</g>'
            f'<g transform="translate({4*k:.1f} {11*k:.1f})"><g clip-path="url(#sl{i}b)">{full}</g></g>')

def v_butt(c, cx, cy, a, sw, ctx):
    return stroke(seg(cx, cy, a, 0.5, TAU + 0.0), c, sw, cap="butt")

def v_double(c, cx, cy, a, sw, ctx):
    return (stroke(seg(cx, cy, a, 0.62, math.pi - 0.02), c, sw) +
            stroke(seg(cx, cy, a, math.pi + 0.62, TAU - 0.02), c, sw))

VARIANTS = [
    ("B", "B · Lower-right break (current)", v_b),
    ("B2", "B2 · Cut at the crossing", v_cross),
    ("B3", "B3 · Top break", v_top),
    ("B4", "B4 · Escape into the p", v_escape),
    ("B5", "B5 · Snipped piece", v_snip),
    ("B6", "B6 · Fading end", v_fade),
    ("B7", "B7 · Sliced and dropped", v_slice),
    ("B8", "B8 · Hard cut (square ends)", v_butt),
    ("B9", "B9 · Double break", v_double),
]

def wordmark(fn, ink, loopc, width):
    vb_w = END + 12
    body = g["letters"](ink) + "\n" + fn(loopc, OX, 150, A, SW, "word")
    h = width * 244 / vb_w
    return f'<svg width="{width}" height="{h:.0f}" viewBox="0 28 {vb_w} 244" role="img" aria-label="endloop">{body}</svg>'

def symbol(fn, color, size, sw=28, pad=0.14, extra_right=0):
    a = 100
    span = 2 * a + sw
    m = span * pad
    vb = span + 2 * m + extra_right
    cx = (span + 2 * m) / 2
    return (f'<svg width="{size}" height="{size * (span + 2*m) / vb:.0f}" viewBox="0 0 {vb:.1f} {span + 2*m:.1f}" aria-hidden="true">'
            f'{fn(color, cx, (span + 2*m) / 2, a, sw, "sym")}</svg>')

HEAD, tail = g["HEAD"], g["tail"]
ROOT = g["ROOT"]
files = {}

def board(name, title, w, h, bg, inner):
    html = HEAD.format(title=title, bg=bg) + (
        f'<div style="width: {w}px; height: {h}px; background: {bg}; position: relative; overflow: hidden; '
        f'display: flex; align-items: center; justify-content: center;">\n{inner}\n</div>\n') + tail(w, h)
    open(f"{ROOT}/project/{name}", "w").write(html)
    files[name] = (w, h, title)

BW, BH = 960, 560
for key, title, fn in VARIANTS[1:]:
    er = 60 if key == "B4" else 0
    icon = (f'<div style="width: 96px; height: 96px; border-radius: 50%; background: {RED}; display: flex; align-items: center; justify-content: center; flex: none;">'
            f'{symbol(fn, WHITE, 66, sw=30, pad=0.06, extra_right=er)}</div>')
    small = (f'<div style="height: 48px; padding: 0 18px; border-radius: 24px; background: #1E1E22; display: flex; align-items: center; gap: 10px; color: #EDEDED; font-size: 13px;">'
             f'<span>9:41</span>{symbol(fn, WHITE, 20, sw=36, pad=0.02, extra_right=er)}</div>')
    inner = (f'<div style="display: flex; flex-direction: column; align-items: center; gap: 56px;">'
             f'{wordmark(fn, INK, RED, 680)}'
             f'<div style="display: flex; align-items: center; gap: 40px;">{symbol(fn, RED, 150, extra_right=er)}{icon}{small}</div></div>')
    board(f"Wordmark{key}.dc.html", title, BW, BH, WHITE, inner)

# side-by-side symbol grid of all nine
cells = []
for key, title, fn in VARIANTS:
    er = 60 if key == "B4" else 0
    cells.append(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">'
                 f'<div style="width: 220px; height: 170px; border-radius: 24px; background: {RED}; display: flex; align-items: center; justify-content: center;">'
                 f'{symbol(fn, WHITE, 150, extra_right=er)}</div>'
                 f'<div style="font-size: 14px; color: #5F5F5F;">{title.split(" · ")[0]}</div></div>')
grid = f'<div style="display: grid; grid-template-columns: repeat(9, 220px); gap: 24px;">{"".join(cells)}</div>'
board("BrokenFamily.dc.html", "All breaks side by side", 2280, 300, WHITE, grid)

# ---- merge into the saved canvas.json ----
cpath = f"{S}/../artifact-files/0a347c28-b730-4bd9-b505-1b2f0a8ae57c/project/canvas.json"
c = json.load(open(cpath))
Y0 = 2960
c["notes"]["t3"] = {"kind": "title1", "maxW": 3000, "text": "Broken loop variations", "w": 240, "x": 0, "y": Y0 - 200}
names = [f"Wordmark{k}.dc.html" for k, _, _ in VARIANTS[1:]]
for i, n in enumerate(names):
    col, row = i % 3, i // 3
    c["boards"][n] = {"x": col * 1040, "y": Y0 + row * 640, "w": BW, "h": BH, "title": files[n][2]}
    if n not in c["order"]:
        c["order"].append(n)
c["boards"]["BrokenFamily.dc.html"] = {"x": 0, "y": Y0 + 3 * 640, "w": 2280, "h": 300, "title": files["BrokenFamily.dc.html"][2]}
if "BrokenFamily.dc.html" not in c["order"]:
    c["order"].append("BrokenFamily.dc.html")
json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)

# preview
prev = "".join(f'<div style="padding:10px;border-bottom:1px solid #eee">{wordmark(fn, INK, RED, 520)}</div>' for _, _, fn in VARIANTS)
open(f"{S}/prev2.html", "w").write("<body style=margin:0>" + prev + grid + "</body>")
print(json.dumps({f"project/{n}": f"project/{n}" for n in files}))
