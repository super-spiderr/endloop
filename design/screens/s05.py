import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, SURF, LINE, BLUSH, HEADS = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"], C["heads"]
FACES = {"ok": "/_blob/6d99d55593a111201d89cc12d0e961e1",      # arms crossed
         "low": "/_blob/14efeff79f0551274251640f722df9b0",     # over the glasses
         "high": "/_blob/8950d72307c4db383ade218ef377fbf4"}    # hand over mouth

def fmt(m):
    h, mm = divmod(m, 60)
    return f"{h}h {mm:02d}m" if h and mm else (f"{h}h" if h else f"{mm} min")

def pos(m):
    # 5-min steps to 1h take the first 40% of the track, 15-min steps to 4h the rest
    return m / 60 * 40 if m <= 60 else 40 + (m - 60) / 180 * 60

def icon(name, color, size=40):
    return (f'<div aria-hidden="true" style="width: {size}px; height: {size}px; border-radius: 11px; background: {color}; color: #FFFFFF; '
            f'display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 700; flex: none;">{name[0]}</div>')

def card(name, color, avg, limit, chip="Suggested", state="ok"):
    over = limit > avg
    border = f"2px solid {HEADS}" if over else f"1px solid {LINE}"
    fill = HEADS if over else RED
    p, a = pos(limit), pos(avg)
    chips = ""
    for c in ("Suggested", "Half", "30 min"):
        on = c == chip
        chips += (f'<button type="button" aria-pressed="{"true" if on else "false"}" style="height: 30px; padding: 0 12px; border-radius: 999px; '
                  f'border: 1px solid {RED if on else LINE}; background: {RED if on else "#FFFFFF"}; color: {"#FFFFFF" if on else INK}; '
                  f'font-size: 13px; font-weight: 700; cursor: pointer;">{c}</button>')
    note = (f'<span style="font-size: 12px; font-weight: 700; color: {HEADS};">Above your average</span>' if over else "")
    return f"""<div style="background: {SURF}; border: {border}; border-radius: 20px; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px;">
<div style="display: flex; align-items: center; gap: 12px;">{icon(name, color)}
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 16px; font-weight: 700; color: {INK};">{name}</span>
<span style="font-size: 13px; font-weight: 500; color: {MUTED};">You average {fmt(avg)} a day</span></div>
<div style="font-size: 28px; line-height: 1; color: {INK}; {DISPLAY}">{fmt(limit)}</div></div>
<div role="slider" aria-label="{name} daily limit" aria-valuetext="{fmt(limit)}" tabindex="0" style="position: relative; height: 26px; margin: 0 4px;">
<div style="position: absolute; left: 0; right: 0; top: 11px; height: 4px; border-radius: 2px; background: {LINE};"></div>
<div style="position: absolute; left: 0; width: {p:.1f}%; top: 11px; height: 4px; border-radius: 2px; background: {fill};"></div>
<div title="Your average" style="position: absolute; left: calc({a:.1f}% - 1px); top: 4px; width: 2px; height: 18px; border-radius: 1px; background: {MUTED}; opacity: 0.55;"></div>
<div style="position: absolute; left: calc({p:.1f}% - 12px); top: 1px; width: 24px; height: 24px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 6px rgba(20,20,20,0.2), 0 0 0 3px {fill};"></div>
</div>
<div style="display: flex; align-items: center; gap: 8px;">{chips}<span style="flex-grow: 1;"></span>{note}</div>
</div>"""

def speech(text, face):
    return (f'<div role="status" style="display: flex; align-items: center; gap: 10px;">'
            f'<div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; background: {BLUSH}; flex: none;">'
            f'<img src="{FACES[face]}" alt="Loop" style="display: block; width: 85px; height: 85px; margin-left: -17px; margin-top: -2px; object-fit: cover;"></div>'
            f'<div style="background: {INK}; color: #FFFFFF; font-size: 15px; font-weight: 700; line-height: 1.35; padding: 10px 14px; border-radius: 16px 16px 16px 4px;">{text}</div></div>')

def savings(apps):
    per_day = sum(max(0, avg - lim) for _, _, avg, lim in apps)
    hrs = round(per_day * 7 / 60)
    if hrs <= 0:
        return (f'<div style="font-size: 15px; font-weight: 700; color: {HEADS};">This saves you nothing. Zero. Nada.</div>')
    return (f'<div style="display: flex; align-items: baseline; gap: 8px;"><span style="font-size: 15px; font-weight: 500; color: {MUTED};">This saves you about</span>'
            f'<span style="font-size: 22px; color: {RED}; {DISPLAY}">{hrs} hours a week</span></div>')

def screen5(apps, chips, reaction, face):
    cards = "".join(card(n, c, a, l, chips.get(n, "Suggested")) for n, c, a, l in apps)
    return f"""<div style="padding: 16px 24px 0;"><h1 style="margin: 0; font-size: 32px; line-height: 1.08; color: {INK}; {DISPLAY}">How much is too much?</h1></div>
<div style="display: flex; flex-direction: column; gap: 12px; padding: 18px 24px 0;">{cards}</div>
<div style="padding: 14px 24px 0;">{savings(apps)}</div>
<div style="flex-grow: 1;"></div>
<div style="display: flex; flex-direction: column; gap: 12px; padding: 0 24px 28px;">
{speech(reaction, face)}
<div style="font-size: 13px; font-weight: 500; color: {MUTED}; text-align: center;">Limits reset every day at midnight.</div>
<button type="button" style="width: 100%; height: 58px; border: none; border-radius: 18px; background: {RED}; color: #FFFFFF; font-size: 18px; font-weight: 700; cursor: pointer;">Lock it in</button>
</div>"""

# averages per day and the 30%-below suggestions (rounded to the slider step)
IG, YT, SC = ("Instagram", "#B04A7A"), ("YouTube", "#B8443A"), ("Snapchat", "#B9A032")
A = [(*IG, 160, 110), (*YT, 121, 85), (*SC, 79, 55)]
B = [(*IG, 160, 10), (*YT, 121, 85), (*SC, 79, 55)]
Cc = [(*IG, 160, 110), (*YT, 121, 150), (*SC, 79, 55)]

frames = [
    ("S05-Limits.dc.html", "Suggested defaults (30% below average)", screen5(A, {}, "Reasonable. Suspiciously reasonable.", "ok")),
    ("S05-Limits-B-Low.dc.html", "Dragged very low", screen5(B, {"Instagram": ""}, "Ambitious. I respect it. I don't believe it, but I respect it.", "low")),
    ("S05-Limits-C-High.dc.html", "Set above the habit", screen5(Cc, {"YouTube": ""}, "Why did you even install me?", "high")),
]
for f, t, inner in frames:
    write(f, screen(f"Set limits · {t}", "#FFFFFF", brand_bar(5) + inner))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 3672 + 2 * H + 120 + 380   # below Screen 4's two rows
    for i, (f, t, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s05"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 5 · Set limits", "maxW": 3 * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _ in frames}))
