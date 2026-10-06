import json, os, datetime

ROOT = os.path.dirname(os.path.abspath(__file__)) + "/out"
os.makedirs(ROOT + "/project", exist_ok=True)
W, H = 390, 844

LOOP = "/_blob/48a0dd7ef7b6f55717c6f02cd297f298"   # placeholder: current idle clip (orange tips)
F_REG = "/_blob/7a5e4dc952a7c47170f9c855f4458730"
F_MED = "/_blob/d0bde5cb6f219e67814ff4da91a905aa"
F_BOLD = "/_blob/110b75c1b667e69dac3de3fdd857ae93"
F_CLASH = "/_blob/468cc2178ea014e7d388f963d40d6a1b"

C = dict(bg="#FFFFFF", surface="#FFF4F5", line="#F1D9DC", ink="#141414", muted="#5F5F5F",
         red="#E5132B", blush="#FFE3E6", chill="#16895F", heads="#B86E00")

DISPLAY = "font-family: 'Clash Display', 'Satoshi', sans-serif; font-weight: 700;"

def head(title, bg):
    return f"""<!doctype html>
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
@font-face{{font-family:'Satoshi';src:url('{F_REG}') format('woff2');font-weight:400;font-style:normal}}
@font-face{{font-family:'Satoshi';src:url('{F_MED}') format('woff2');font-weight:500;font-style:normal}}
@font-face{{font-family:'Satoshi';src:url('{F_BOLD}') format('woff2');font-weight:700;font-style:normal}}
@font-face{{font-family:'Clash Display';src:url('{F_CLASH}') format('woff2');font-weight:700;font-style:normal}}
body{{margin:0;font-family:'Satoshi',sans-serif;color:#141414;background:{bg}}}
button{{font-family:inherit}}
a{{color:#E5132B}}a:hover{{color:#B80F22}}
</style>
</helmet>
"""

def tail():
    return f"""</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":{H}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
"""

def screen(title, bg, inner, extra_root=""):
    return (head(title, bg) +
            f'<div style="width: {W}px; height: {H}px; background: {bg}; position: relative; overflow: hidden; '
            f'box-sizing: border-box; display: flex; flex-direction: column; {extra_root}">\n{inner}\n</div>\n' + tail())

def write(name, html):
    open(f"{ROOT}/project/{name}", "w").write(html)

def canvas(boards, order, notes, title="Endloop Screens"):
    path = f"{ROOT}/project/canvas.json"
    c = {"v": 3, "createdOnFiles": {"v": 1, "at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")},
         "title": title, "launch": {"view": "canvas"}, "pages": [], "boards": boards, "order": order,
         "notes": notes, "designSystems": []}
    json.dump(c, open(path, "w"), indent=1)

SAVED = "/tmp/claude-0/-home-claude/21a67691-555a-57b1-b43c-73e721e2012c/scratchpad/artifact-files/5c78e3e9-d075-4d88-a478-5b33d1041b89/project/canvas.json"
ROW = 844 + 380   # vertical step between screen rows

def add_row(row, key, title, frames):
    """frames: list of (file, title). Merge into the last-read canvas.json and write it to out/."""
    c = json.load(open(SAVED))
    y = row * ROW
    for i, (f, t) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"][key] = {"kind": "title1", "x": 0, "y": y - 260, "text": title, "maxW": max(3, len(frames)) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)

def svg(name):
    return open(os.path.join(os.path.dirname(os.path.abspath(__file__)), name)).read()

def brand_bar(step, total=6, dark=False):
    """Small wordmark left + onboarding progress dots right."""
    import re
    logo = svg("wordmark_white.svg" if dark else "wordmark_ink.svg")
    logo = re.sub(r'width="\d+" height="\d+"', 'width="92" height="25"', logo, count=1)
    on = "#FFFFFF" if dark else C["red"]
    off = "rgba(255,255,255,0.35)" if dark else C["line"]
    dots = "".join(f'<span style="width: {18 if i == step else 6}px; height: 6px; border-radius: 3px; background: {on if i <= step else off};"></span>'
                   for i in range(1, total + 1))
    return (f'<div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 0;">{logo}'
            f'<div role="img" aria-label="Step {step} of {total}" style="display: flex; gap: 4px; align-items: center;">{dots}</div></div>')
