import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, LINE, BLUSH, CHILL = C["red"], C["ink"], C["muted"], C["line"], C["blush"], C["chill"]
POSE = {"polite": "/_blob/11a91c11030cb6b4340fb0f0fa4b8c42", "ohno": "/_blob/8950d72307c4db383ade218ef377fbf4",
        "thug": "/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8", "honest": "/_blob/d135c5eecd645436bff50d6d2e0ee283",
        "arms": "/_blob/6d99d55593a111201d89cc12d0e961e1"}
WORD = lambda w, h: re.sub(r'width="\d+" height="\d+"', f'width="{w}" height="{h}"', svg("wordmark_white.svg"), count=1)
ROASTED = "linear-gradient(180deg, #F0263D 0%, #C20F24 55%, #7A0714 100%)"
DARK = "linear-gradient(180deg, #2A0A0E 0%, #140A0B 100%)"
PROUD = "linear-gradient(180deg, #F2EBDD 0%, #FFB38A 100%)"
CLOSE = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">'
         '<path d="M6 6l12 12M18 6L6 18"/></svg>')

def progress(step, light=True):
    on = "#FFFFFF" if light else INK
    off = "rgba(255,255,255,0.3)" if light else "rgba(20,20,20,0.2)"
    segs = "".join(f'<span style="flex: 1; height: 3px; border-radius: 2px; background: {on if i <= step else off};"></span>' for i in range(1, 4))
    col = "#FFFFFF" if light else INK
    return (f'<div style="padding: 48px 16px 0; display: flex; flex-direction: column; gap: 14px;">'
            f'<div role="img" aria-label="Part {step} of 3" style="display: flex; gap: 4px;">{segs}</div>'
            f'<div style="display: flex; align-items: center; justify-content: space-between; color: {col};">'
            f'<span style="font-size: 13px; font-weight: 700; letter-spacing: 0.4px;">Your week · 22–28 Sep</span>'
            f'<button type="button" aria-label="Close" style="width: 40px; height: 40px; border: none; background: transparent; color: inherit; display: flex; align-items: center; justify-content: center; cursor: pointer;">{CLOSE}</button></div></div>')

def tap_hint(light=True):
    col = "rgba(255,255,255,0.7)" if light else MUTED
    return f'<div style="flex-grow: 1;"></div><span style="align-self: center; padding-bottom: 34px; font-size: 13px; font-weight: 600; color: {col};">Tap to continue</span>'

def loop_img(pose, size, alt, pos="50% 0%"):
    return (f'<img src="{POSE[pose]}" alt="{alt}" style="width: {size}px; height: {size}px; object-fit: cover; object-position: {pos}; '
            f'-webkit-mask-image: linear-gradient(180deg, #000 72%, transparent 100%); mask-image: linear-gradient(180deg, #000 72%, transparent 100%);">')

# A · total
A = (progress(1) +
     f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 70px 28px 0;">'
     f'<span style="font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.85);">This week you scrolled…</span>'
     f'<span style="font-size: 92px; line-height: 0.95; color: #FFFFFF; {DISPLAY}">14h<br>20m</span>'
     f'<span style="font-size: 16px; line-height: 1.4; font-weight: 500; color: rgba(255,255,255,0.8);">on Instagram, YouTube and Snapchat. That\'s 2 hours a day, every day.</span></div>' +
     tap_hint())

# B · worst offender
B = (progress(2) +
     f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 36px 28px 0;">'
     f'<span style="font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.85);">Worst offender…</span>'
     f'<div style="display: flex; align-items: center; gap: 12px; padding-top: 6px;">'
     f'<div aria-hidden="true" style="width: 52px; height: 52px; border-radius: 14px; background: #B8443A; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700;">Y</div>'
     f'<span style="font-size: 44px; line-height: 1; color: #FFFFFF; {DISPLAY}">YouTube</span></div>'
     f'<span style="font-size: 56px; line-height: 1.05; color: #FFFFFF; {DISPLAY}">6h 10m</span>'
     f'<span style="font-size: 18px; line-height: 1.35; font-weight: 700; color: #FFFFFF; padding-top: 6px;">6h 10m on YouTube. That\'s a part-time job with no salary.</span></div>'
     f'<div style="display: flex; justify-content: center; padding-top: 18px;">{loop_img("ohno", 260, "Loop, shaking his head")}</div>' +
     tap_hint())

# C · but also… (ends positive)
def win(big, small):
    return (f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; border-radius: 16px; background: rgba(255,255,255,0.55);">'
            f'<span style="font-size: 30px; line-height: 1.05; color: {INK}; {DISPLAY}">{big}</span>'
            f'<span style="font-size: 14px; font-weight: 600; color: #5A3A2A;">{small}</span></div>')
C_ = (progress(3, light=False) +
      f'<div style="display: flex; flex-direction: column; gap: 12px; padding: 30px 28px 0;">'
      f'<span style="font-size: 22px; font-weight: 700; color: #5A3A2A;">But also…</span>'
      + win("4h 20m", "won back vs before Endloop")
      + win("5 of 7", "days under every limit")
      + win("9 times", "you closed it on the first roast") +
      f'<span style="font-size: 18px; line-height: 1.35; color: {INK}; padding-top: 4px; {DISPLAY}">Fine. You did well. Don\'t let it go to your head.</span></div>'
      f'<div style="display: flex; justify-content: center; padding-top: 6px;">{loop_img("polite", 200, "Loop, grudgingly proud")}</div>' +
      tap_hint(light=False))

# the share card itself (Stories size, 9:16)
def card(total, worst_name, worst_time, win_line, roast, pose, w=390, h=693, tag="Get roasted too → endloop app"):
    return (f'<div style="width: {w}px; height: {h}px; box-sizing: border-box; background: {ROASTED}; position: relative; overflow: hidden; '
            f'display: flex; flex-direction: column; padding: 34px 26px 26px; gap: 10px;">'
            f'{WORD(118, 32)}'
            f'<span style="padding-top: 26px; font-size: 13px; font-weight: 700; letter-spacing: 1.4px; color: #FFE3E6;">MY WEEK · 22–28 SEP</span>'
            f'<span style="font-size: 76px; line-height: 0.95; color: #FFFFFF; {DISPLAY}">{total}</span>'
            f'<span style="font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.9);">Worst offender: {worst_name} · {worst_time}</span>'
            f'<span style="align-self: flex-start; font-size: 14px; font-weight: 700; color: {INK}; background: #FFFFFF; padding: 6px 12px; border-radius: 999px;">{win_line}</span>'
            f'<span style="padding-top: 12px; max-width: 250px; font-size: 26px; line-height: 1.1; color: #FFFFFF; {DISPLAY}">{roast}</span>'
            f'<img src="{POSE[pose]}" alt="Loop" style="position: absolute; right: -30px; bottom: 34px; width: 220px; height: 220px; object-fit: cover; object-position: 50% 0%; '
            f'-webkit-mask-image: linear-gradient(180deg, #000 70%, transparent 100%); mask-image: linear-gradient(180deg, #000 70%, transparent 100%);">'
            f'<div style="flex-grow: 1;"></div>'
            f'<span style="position: relative; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.9);">{tag}</span></div>')

# D · share screen: card preview + buttons + hide names
def toggle(on):
    return (f'<button type="button" role="switch" aria-checked="{"true" if on else "false"}" aria-label="Hide app names" style="width: 48px; height: 28px; border: none; border-radius: 14px; '
            f'background: {RED if on else LINE}; position: relative; cursor: pointer;"><span style="position: absolute; top: 3px; {"right" if on else "left"}: 3px; width: 22px; height: 22px; border-radius: 11px; background: #FFFFFF;"></span></button>')

def share_screen(card_html, hide):
    return (f'<div style="display: flex; align-items: center; justify-content: space-between; padding: 44px 16px 0 24px;">'
            f'<span style="font-size: 20px; font-weight: 700; color: {INK};">Share your roast</span>'
            f'<button type="button" aria-label="Close" style="width: 40px; height: 40px; border: none; background: transparent; color: {INK}; display: flex; align-items: center; justify-content: center; cursor: pointer;">{CLOSE}</button></div>'
            f'<div style="display: flex; justify-content: center; padding-top: 14px;"><div style="width: 300px; height: 533px; overflow: hidden; border-radius: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);">'
            f'<div style="transform: scale(0.769); transform-origin: top left;">{card_html}</div></div></div>'
            f'<div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px 0;">'
            f'<span style="font-size: 15px; font-weight: 700; color: {INK};">Hide app names</span>{toggle(hide)}</div>'
            f'<div style="flex-grow: 1;"></div>'
            f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 0 24px 30px;">'
            f'<button type="button" style="height: 56px; border: none; border-radius: 16px; background: {RED}; color: #FFFFFF; font-size: 17px; font-weight: 700; cursor: pointer;">Share to Stories</button>'
            f'<button type="button" style="height: 44px; border: none; background: transparent; color: {INK}; font-size: 15px; font-weight: 700; cursor: pointer;">Save image</button></div>')

GOOD = card("14h 20m", "YouTube", "6h 10m", "4h 20m won back", "6h 10m on YouTube. That's a part-time job with no salary.", "thug")
D = share_screen(GOOD, False)
E = GOOD
BAD = card("21h 05m", "App #1", "9h 40m", "2 days under limits", "You scrolled more than before you installed me. Impressive, in the worst way.", "ohno")
F = share_screen(BAD, True)
FIRST = card("16h 30m", "Instagram", "8h 05m", "Baseline set", "Week 1. The baseline is set. Now we see what you're made of.", "arms")

frames = [
    ("S13-Weekly-A-Total.dc.html", "1 · This week you scrolled… (counts up)", A, H, ROASTED),
    ("S13-Weekly-B-Worst.dc.html", "2 · Worst offender · Loop shakes head", B, H, DARK),
    ("S13-Weekly-C-Wins.dc.html", "3 · But also… ends positive", C_, H, PROUD),
    ("S13-Weekly-D-Share.dc.html", "Share · Stories or save", D, H, "#FFFFFF"),
    ("S13-Weekly-E-Card.dc.html", "The card · good week (1080×1920)", E, 693, ROASTED),
    ("S13-Weekly-F-BadHidden.dc.html", "Bad week · app names hidden", F, H, "#FFFFFF"),
    ("S13-Weekly-G-First.dc.html", "The card · first week", FIRST, 693, ROASTED),
]

def page(title, inner, h, bg):
    solid = bg if bg.startswith("#") else "#C20F24"
    html = screen(title, solid, inner, "" if bg.startswith("#") else f"background: {bg};")
    return html.replace(f"height: {H}px;", f"height: {h}px;", 1).replace(f'"height":{H}', f'"height":{h}')

for f, t, inner, h, bg in frames:
    write(f, page(f"Weekly roast · {t}", inner, h, bg))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 15304 + 1640 + 380  # below Screen 12 (its first board is 1640 tall)
    for i, (f, t, _, h, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": h, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s13"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 13 · Weekly roast report", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, *_ in frames}))
