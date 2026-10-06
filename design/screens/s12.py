import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, SURF, LINE, BLUSH, CHILL, HEADS = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"], C["chill"], C["heads"]
POSE = {"polite": "/_blob/11a91c11030cb6b4340fb0f0fa4b8c42", "peer": "/_blob/14efeff79f0551274251640f722df9b0",
        "ohno": "/_blob/8950d72307c4db383ade218ef377fbf4", "arms": "/_blob/6d99d55593a111201d89cc12d0e961e1",
        "thug": "/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8"}
LOGO = re.sub(r'width="\d+" height="\d+"', 'width="100" height="27"', svg("wordmark_ink.svg"), count=1)
LOCK = ('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>')

def fmt(m):
    h, mm = divmod(abs(m), 60)
    return f"{h}h {mm:02d}m" if h else f"{mm}m"

NAV_ICONS = {
    "Today": '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"/>',
    "Stats": '<path d="M5 20V11M12 20V5M19 20v-7"/>',
    "Settings": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
}
def nav(active="Stats"):
    items = ""
    for name, path in NAV_ICONS.items():
        col = RED if name == active else MUTED
        cur = ' aria-current="page"' if name == active else ""
        items += (f'<a href="#"{cur} style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 0; text-decoration: none; color: {col}; font-size: 12px; font-weight: 700;">'
                  f'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>{name}</a>')
    return f'<nav aria-label="Main" style="display: flex; border-top: 1px solid {LINE}; background: #FFFFFF; padding: 0 12px 10px;">{items}</nav>'

def top(month_locked=True, active="Week"):
    seg = ""
    for name in ("Week", "Month"):
        on = name == active
        lock = LOCK if (name == "Month" and month_locked) else ""
        seg += (f'<button type="button" aria-pressed="{"true" if on else "false"}" style="flex: 1; height: 34px; border: none; border-radius: 10px; '
                f'background: {"#FFFFFF" if on else "transparent"}; box-shadow: {"0 1px 3px rgba(0,0,0,0.12)" if on else "none"}; color: {INK if on else MUTED}; '
                f'font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">{name}{lock}</button>')
    return (f'<div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 0;">{LOGO}'
            f'<div role="group" aria-label="Period" style="width: 170px; display: flex; gap: 2px; padding: 3px; border-radius: 12px; background: {SURF};">{seg}</div></div>')

def hero(label, value, sub, col, tint, pose, line):
    return (f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 22px; background: {tint};">'
            f'<span style="font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {col};">{label}</span>'
            f'<span style="font-size: 48px; line-height: 1; color: {INK}; {DISPLAY}">{value}</span>'
            f'<span style="font-size: 14px; font-weight: 500; color: {MUTED};">{sub}</span>'
            f'<div style="display: flex; align-items: center; gap: 10px; padding-top: 2px;">'
            f'<img src="{POSE[pose]}" alt="Loop" style="width: 40px; height: 40px; border-radius: 20px; object-fit: cover; object-position: 50% 10%; background: #FFFFFF; flex: none;">'
            f'<span style="font-size: 14px; font-weight: 700; color: {INK};">{line}</span></div></div>')

def chart(days, base, title="Tracked apps per day", base_label="Before Endloop"):
    top_ = max(max(m for _, m in days if m is not None), base) * 1.12
    Hh = 130
    bars = ""
    for i, (lbl, m) in enumerate(days):
        last = i == len(days) - 1
        col = (CHILL if m <= base else RED) if m is not None else LINE
        h = (m or 0) / top_ * Hh
        bars += (f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">'
                 f'<div style="height: {Hh}px; width: 100%; display: flex; align-items: flex-end; justify-content: center;">'
                 f'<div style="width: 24px; height: {max(h, 2):.0f}px; border-radius: 6px 6px 3px 3px; background: {col}; opacity: {1 if m is not None else 0.6};"></div></div>'
                 f'<span style="font-size: 12px; font-weight: {"700" if last else "500"}; color: {INK if last else MUTED};">{lbl}</span></div>')
    y = Hh - base / top_ * Hh
    line = (f'<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: {y:.0f}px; border-top: 2px dashed {INK}; opacity: 0.35;"></div>'
            f'<span style="position: absolute; left: 0; top: {y - 20:.0f}px; font-size: 11px; font-weight: 700; color: {MUTED};">{base_label} · {fmt(base)}</span>')
    return (f'<div style="display: flex; flex-direction: column; gap: 10px;"><span style="font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED};">{title}</span>'
            f'<div style="position: relative; display: flex; gap: 4px; padding-top: 14px;">{line}{bars}</div></div>')

def tiles(items):
    t = "".join(f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 14px; border-radius: 16px; border: 1px solid {LINE};">'
                f'<span style="font-size: 26px; line-height: 1.1; color: {c}; {DISPLAY}">{v}</span>'
                f'<span style="font-size: 13px; line-height: 1.3; font-weight: 600; color: {MUTED};">{l}</span></div>' for v, l, c in items)
    return f'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">{t}</div>'

def per_app(rows):
    out = ""
    for name, color, week, change, jab in rows:
        down = change < 0
        col = CHILL if down else RED
        arrow = "↓" if down else "↑"
        j = f'<span style="font-size: 13px; font-weight: 600; color: {MUTED};">{jab}</span>' if jab else ""
        out += (f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-bottom: 1px solid {LINE};">'
                f'<div style="display: flex; align-items: center; gap: 12px;">'
                f'<div aria-hidden="true" style="width: 34px; height: 34px; border-radius: 10px; background: {color}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700;">{name[0]}</div>'
                f'<span style="flex-grow: 1; font-size: 16px; font-weight: 700; color: {INK};">{name}</span>'
                f'<span style="font-size: 15px; font-weight: 700; color: {INK};">{fmt(week)}</span>'
                f'<span style="min-width: 58px; text-align: right; font-size: 14px; font-weight: 700; color: {col};">{arrow} {abs(change)}%</span></div>{j}</div>')
    return (f'<div style="display: flex; flex-direction: column;"><span style="font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED};">'
            f'Per app · vs last week</span>{out}</div>')

def challenge(day, under):
    pct = day / 21 * 100
    return (f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 20px; background: {INK};">'
            f'<span style="font-size: 12px; font-weight: 700; letter-spacing: 0.8px; color: #FFB38A;">21-DAY CHALLENGE</span>'
            f'<span style="font-size: 20px; line-height: 1.2; color: #FFFFFF; {DISPLAY}">The studies ran for 3 weeks. You\'re on day {day}.</span>'
            f'<div role="progressbar" aria-valuemin="0" aria-valuemax="21" aria-valuenow="{day}" aria-label="Challenge progress" style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.2);">'
            f'<div style="width: {pct:.0f}%; height: 8px; border-radius: 4px; background: #FFB38A;"></div></div>'
            f'<span style="font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.75);">{under} of {day} days under every limit so far. In one study, people who kept limits for 3 weeks felt less lonely and less low.</span></div>')

def archive(locked=False):
    lock = f'<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: {RED}; background: {BLUSH}; padding: 4px 8px; border-radius: 999px;">{LOCK}Premium</span>' if locked else ""
    return (f'<a href="#" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 16px; border: 1px solid {LINE}; text-decoration: none;">'
            f'<span style="font-size: 16px; font-weight: 700; color: {INK};">Past weekly roasts →</span>{lock}</a>')

def page(inner, h=H, active_nav="Stats"):
    return inner, h

WEEK = [("Fri", 170), ("Sat", 205), ("Sun", 180), ("Mon", 120), ("Tue", 110), ("Wed", 135), ("Today", 96)]
BASE = 220

A = (top() +
     f'<div style="display: flex; flex-direction: column; gap: 18px; padding: 16px 24px 24px;">' +
     hero("Time won back this week", "4h 20m", "vs your 3h 40m a day before Endloop", CHILL, "#E3F3EC", "polite", "Look at that. Almost an entire movie, back.") +
     chart(WEEK, BASE) +
     tiles([("5 of 7", "days under all limits", CHILL), ("9", "closed on first roast", INK), ("3", "snoozes used", HEADS), ("14", "roasts received", RED)]) +
     per_app([("Instagram", "#B04A7A", 552, -22, None), ("YouTube", "#B8443A", 290, -8, None),
              ("Snapchat", "#B9A032", 118, 10, "Snapchat went up. I noticed. Everyone noticed.")]) +
     challenge(12, 9) + archive(locked=True) + '</div>' + nav())
A_H = 1640

# B · Month tapped on free: Premium sheet over the week view
B = (top(active="Week") +
     f'<div style="display: flex; flex-direction: column; gap: 18px; padding: 16px 24px;">' +
     hero("Time won back this week", "4h 20m", "vs your 3h 40m a day before Endloop", CHILL, "#E3F3EC", "polite", "Look at that. Almost an entire movie, back.") +
     chart(WEEK, BASE) + '</div>' +
     f'<div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(20,20,20,0.45);"></div>'
     f'<div role="dialog" aria-label="Premium" style="position: absolute; left: 0; right: 0; bottom: 0; background: #FFFFFF; border-radius: 28px 28px 0 0; padding: 10px 24px 30px; display: flex; flex-direction: column; gap: 14px;">'
     f'<div style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE};"></div>'
     f'<img src="{POSE["thug"]}" alt="Loop in sunglasses" style="align-self: center; width: 150px; height: 150px; object-fit: cover; object-position: 50% 0%;">'
     f'<span style="font-size: 28px; line-height: 1.1; color: {INK}; {DISPLAY}">The long game is Premium.</span>'
     f'<span style="font-size: 15px; line-height: 1.45; font-weight: 500; color: {MUTED};">Month view, your full history, every past weekly roast, and unlimited apps.</span>'
     f'<button type="button" style="height: 56px; border: none; border-radius: 16px; background: {RED}; color: #FFFFFF; font-size: 17px; font-weight: 700; cursor: pointer;">See Premium</button>'
     f'<button type="button" style="height: 44px; border: none; background: transparent; color: {MUTED}; font-size: 15px; font-weight: 700; cursor: pointer;">Not now</button></div>')

# C · a worse week
WEEK_BAD = [("Fri", 210), ("Sat", 260), ("Sun", 290), ("Mon", 230), ("Tue", 250), ("Wed", 240), ("Today", 150)]
C_ = (top() +
      f'<div style="display: flex; flex-direction: column; gap: 18px; padding: 16px 24px;">' +
      hero("Time lost this week", "1h 10m", "more than before Endloop. Impressive, in the wrong way.", RED, BLUSH, "ohno", "I roasted you 22 times. You roasted me back by ignoring it.") +
      chart(WEEK_BAD, BASE) +
      tiles([("1 of 7", "days under all limits", RED), ("2", "closed on first roast", INK), ("12", "snoozes used", HEADS), ("22", "roasts received", RED)]) +
      '</div>' + '<div style="flex-grow: 1;"></div>' + nav())

# D · baseline still building (Usage Access was skipped at first)
WEEK_NEW = [("Tue", 140), ("Wed", 165), ("Thu", 120), ("Fri", None), ("Sat", None), ("Sun", None), ("Mon", None)]
D = (top() +
     f'<div style="display: flex; flex-direction: column; gap: 18px; padding: 16px 24px;">' +
     hero("Your baseline builds after one week", "Day 3 of 7", "Then I can tell you how much time you won back.", HEADS, "#FFF3E0", "peer", "Taking notes. So many notes.") +
     chart(WEEK_NEW, 142, "So far", "Average so far") +
     challenge(3, 2) + '</div>' + '<div style="flex-grow: 1;"></div>' + nav())

frames = [
    ("S12-Stats.dc.html", "Week · winning (full page, scrolls)", A, A_H),
    ("S12-Stats-B-Month.dc.html", "Month tapped · Premium (free user)", B, H),
    ("S12-Stats-C-Worse.dc.html", "A worse week · time lost", C_, H),
    ("S12-Stats-D-Baseline.dc.html", "First week · baseline building", D, H),
]

def full(title, inner, h):
    html = screen(title, "#FFFFFF", inner)
    return html.replace(f"height: {H}px; background: #FFFFFF", f"height: {h}px; background: #FFFFFF").replace(f'"height":{H}', f'"height":{h}')

for f, t, inner, h in frames:
    write(f, full(f"Stats · {t}", inner, h))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 13204 + 1720 + 380  # below Screen 11 (its first board is 1720 tall)
    for i, (f, t, _, h) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": h, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s12"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 12 · Stats", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _, _ in frames}))
