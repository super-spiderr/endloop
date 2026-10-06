import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from s12 import nav, LOCK

RED, INK, MUTED, SURF, LINE, BLUSH, CHILL, HEADS = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"], C["chill"], C["heads"]
POSE = {"arms": "/_blob/6d99d55593a111201d89cc12d0e961e1", "polite": "/_blob/11a91c11030cb6b4340fb0f0fa4b8c42",
        "ohno": "/_blob/8950d72307c4db383ade218ef377fbf4", "peer": "/_blob/14efeff79f0551274251640f722df9b0",
        "lupe": "/_blob/bcfcbb4803f834723accd201f6b02f82", "loopface": "/_blob/6d99d55593a111201d89cc12d0e961e1"}
LOGO = re.sub(r'width="\d+" height="\d+"', 'width="100" height="27"', svg("wordmark_ink.svg"), count=1)
CHEV = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5F5F5F" stroke-width="2.2" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>')

def toggle(on, label):
    return (f'<button type="button" role="switch" aria-checked="{"true" if on else "false"}" aria-label="{label}" style="width: 48px; height: 28px; border: none; border-radius: 14px; '
            f'background: {RED if on else LINE}; position: relative; cursor: pointer; flex: none;"><span style="position: absolute; top: 3px; {"right" if on else "left"}: 3px; width: 22px; height: 22px; border-radius: 11px; background: #FFFFFF;"></span></button>')

def group(title, rows):
    body = "".join(rows)
    return (f'<section style="display: flex; flex-direction: column; gap: 8px; padding: 18px 24px 0;">'
            f'<h2 style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED};">{title}</h2>'
            f'<div style="display: flex; flex-direction: column; border: 1px solid {LINE}; border-radius: 18px; overflow: hidden;">{body}</div></section>')

def row(label, right="", sub=None, first=False, danger=False):
    border = "" if first else f"border-top: 1px solid {LINE};"
    s = f'<span style="font-size: 13px; font-weight: 500; color: {MUTED};">{sub}</span>' if sub else ""
    return (f'<div style="display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 10px 16px; box-sizing: border-box; {border}">'
            f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 16px; font-weight: 700; color: {RED if danger else INK};">{label}</span>{s}</div>{right}</div>')

def value(v):
    return f'<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: {MUTED};">{v}{CHEV}</span>'

def seg(options, sel, locked=()):
    b = ""
    for o in options:
        on = o == sel
        lk = LOCK if o in locked else ""
        b += (f'<button type="button" aria-pressed="{"true" if on else "false"}" style="flex: 1; height: 36px; border: none; border-radius: 10px; background: {"#FFFFFF" if on else "transparent"}; '
              f'box-shadow: {"0 1px 3px rgba(0,0,0,0.12)" if on else "none"}; color: {INK if on else MUTED}; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer;">{o}{lk}</button>')
    return f'<div role="group" style="display: flex; gap: 2px; padding: 3px; border-radius: 12px; background: {SURF}; margin: 0 16px 12px;">{b}</div>'

def roaster_pick(sel):
    items = ""
    for name, img, soon in (("Loop", POSE["loopface"], False), ("Lupe", POSE["lupe"], False), ("More soon", None, True)):
        on = name == sel
        pic = (f'<img src="{img}" alt="" style="width: 48px; height: 48px; border-radius: 24px; object-fit: cover; object-position: 50% 10%; background: {BLUSH};">' if img else
               f'<span style="width: 48px; height: 48px; border-radius: 24px; border: 1.5px dashed {LINE}; display: flex; align-items: center; justify-content: center; color: {MUTED}; font-size: 22px;">+</span>')
        items += (f'<button type="button" aria-pressed="{"true" if on else "false"}" {"disabled" if soon else ""} style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 4px; border-radius: 14px; '
                  f'border: 2px solid {RED if on else "transparent"}; background: {"#FFFFFF" if on else "transparent"}; cursor: pointer;">{pic}'
                  f'<span style="font-size: 13px; font-weight: 700; color: {INK if not soon else MUTED};">{name}</span></button>')
    return f'<div style="display: flex; gap: 8px; padding: 0 12px 12px;">{items}</div>'

def status(ok, fix=True):
    if ok:
        return f'<span style="font-size: 13px; font-weight: 700; color: {CHILL}; background: {CHILL}1A; padding: 5px 10px; border-radius: 999px;">On</span>'
    return (f'<button type="button" style="height: 34px; padding: 0 14px; border: none; border-radius: 10px; background: {RED}; color: #FFFFFF; font-size: 14px; font-weight: 700; cursor: pointer;">Fix it</button>')

def label_in(text):
    return f'<div style="padding: 12px 16px 8px; font-size: 14px; font-weight: 700; color: {INK};">{text}</div>'

premium = (f'<a href="#" style="margin: 16px 24px 0; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; background: {INK}; text-decoration: none;">'
           f'<img src="{POSE["arms"]}" alt="" style="width: 44px; height: 44px; border-radius: 22px; object-fit: cover; object-position: 50% 10%; background: {BLUSH};">'
           f'<span style="flex-grow: 1; font-size: 15px; line-height: 1.3; font-weight: 700; color: #FFFFFF;">Watching more than 3 apps? Go Premium.</span>'
           f'<span style="font-size: 14px; font-weight: 700; color: #FFB38A;">See →</span></a>')

header = (f'<div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 0;">{LOGO}</div>'
          f'<h1 style="margin: 12px 24px 0; font-size: 32px; line-height: 1.05; color: {INK}; {DISPLAY}">Settings</h1>')

roasting = group("Roasting", [
    label_in("Roast level") + seg(["Polite", "Honest", "Savage", "Unhinged"], "Honest", locked=("Unhinged",)),
    f'<div style="border-top: 1px solid {LINE};">' + label_in("Your roaster") + roaster_pick("Loop") + '</div>',
    f'<div style="border-top: 1px solid {LINE};">' + label_in("Roast language") + seg(["English", "Tanglish"], "English") + '</div>',
    row("Roast sound", toggle(False, "Roast sound"), "Off. Your roasts, your volume."),
])
limits = group("Limits", [
    row("Apps and limits", value("3 apps"), "Lowering is instant. Raising waits for tomorrow.", first=True),
    row("Bedtime", value("11:30 pm"), "Late-night nudge after this"),
    row("Weekly roast", value("Sun, 7 pm")),
    row("Pause Endloop for today", f'<button type="button" style="height: 34px; padding: 0 14px; border-radius: 10px; border: 1.5px solid {LINE}; background: #FFFFFF; font-size: 14px; font-weight: 700; color: {INK}; cursor: pointer;">Pause</button>',
        "Shows up in your weekly roast."),
])
notifs = group("Notifications", [
    row("Heads up · 75%", toggle(True, "Heads up"), first=True),
    row("Last call · 90%", toggle(True, "Last call")),
    row("Late night", toggle(True, "Late night")),
    row("Weekly roast", toggle(True, "Weekly roast")),
])
health = group("Permission health", [
    row("Usage Access", status(True), "How I see your screen time", first=True),
    row("Display over apps", status(True), "How the roast appears"),
    row("Battery", status(False), "Your phone may put me to sleep"),
    row("Notifications", status(True)),
])
privacy = group("Privacy", [
    row("What Endloop can see", value(""), "Plain words, no legalese", first=True),
    row("Delete all my data", "", None, danger=True),
])
about = group("About", [
    row("Share Endloop", value(""), first=True),
    row("Rate us on Play Store", value("")),
    row("Suggest a roast", value(""), "Best ones make it into the app"),
    row("Privacy policy", value("")),
    row("Terms", value("")),
])
credit = (f'<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 22px 0 26px;">'
          f'<span style="font-size: 13px; font-weight: 600; color: {MUTED};">Endloop 0.1.0</span>'
          f'<span style="font-size: 13px; font-weight: 700; color: {INK};">from Super Spider</span></div>')

A = header + premium + roasting + limits + notifs + health + privacy + about + credit + nav("Settings")
A_H = 2200

def sheet(pose, title, body, primary, secondary, danger=False):
    return (f'<div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(20,20,20,0.45);"></div>'
            f'<div role="dialog" aria-label="{title}" style="position: absolute; left: 0; right: 0; bottom: 0; background: #FFFFFF; border-radius: 28px 28px 0 0; padding: 10px 24px 30px; display: flex; flex-direction: column; gap: 14px;">'
            f'<div style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE};"></div>'
            f'<img src="{POSE[pose]}" alt="Loop" style="align-self: center; width: 150px; height: 150px; object-fit: cover; object-position: 50% 0%;">'
            f'<span style="font-size: 28px; line-height: 1.1; color: {INK}; {DISPLAY}">{title}</span>'
            f'<span style="font-size: 15px; line-height: 1.45; font-weight: 500; color: {MUTED};">{body}</span>'
            f'<button type="button" style="height: 56px; border: none; border-radius: 16px; background: {RED}; color: #FFFFFF; font-size: 17px; font-weight: 700; cursor: pointer;">{primary}</button>'
            f'<button type="button" style="height: 44px; border: none; background: transparent; color: {MUTED}; font-size: 15px; font-weight: 700; cursor: pointer;">{secondary}</button></div>')

behind = header + premium + roasting
B = behind + sheet("peer", "Taking the day off?", "I'll stop watching until midnight. It shows as \"1 day off\" in your weekly roast. I'll remember this.", "Pause for today", "Cancel")

paused = (f'<div role="status" style="margin: 16px 24px 0; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; background: {HEADS};">'
          f'<span style="flex-grow: 1; font-size: 15px; line-height: 1.3; font-weight: 700; color: #FFFFFF;">Paused for today. I\'m back at midnight.</span>'
          f'<button type="button" style="height: 34px; padding: 0 12px; border: none; border-radius: 10px; background: #FFFFFF; color: {HEADS}; font-size: 14px; font-weight: 700; cursor: pointer;">Resume</button></div>')
C_ = header + paused + roasting + limits

D = behind + sheet("ohno", "Delete everything?", "Your limits, stats, streaks, roasts and snooze history are wiped from this phone. This can't be undone.", "Delete all my data", "Keep my data")

see_rows = [
    ("Which apps you open and for how long", "From Android's Usage Access. Stays on your phone."),
    ("When you open them", "To warn you at 75% and 90%, and to count opens."),
    ("Your snooze reasons and roasts", "Stored on your phone for Stats and your weekly roast."),
    ("Nothing inside your apps", "No messages, no photos, no what-you-watched. I only see the clock."),
    ("No account, no ads", "Nothing leaves your phone unless you share a card."),
]
see = "".join(f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 14px 0; border-bottom: 1px solid {LINE};">'
              f'<span style="font-size: 16px; font-weight: 700; color: {INK};">{t}</span><span style="font-size: 14px; line-height: 1.4; font-weight: 500; color: {MUTED};">{d}</span></div>'
              for t, d in see_rows)
E = (f'<div style="display: flex; align-items: center; gap: 8px; padding: 14px 16px 0 8px;">'
     f'<button type="button" aria-label="Back" style="width: 44px; height: 44px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;">'
     f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#141414" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button></div>'
     f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 4px 24px 0;">'
     f'<span style="font-size: 32px; line-height: 1.05; color: {INK}; {DISPLAY}">What I can see</span>'
     f'<span style="font-size: 15px; line-height: 1.4; font-weight: 500; color: {MUTED};">I watch the clock, not your content.</span>{see}</div>')

frames = [
    ("S14-Settings.dc.html", "All settings (full page, scrolls)", A, A_H),
    ("S14-Settings-B-Pause.dc.html", "Pause for today · confirm", B, H),
    ("S14-Settings-C-Paused.dc.html", "Paused · back at midnight", C_, H),
    ("S14-Settings-D-Delete.dc.html", "Delete all my data · confirm", D, H),
    ("S14-Settings-E-Privacy.dc.html", "What Endloop can see", E, H),
]

def full(title, inner, h):
    html = screen(title, "#FFFFFF", inner)
    return html.replace(f"height: {H}px; background: #FFFFFF", f"height: {h}px; background: #FFFFFF").replace(f'"height":{H}', f'"height":{h}')

for f, t, inner, h in frames:
    write(f, full(f"Settings · {t}", inner, h))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 17324 + H + 380  # below Screen 13
    for i, (f, t, _, h) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": h, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s14"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 14 · Settings", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, *_ in frames}))
