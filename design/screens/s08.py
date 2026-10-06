import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, LINE, HEADS = C["red"], C["ink"], C["muted"], C["line"], C["heads"]
POSE = {"peer": "/_blob/14efeff79f0551274251640f722df9b0", "arms": "/_blob/6d99d55593a111201d89cc12d0e961e1",
        "honest": "/_blob/d135c5eecd645436bff50d6d2e0ee283", "thug": "/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8",
        "polite": "/_blob/11a91c11030cb6b4340fb0f0fa4b8c42"}
MARK = re.sub(r'width="\d+" height="\d+"', 'width="12" height="12"', svg("mark_white.svg"), count=1)
WORD = re.sub(r'width="\d+" height="\d+"', 'width="74" height="20"', svg("wordmark_white.svg"), count=1)

GRAD = {
    "heads": "linear-gradient(135deg, #F5A524 0%, #B86E00 100%)",
    "last": "linear-gradient(135deg, #E08A00 0%, #E5132B 100%)",
    "night": "linear-gradient(135deg, #6B5BFF 0%, #1B1464 100%)",
    "weekly": "linear-gradient(135deg, #F0263D 0%, #7A0714 100%)",
}

def app_icon():
    return (f'<span aria-hidden="true" style="width: 20px; height: 20px; border-radius: 10px; background: {RED}; '
            f'display: inline-flex; align-items: center; justify-content: center; flex: none;">{MARK}</span>')

def header(when="now", channel=""):
    ch = f'<span>· {channel}</span>' if channel else ""
    return (f'<div style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: {MUTED};">'
            f'{app_icon()}<span style="font-weight: 700; color: {INK};">Endloop</span>{ch}<span>· {when}</span></div>')

def face(pose, bg="#FFE3E6"):
    return (f'<img src="{POSE[pose]}" alt="" style="width: 44px; height: 44px; border-radius: 22px; object-fit: cover; '
            f'object-position: 50% 12%; background: {bg}; flex: none;">')

def banner(kind, pose, big, small):
    """The pre-made big-picture banner: state gradient, Loop, one big word. Text below it is dynamic."""
    return (f'<div style="position: relative; height: 156px; border-radius: 16px; overflow: hidden; background: {GRAD[kind]};">'
            f'<div style="position: absolute; left: 16px; top: 14px;">{WORD}</div>'
            f'<div style="position: absolute; left: 16px; bottom: 16px; display: flex; flex-direction: column; gap: 2px;">'
            f'<span style="font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: rgba(255,255,255,0.85);">{small}</span>'
            f'<span style="font-size: 40px; line-height: 1; color: #FFFFFF; {DISPLAY}">{big}</span></div>'
            f'<img src="{POSE[pose]}" alt="Loop" style="position: absolute; right: -6px; bottom: -8px; width: 170px; height: 170px; object-fit: cover; object-position: 50% 0%;"></div>')

def actions(*labels):
    btns = "".join(f'<button type="button" style="height: 36px; padding: 0 14px; border: none; border-radius: 18px; '
                   f'background: {"#FFE3E6" if i == 0 else "transparent"}; color: {RED if i == 0 else INK}; font-size: 14px; font-weight: 700; cursor: pointer;">{l}</button>'
                   for i, l in enumerate(labels))
    return f'<div style="display: flex; gap: 6px;">{btns}</div>'

def card(title, text, pose=None, extra="", when="now", channel="", dark=False, shadow=True):
    bg = "#FFFFFF"
    sh = "box-shadow: 0 8px 28px rgba(0,0,0,0.22);" if shadow else ""
    right = face(pose) if pose else ""
    return (f'<div style="background: {bg}; border-radius: 24px; padding: 14px 16px 14px; display: flex; flex-direction: column; gap: 10px; {sh}">'
            f'{header(when, channel)}'
            f'<div style="display: flex; gap: 12px; align-items: flex-start;">'
            f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 3px;">'
            f'<span style="font-size: 15px; line-height: 1.3; font-weight: 700; color: {INK};">{title}</span>'
            f'<span style="font-size: 14px; line-height: 1.35; font-weight: 500; color: {INK};">{text}</span></div>{right}</div>'
            f'{extra}</div>')

def quiet(text):
    """The always-on service notification: lowest priority, collapsed, no large icon."""
    return (f'<div style="background: rgba(255,255,255,0.72); border-radius: 20px; padding: 12px 16px; display: flex; flex-direction: column; gap: 6px;">'
            f'{header("", "Watcher").replace("<span>· </span>", "")}'
            f'<span style="font-size: 14px; font-weight: 700; color: {INK};">Loop is watching</span>'
            f'<span style="font-size: 13px; line-height: 1.35; font-weight: 500; color: {MUTED};">{text}</span></div>')

def feed():
    """Generic app underneath (not any real app's UI): dim grey post blocks."""
    posts = "".join(f'<div style="display: flex; flex-direction: column; gap: 10px;">'
                    f'<div style="display: flex; align-items: center; gap: 10px;"><span style="width: 32px; height: 32px; border-radius: 16px; background: #3A3A40;"></span>'
                    f'<span style="width: {w}px; height: 10px; border-radius: 5px; background: #3A3A40;"></span></div>'
                    f'<div style="height: 300px; border-radius: 6px; background: #2A2A30;"></div></div>' for w in (120, 90))
    return f'<div aria-hidden="true" style="position: absolute; inset: 0; background: #17171B; padding: 70px 0 0; display: flex; flex-direction: column; gap: 22px;">{posts}</div>'

def clock(t, date, col="#FFFFFF"):
    return (f'<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 70px; color: {col};">'
            f'<span style="font-size: 88px; line-height: 1; font-weight: 500; letter-spacing: -2px;">{t}</span>'
            f'<span style="font-size: 15px; font-weight: 500; opacity: 0.85;">{date}</span></div>')

def over_app(content):
    return f'{feed()}<div style="position: relative; padding: 44px 12px 0; display: flex; flex-direction: column; gap: 10px;">{content}</div>'

def shade(content):
    return (f'<div aria-hidden="true" style="position: absolute; inset: 0; background: #17171B;"></div>'
            f'<div style="position: absolute; inset: 0; background: rgba(233,230,234,0.94);"></div>'
            f'<div style="position: relative; padding: 36px 12px 0; display: flex; flex-direction: column; gap: 8px;">'
            f'<span style="padding: 0 8px 6px; font-size: 13px; font-weight: 700; color: {MUTED};">Notifications</span>{content}</div>')

def lock(bg, t, date, content):
    return (f'<div aria-hidden="true" style="position: absolute; inset: 0; background: {bg};"></div>'
            f'<div style="position: relative; display: flex; flex-direction: column; gap: 28px;">{clock(t, date)}'
            f'<div style="padding: 0 12px; display: flex; flex-direction: column; gap: 8px;">{content}</div></div>')

# 1 · Heads up drops in over the app (collapsed)
A = over_app(card("Instagram: 15 min left", "Pace yourself, legend.", "peer"))

# 2 · Heads up expanded in the shade + the quiet watcher notification
B = shade(card("Instagram: 15 min left", "Pace yourself, legend.", None,
               banner("heads", "peer", "75%", "HEADS UP") + actions("Put it down", "Open Endloop"), when="2m", channel="Heads up", shadow=False)
          + quiet("Instagram 45/60 min · YouTube over · Snapchat 12/30 min"))

# 3 · Last call (90%), expanded, over the app
C_ = over_app(card("Instagram: 5 minutes.", "I'm warming up. Close it now and nobody gets hurt.", None,
                   banner("last", "arms", "90%", "LAST CALL") + actions("Put it down", "Open Endloop"), channel="Last call"))

# 4 · Late night on the lock screen
D = lock("linear-gradient(180deg, #0D0A26 0%, #1B1464 100%)", "12:40", "Friday, 26 September",
         card("It's 12:40 am.", "The feed will still be there tomorrow. Your sleep won't.", None,
              banner("night", "honest", "12:40", "STILL UP?") + actions("Go to sleep", "Open Endloop"), channel="Late night", shadow=False))

# 5 · Weekly roast, Sunday evening
E = lock("linear-gradient(180deg, #2A2A30 0%, #141414 100%)", "7:02", "Sunday, 28 September",
         card("Your weekly roast is ready.", "Brace yourself.", None,
              banner("weekly", "thug", "Week 1", "RATED") + actions("See my roast"), channel="Weekly roast", shadow=False))

# 6 · Tanglish, collapsed + service explainer
F = shade(card("Instagram: innum 15 min dhaan", "Pace pannu, legend.", "peer", when="now", channel="Heads up", shadow=False)
          + card("Oru notification irukkum, sorry", "Android sollirukku, naan watch panna idhu venum. Swipe pannu, naan inga dhaan irupen.", "polite", when="1h", channel="Watcher", shadow=False))

frames = [
    ("S08-Notif-A-HeadsUp.dc.html", "Heads up · 75% · drops in over the app", A, "#17171B"),
    ("S08-Notif-B-Shade.dc.html", "Heads up expanded · quiet watcher below", B, "#E9E6EA"),
    ("S08-Notif-C-LastCall.dc.html", "Last call · 90%", C_, "#17171B"),
    ("S08-Notif-D-LateNight.dc.html", "Late night · lock screen", D, "#0D0A26"),
    ("S08-Notif-E-Weekly.dc.html", "Weekly roast · Sunday", E, "#141414"),
    ("S08-Notif-F-Tanglish.dc.html", "Tanglish · plus one-time watcher explainer", F, "#E9E6EA"),
]
for f, t, inner, bg in frames:
    write(f, screen(f"Notifications · {t}", bg, inner))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 8308 + H + 380
    for i, (f, t, _, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s08"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 8 · Notifications", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _, _ in frames}))
