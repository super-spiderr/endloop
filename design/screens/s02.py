import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, SURF, LINE, BLUSH = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"]
CENTRE = "/_blob/1367dc5580dd8d34a3230f724765d85c"
PEER = "/_blob/14efeff79f0551274251640f722df9b0"
ARMS = "/_blob/6d99d55593a111201d89cc12d0e961e1"
OHNO = "/_blob/8950d72307c4db383ade218ef377fbf4"
MARK = svg("mark_white.svg")

TITLE = f'margin: 0; font-size: 34px; line-height: 1.08; letter-spacing: -0.3px; color: {INK}; {DISPLAY}'
BODY = f'margin: 0; font-size: 16px; line-height: 1.5; color: {MUTED}; font-weight: 500;'

def loop_badge(size=200, alt="Loop, squinting suspiciously", src=None):
    src = src or CENTRE
    # plain cut-out on white, chest fades out; no circle
    return (f'<div style="display: flex; justify-content: center;">'
            f'<img src="{src}" alt="{alt}" style="display: block; width: {size}px; height: {size}px; object-fit: cover; '
            f'-webkit-mask-image: linear-gradient(180deg, #000 70%, transparent 100%); mask-image: linear-gradient(180deg, #000 70%, transparent 100%);"></div>')

def app_icon(bg, content, size=34):
    return (f'<div style="width: {size}px; height: {size}px; border-radius: 50%; background: {bg}; display: flex; '
            f'align-items: center; justify-content: center; flex: none;">{content}</div>')

def toggle(on):
    bg = RED if on else "#D9D4D5"
    pos = "flex-end" if on else "flex-start"
    return (f'<div aria-hidden="true" style="width: 40px; height: 24px; border-radius: 12px; background: {bg}; padding: 3px; '
            f'box-sizing: border-box; display: flex; justify-content: {pos}; flex: none;">'
            f'<div style="width: 18px; height: 18px; border-radius: 50%; background: #FFFFFF;"></div></div>')

def settings_demo():
    def row(icon, name, on, hi=False):
        border = f"2px solid {RED}" if hi else "2px solid transparent"
        bg = "#FFFFFF" if hi else "transparent"
        return (f'<div style="display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 12px; '
                f'border: {border}; background: {bg};">{icon}'
                f'<span style="flex-grow: 1; font-size: 15px; font-weight: {700 if hi else 500}; color: {INK if hi else MUTED};">{name}</span>'
                f'{toggle(on)}</div>')
    grey = lambda c: app_icon(c, "")
    tap = ('<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#141414" stroke-width="1.6" stroke-linecap="round" '
           'stroke-linejoin="round" aria-hidden="true" style="position: absolute; right: 22px; bottom: 2px;">'
           '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V9a1.5 1.5 0 0 1 3 0v2"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.9-2.6L4.3 15a1.5 1.5 0 0 1 2.4-1.8L9 15.5"/></svg>')
    return (f'<div style="position: relative; background: {SURF}; border: 1px solid {LINE}; border-radius: 20px; padding: 14px 12px 12px; '
            f'display: flex; flex-direction: column; gap: 4px;">'
            f'<div style="font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED}; padding: 0 10px 6px;">Settings › Usage access</div>'
            f'{row(grey("#C9C3C4"), "Chrome", False)}'
            f'{row(app_icon(RED, MARK), "Endloop", True, hi=True)}'
            f'{row(grey("#C9C3C4"), "Files", False)}'
            f'{tap}</div>')

def primary(label):
    return (f'<button type="button" style="width: 100%; height: 58px; border: none; border-radius: 18px; background: {RED}; '
            f'color: #FFFFFF; font-size: 18px; font-weight: 700; cursor: pointer;">{label}</button>')

def not_now():
    return (f'<a href="#" style="font-size: 15px; font-weight: 500; color: {MUTED}; text-decoration: none; padding: 10px 16px;">Not now</a>')

HONEST = (f'<p style="{BODY}">I need Usage Access to count your screen time. I only see how long you use each app. '
          f'<span style="color: {INK}; font-weight: 700;">Never your messages, photos or what you watch.</span></p>')

def page(top, middle, bottom):
    return f"""<div style="display: flex; flex-direction: column; gap: 22px; padding: 18px 24px 0;">{top}</div>
<div style="padding: 22px 24px 0;">{middle}</div>
<div style="flex-grow: 1;"></div>
<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 24px 28px;">{bottom}</div>"""

# A — the ask
ask = page(
    f'{loop_badge(alt="Loop, peering over his glasses", src=PEER)}<h1 style="{TITLE}">Let me see how bad it is.</h1>{HONEST}',
    settings_demo(),
    primary("Show me the damage") + not_now())

# B — back without granting
nudge = (f'<div role="status" style="display: flex; gap: 12px; align-items: flex-start; background: {BLUSH}; border-radius: 16px; padding: 14px 16px;">'
         f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="{RED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none; margin-top: 1px;"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5h.01"/></svg>'
         f'<div style="display: flex; flex-direction: column; gap: 4px;"><div style="font-size: 16px; font-weight: 700; color: {INK};">Didn\'t find it?</div>'
         f'<div style="font-size: 15px; line-height: 1.45; color: {INK};">It\'s under <b>Endloop</b> → <b>Permit usage access</b>.</div></div></div>')
retry = page(
    f'{loop_badge(alt="Loop, arms crossed, unimpressed", src=ARMS)}<h1 style="{TITLE}">Nice try. Still can\'t see anything.</h1>{HONEST}',
    nudge,
    primary("Show me the damage") + not_now())

# C — granted, auto-advancing
granted = f"""<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 0 24px;">
{loop_badge(280, "Loop, hand over his mouth", OHNO)}
<h1 style="margin: 0; font-size: 52px; line-height: 1; color: {INK}; text-align: center; {DISPLAY}">…oh no.</h1>
<div style="display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 500; color: {MUTED};">
<div aria-hidden="true" style="width: 18px; height: 18px; border-radius: 50%; border: 3px solid {LINE}; border-top-color: {RED}; box-sizing: border-box;"></div>
<span>Counting your hours…</span></div>
</div>"""

frames = [
    ("S02-UsageAccess.dc.html", "Ask", ask),
    ("S02-UsageAccess-B-NotFound.dc.html", "Back without granting", retry),
    ("S02-UsageAccess-C-Granted.dc.html", "Granted · auto-advances", granted),
]
for f, t, inner in frames:
    write(f, screen(f"Usage Access · {t}", "#FFFFFF", brand_bar(2) + inner))

if __name__ == "__main__":
    add_row(1, "s02", "Screen 2 · Usage Access", [(f, t) for f, t, _ in frames])
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _ in frames}))
