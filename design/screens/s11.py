import json, sys, os, re, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, SURF, LINE, BLUSH, CHILL, HEADS = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"], C["chill"], C["heads"]
POSE = {"peer": "/_blob/14efeff79f0551274251640f722df9b0", "arms": "/_blob/6d99d55593a111201d89cc12d0e961e1",
        "ohno": "/_blob/8950d72307c4db383ade218ef377fbf4", "polite": "/_blob/11a91c11030cb6b4340fb0f0fa4b8c42",
        "thug": "/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8"}
IG = ("Instagram", "#B04A7A")

def fmt(m):
    h, mm = divmod(m, 60)
    return f"{h}h {mm:02d}m" if h else f"{mm}m"

BACK = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#141414" stroke-width="2.2" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>')
SHARE = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5F5F5F" stroke-width="2.2" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>')

def header(name, color, chip, chip_col):
    return (f'<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 6px 8px;">'
            f'<button type="button" aria-label="Back" style="width: 44px; height: 44px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer;">{BACK}</button>'
            f'<div aria-hidden="true" style="width: 36px; height: 36px; border-radius: 10px; background: {color}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700;">{name[0]}</div>'
            f'<span style="flex-grow: 1; font-size: 20px; font-weight: 700; color: {INK};">{name}</span>'
            f'<span style="font-size: 12px; font-weight: 700; color: {chip_col}; background: {chip_col}1A; padding: 6px 11px; border-radius: 999px;">{chip}</span></div>')

def section(title, inner, right=""):
    return (f'<section style="display: flex; flex-direction: column; gap: 12px; padding: 18px 24px 0;">'
            f'<div style="display: flex; align-items: baseline; justify-content: space-between;">'
            f'<h2 style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED};">{title}</h2>{right}</div>{inner}</section>')

def today(used, limit, opens, longest):
    over = used >= limit
    col = RED if over else (HEADS if used >= 0.75 * limit else CHILL)
    R = 58
    circ = 2 * math.pi * R
    pct = min(used / limit, 1)
    ring = (f'<div style="position: relative; width: 140px; height: 140px; flex: none;">'
            f'<svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="{R}" fill="none" stroke="{LINE}" stroke-width="12"/>'
            f'<circle cx="70" cy="70" r="{R}" fill="none" stroke="{col}" stroke-width="12" stroke-linecap="round" stroke-dasharray="{circ:.1f}" '
            f'stroke-dashoffset="{circ * (1 - pct):.1f}" transform="rotate(-90 70 70)"/></svg>'
            f'<div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">'
            f'<span style="font-size: 26px; line-height: 1; color: {INK}; {DISPLAY}">{fmt(used)}</span>'
            f'<span style="font-size: 12px; font-weight: 600; color: {MUTED};">of {fmt(limit)}</span></div></div>')
    stat = lambda big, small: (f'<div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 22px; line-height: 1.1; color: {INK}; {DISPLAY}">{big}</span>'
                               f'<span style="font-size: 13px; font-weight: 500; color: {MUTED};">{small}</span></div>')
    over_line = f'<span style="font-size: 13px; font-weight: 700; color: {RED};">{fmt(used - limit)} over</span>' if over else ""
    return (f'<div style="display: flex; align-items: center; gap: 20px;">{ring}<div style="display: flex; flex-direction: column; gap: 12px;">'
            f'{stat(str(opens), "times opened")}{stat(f"{longest} min", "longest session")}{over_line}</div></div>')

def week(days, limit):
    top = max(max(d for _, d in days), limit) * 1.1
    H_ = 120
    bars = ""
    for i, (lbl, m) in enumerate(days):
        col = RED if m > limit else "#E3C4C8"
        if i == len(days) - 1:
            col = RED if m > limit else CHILL
        h = m / top * H_
        bars += (f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">'
                 f'<div style="height: {H_}px; width: 100%; display: flex; align-items: flex-end; justify-content: center;">'
                 f'<div title="{fmt(m)}" style="width: 22px; height: {h:.0f}px; border-radius: 6px 6px 3px 3px; background: {col};"></div></div>'
                 f'<span style="font-size: 12px; font-weight: {"700" if i == len(days) - 1 else "500"}; color: {INK if i == len(days) - 1 else MUTED};">{lbl}</span></div>')
    y = H_ - limit / top * H_
    line = (f'<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: {y:.0f}px; border-top: 2px dashed {INK}; opacity: 0.35;"></div>'
            f'<span style="position: absolute; right: 0; top: {y - 20:.0f}px; font-size: 11px; font-weight: 700; color: {MUTED};">Limit {fmt(limit)}</span>')
    over = sum(1 for _, m in days if m > limit)
    avg = sum(m for _, m in days) // len(days)
    return (f'<div style="position: relative; display: flex; gap: 4px;">{line}{bars}</div>'
            f'<span style="font-size: 14px; font-weight: 500; color: {INK};">Average <b>{fmt(avg)}</b> a day · <b style="color: {RED};">{over} of 7</b> days over</span>')

def when(parts, hi, pose, line):
    cells = ""
    for i, (name, rng, m) in enumerate(parts):
        on = i == hi
        cells += (f'<div style="flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 10px 8px; border-radius: 14px; '
                  f'background: {RED if on else SURF}; border: 1px solid {RED if on else LINE};">'
                  f'<span style="font-size: 12px; font-weight: 700; color: {"#FFFFFF" if on else INK};">{name}</span>'
                  f'<span style="font-size: 11px; font-weight: 500; color: {"rgba(255,255,255,0.85)" if on else MUTED};">{rng}</span>'
                  f'<span style="font-size: 15px; font-weight: 700; color: {"#FFFFFF" if on else INK}; padding-top: 4px;">{fmt(m)}</span></div>')
    loop = (f'<div style="display: flex; align-items: center; gap: 10px;">'
            f'<img src="{POSE[pose]}" alt="Loop" style="width: 44px; height: 44px; border-radius: 22px; object-fit: cover; object-position: 50% 10%; background: {BLUSH}; flex: none;">'
            f'<span style="background: {INK}; color: #FFFFFF; border-radius: 16px 16px 16px 4px; padding: 10px 14px; font-size: 14px; font-weight: 600; line-height: 1.35;">{line}</span></div>')
    return f'<div style="display: flex; gap: 6px;">{cells}</div>{loop}'

def limit_row(limit, note=None):
    n = f'<span style="font-size: 13px; font-weight: 500; color: {MUTED};">{note}</span>' if note else ""
    return (f'<div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; border: 1px solid {LINE};">'
            f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 13px; font-weight: 600; color: {MUTED};">Daily limit</span>'
            f'<span style="font-size: 24px; line-height: 1.1; color: {INK}; {DISPLAY}">{fmt(limit)}</span>{n}</div>'
            f'<button type="button" style="height: 40px; padding: 0 18px; border-radius: 12px; border: 1.5px solid {RED}; background: #FFFFFF; color: {RED}; font-size: 15px; font-weight: 700; cursor: pointer;">Edit</button></div>')

def shame(items):
    rows = ""
    for when_, text in items:
        rows += (f'<div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 16px; background: {SURF};">'
                 f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;"><span style="font-size: 12px; font-weight: 700; color: {RED};">{when_}</span>'
                 f'<span style="font-size: 15px; line-height: 1.3; color: {INK}; {DISPLAY}">{text}</span></div>'
                 f'<button type="button" aria-label="Share this roast" style="width: 36px; height: 36px; border-radius: 18px; border: 1px solid {LINE}; background: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex: none;">{SHARE}</button></div>')
    return f'<div style="display: flex; flex-direction: column; gap: 8px;">{rows}</div>'

def tip(text):
    return (f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border-radius: 16px; background: #FFF3E0; border: 1px solid #F3D9B0;">'
            f'<span style="font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: {HEADS};">TRY THIS</span>'
            f'<span style="font-size: 15px; line-height: 1.35; font-weight: 600; color: {INK};">{text}</span></div>')

def stop():
    return (f'<div style="display: flex; justify-content: center; padding: 26px 0 30px;"><a href="#" style="font-size: 15px; font-weight: 700; color: {MUTED}; '
            f'text-decoration: underline; text-underline-offset: 3px;">Stop tracking Instagram</a></div>')

DAYS = [("Fri", 95), ("Sat", 128), ("Sun", 140), ("Mon", 52), ("Tue", 70), ("Wed", 58), ("Today", 92)]
PARTS = [("Morning", "6–12", 8), ("Afternoon", "12–5", 14), ("Evening", "5–10", 21), ("Late night", "10–2", 49)]

full = (header(*IG, "Roasted", RED) +
        section("Today", today(92, 60, 14, 42)) +
        section("This week", week(DAYS, 60)) +
        section("When you scroll the most", when(PARTS, 3, "peer", "11 pm to 1 am. Every night. We need to talk.")) +
        section("Limit", limit_row(60)) +
        section("Try this", tip("Charge your phone outside the bedroom. Late night is where most of your Instagram goes.")) +
        section("Hall of shame", shame([("Today · 9:42 pm", "1h 10m of other people's vacations. Your own life is on airplane mode."),
                                         ("Yesterday · 11:58 pm", "It's been 40 seconds. I'm not tired. Are you?"),
                                         ("Tue · 10:15 pm", "Close it now and today counts as a win.")])) +
        stop())
FULL_H = 1720

# B · edit limit sheet, lowering
def sheet(title, value, note, note_col, pos, cta, loop_line, pose):
    track = (f'<div style="position: relative; height: 32px; display: flex; align-items: center; margin: 0 13px;">'
             f'<div style="flex-grow: 1; height: 4px; border-radius: 2px; background: {LINE};"></div>'
             f'<div style="position: absolute; left: 0; width: {pos}%; height: 4px; border-radius: 2px; background: {RED};"></div>'
             f'<div aria-hidden="true" style="position: absolute; left: calc({pos}% - 13px); width: 26px; height: 26px; border-radius: 13px; background: #FFFFFF; border: 3px solid {RED}; box-sizing: border-box;"></div></div>')
    chips = "".join(f'<button type="button" style="height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid {LINE}; background: #FFFFFF; font-size: 13px; font-weight: 700; color: {INK}; cursor: pointer;">{c}</button>'
                    for c in ("Suggested", "30 min", "1 hour"))
    return (f'<div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(20,20,20,0.45);"></div>'
            f'<div role="dialog" aria-label="Edit limit" style="position: absolute; left: 0; right: 0; bottom: 0; background: #FFFFFF; border-radius: 28px 28px 0 0; '
            f'padding: 10px 24px 30px; display: flex; flex-direction: column; gap: 14px;">'
            f'<div style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE};"></div>'
            f'<span style="font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED};">{title}</span>'
            f'<span style="font-size: 44px; line-height: 1; color: {INK}; {DISPLAY}">{value}</span>{track}'
            f'<div style="display: flex; gap: 8px;">{chips}</div>'
            f'<span style="font-size: 14px; font-weight: 700; color: {note_col};">{note}</span>'
            f'<div style="display: flex; align-items: center; gap: 10px;"><img src="{POSE[pose]}" alt="Loop" style="width: 44px; height: 44px; border-radius: 22px; object-fit: cover; object-position: 50% 10%; background: {BLUSH}; flex: none;">'
            f'<span style="background: {INK}; color: #FFFFFF; border-radius: 16px 16px 16px 4px; padding: 10px 14px; font-size: 14px; font-weight: 600;">{loop_line}</span></div>'
            f'<button type="button" style="height: 56px; border: none; border-radius: 16px; background: {RED}; color: #FFFFFF; font-size: 17px; font-weight: 700; cursor: pointer;">{cta}</button></div>')

behind = header(*IG, "Roasted", RED) + section("Today", today(92, 60, 14, 42)) + section("This week", week(DAYS, 60))
B = behind + sheet("Instagram daily limit", "45m", "Lower limit · starts right now", CHILL, 30, "Save", "Look at you.", "polite")
C_ = behind + sheet("Instagram daily limit", "1h 30m", "Higher limit · starts tomorrow", HEADS, 55, "Save for tomorrow", "Raising it? Fine. Starting tomorrow.", "arms")

# D · stop tracking confirm
D = (behind + f'<div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(20,20,20,0.45);"></div>'
     f'<div role="dialog" aria-label="Stop tracking Instagram" style="position: absolute; left: 0; right: 0; bottom: 0; background: #FFFFFF; border-radius: 28px 28px 0 0; '
     f'padding: 10px 24px 30px; display: flex; flex-direction: column; gap: 14px;">'
     f'<div style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE};"></div>'
     f'<img src="{POSE["ohno"]}" alt="Loop, appalled" style="align-self: center; width: 150px; height: 150px; object-fit: cover; object-position: 50% 0%;">'
     f'<span style="font-size: 28px; line-height: 1.1; color: {INK}; {DISPLAY}">Stop tracking Instagram?</span>'
     f'<span style="font-size: 15px; line-height: 1.4; font-weight: 500; color: {MUTED};">I\'ll stop watching it from tomorrow. Today, the limit stays. Nice try.</span>'
     f'<button type="button" style="height: 56px; border: none; border-radius: 16px; background: {RED}; color: #FFFFFF; font-size: 17px; font-weight: 700; cursor: pointer;">Keep tracking</button>'
     f'<button type="button" style="height: 48px; border: none; background: transparent; color: {MUTED}; font-size: 15px; font-weight: 700; cursor: pointer;">Stop from tomorrow</button></div>')

# E · a good week (under the limit)
DAYS_GOOD = [("Fri", 55), ("Sat", 70), ("Sun", 48), ("Mon", 40), ("Tue", 35), ("Wed", 44), ("Today", 30)]
PARTS_GOOD = [("Morning", "6–12", 5), ("Afternoon", "12–5", 12), ("Evening", "5–10", 13), ("Late night", "10–2", 0)]
E = (header("YouTube", "#B8443A", "Chill", CHILL) +
     section("Today", today(30, 60, 4, 12)) +
     section("This week", week(DAYS_GOOD, 60)) +
     section("When you scroll the most", when(PARTS_GOOD, 2, "polite", "No late nights this week. Who are you?")))

frames = [
    ("S11-AppDetail.dc.html", "Full page · over the limit (scrolls)", full, FULL_H),
    ("S11-AppDetail-B-Lower.dc.html", "Edit limit · lower = now", B, H),
    ("S11-AppDetail-C-Raise.dc.html", "Edit limit · raise = tomorrow", C_, H),
    ("S11-AppDetail-D-Stop.dc.html", "Stop tracking · from tomorrow", D, H),
    ("S11-AppDetail-E-Good.dc.html", "A good week · under the limit", E, H),
]

def page(title, inner, h):
    html = screen(title, "#FFFFFF", inner)
    return html.replace(f"height: {H}px; background: #FFFFFF", f"height: {h}px; background: #FFFFFF").replace(
        f'"height":{H}', f'"height":{h}')

for f, t, inner, h in frames:
    write(f, page(f"App detail · {t}", inner, h))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 11980 + H + 380
    for i, (f, t, _, h) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": h, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s11"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 11 · App detail", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _, _ in frames}))
