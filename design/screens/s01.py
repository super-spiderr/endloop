import json, sys
sys.path.insert(0, __import__("os").path.dirname(__file__))
from common import *

RED = C["red"]
GRAD = "radial-gradient(120% 55% at 50% 22%, rgba(255, 92, 108, 0.55) 0%, rgba(255, 92, 108, 0) 62%), linear-gradient(180deg, #F0263D 0%, #E5132B 42%, #9E0B1C 100%)"
lock = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2.5"/>'
        '<path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>')

CLIP = "/_blob/6da05bb16c492c08de2111bec82b6257"      # sneak-in, plays once
PEEK = "/_blob/3c28c500b4102b5d6d28b3d8ade1d4ca"
CENTRE = "/_blob/1367dc5580dd8d34a3230f724765d85c"

def loop_img(src, alt="Loop, looking disappointed"):
    # full-width square so the peek happens at the real screen edge; bottom fades out
    return (f'<img src="{src}" alt="{alt}" style="display: block; width: 390px; height: 390px; object-fit: cover; '
            f'-webkit-mask-image: linear-gradient(180deg, #000 72%, transparent 100%); mask-image: linear-gradient(180deg, #000 72%, transparent 100%);">')

HEADLINE = f'font-size: 46px; line-height: 1.02; letter-spacing: -0.5px; color: #FFFFFF; margin: 0; {DISPLAY}'
SECOND = 'font-size: 21px; line-height: 1.35; font-weight: 700; color: #FFFFFF; margin: 0;'
CURSOR = '<span style="display: inline-block; width: 4px; height: 0.9em; background: #FFFFFF; margin-left: 4px; vertical-align: -0.08em; border-radius: 2px;"></span>'

def text_block(headline, second, cursor_on="h"):
    h = f'<h1 style="{HEADLINE}">{headline}{CURSOR if cursor_on == "h" else ""}</h1>'
    s = f'<p style="{SECOND}">{second}{CURSOR if cursor_on == "s" else ""}</p>' if second is not None else ""
    return f'<div style="display: flex; flex-direction: column; gap: 16px; padding: 0 28px;">{h}{s}</div>'

def bottom():
    return (f'<div style="display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 0 24px 40px;">'
            f'<button type="button" style="width: 100%; height: 58px; border: none; border-radius: 18px; background: #FFFFFF; '
            f'color: {RED}; font-size: 18px; font-weight: 700; cursor: pointer;">…yeah, that\'s me</button>'
            f'<div style="display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: #FFFFFF;">{lock}'
            f'<span>No sign-up. Your screen time stays on your phone.</span></div></div>')

LOGO = open(__import__("os").path.join(__import__("os").path.dirname(__file__), "wordmark_white.svg")).read()
HEADER = f'<div style="display: flex; justify-content: center; padding-top: 28px;">{LOGO}</div>'

# Frame A — 0.3s: Loop peeks in from the left edge, half his face
peek = f"""{HEADER}
<div style="padding-top: 12px;">{loop_img(PEEK, "Loop peeking in from the left edge")}</div>"""

# Frame B — 1.5s: Loop centred, sighs; headline typing
typing = f"""{HEADER}
<div style="padding-top: 12px;">{loop_img(CENTRE)}</div>
<div style="height: 20px;"></div>
{text_block("Oh. Another", None)}"""

# Frame C — 3.4s: everything in, button up (the real clip, plays once)
final = f"""{HEADER}
<div style="padding-top: 12px;">{loop_img(CLIP, "Loop sneaks in and sighs")}</div>
<div style="height: 20px;"></div>
{text_block("Oh. Another one.", "Let me guess. You ‘just checked Instagram’ and lost 3 hours.", cursor_on=None)}
<div style="flex-grow: 1;"></div>
{bottom()}"""

frames = [
    ("S01-Welcome-A-Peek.dc.html", "0.3s · Loop peeks in", peek),
    ("S01-Welcome-B-Typing.dc.html", "1.5s · Headline types out", typing),
    ("S01-Welcome.dc.html", "3.4s · Final state", final),
]
out = {}
for i, (name, title, inner) in enumerate(frames):
    write(name, screen(f"Welcome · {title}", GRAD, inner))
    out[name] = {"x": i * (W + 80), "y": 0, "w": W, "h": H, "title": title}

if __name__ == "__main__":
    order = [f for f, _, _ in frames]
    canvas(out, order, {"s01": {"kind": "title1", "x": 0, "y": -260, "text": "Screen 1 · Welcome", "maxW": 3 * W + 160}})
    print(json.dumps({f"project/{f}": f"project/{f}" for f in order}))
