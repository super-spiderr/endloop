import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED = C["red"]
POSE = {"honest": "/_blob/d135c5eecd645436bff50d6d2e0ee283", "ohno": "/_blob/8950d72307c4db383ade218ef377fbf4",
        "arms": "/_blob/6d99d55593a111201d89cc12d0e961e1", "thug": "/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8",
        "lupe_savage": "/_blob/2ebc0c4d458ed254a821177ee290a044"}
WORD = re.sub(r'width="\d+" height="\d+"', 'width="96" height="26"', svg("wordmark_white.svg"), count=1)
WORD_BIG = re.sub(r'width="\d+" height="\d+"', 'width="150" height="41"', svg("wordmark_white.svg"), count=1)
ROASTED = "linear-gradient(180deg, #F0263D 0%, #C20F24 55%, #7A0714 100%)"

SHARE = ('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>')

def top(share=True):
    btn = (f'<button type="button" aria-label="Share this roast" style="width: 44px; height: 44px; border-radius: 22px; border: none; '
           f'background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center; cursor: pointer;">{SHARE}</button>') if share else ""
    return f'<div style="display: flex; align-items: center; justify-content: space-between; padding: 52px 24px 0; min-height: 44px;">{WORD}{btn}</div>'

def loop(pose, alt, size=270, lift=0, opacity=1):
    return (f'<div style="display: flex; justify-content: center; margin-top: 4px;">'
            f'<img src="{POSE[pose]}" alt="{alt}" style="width: {size}px; height: {size}px; object-fit: cover; object-position: 50% 0%; '
            f'transform: translateY({lift}px); opacity: {opacity}; -webkit-mask-image: linear-gradient(180deg, #000 72%, transparent 100%); '
            f'mask-image: linear-gradient(180deg, #000 72%, transparent 100%);"></div>')

def body(eyebrow, roast, stat, size=34):
    return (f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 0 28px;">'
            f'<span style="font-size: 13px; font-weight: 700; letter-spacing: 1.6px; color: #FFE3E6;">{eyebrow}</span>'
            f'<span style="font-size: {size}px; line-height: 1.08; color: #FFFFFF; {DISPLAY}">{roast}</span>'
            f'<span style="font-size: 15px; line-height: 1.4; font-weight: 500; color: rgba(255,255,255,0.85);">{stat}</span></div>')

def buttons(close, snooze=None, note=None):
    s = (f'<a href="#" style="align-self: center; padding: 12px 8px 4px; font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.82); '
         f'text-decoration: underline; text-underline-offset: 3px;">{snooze}</a>') if snooze else ""
    n = f'<span style="align-self: center; padding-top: 12px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.75);">{note}</span>' if note else ""
    return (f'<div style="display: flex; flex-direction: column; padding: 0 24px 34px;">'
            f'<button type="button" style="height: 60px; border: none; border-radius: 18px; background: #FFFFFF; color: {RED}; '
            f'font-size: 19px; font-weight: 700; cursor: pointer;">{close}</button>{s}{n}</div>')

BULB = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/></svg>')

def fact_card(text, source, label="DID YOU KNOW", margin="0 24px"):
    """A real, sourced fact, in the user's roast tone. Calm tone always for mental-health facts."""
    return (f'<div style="margin: {margin}; padding: 14px 16px; border-radius: 16px; background: rgba(255,255,255,0.13); '
            f'border: 1px solid rgba(255,255,255,0.28); display: flex; gap: 12px; align-items: flex-start;">'
            f'<span style="flex: none; width: 32px; height: 32px; border-radius: 16px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center;">{BULB}</span>'
            f'<div style="display: flex; flex-direction: column; gap: 4px;">'
            f'<span style="font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: #FFE3E6;">{label}</span>'
            f'<span style="font-size: 15px; line-height: 1.38; font-weight: 600; color: #FFFFFF;">{text}</span>'
            f'<span style="font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.72);">Source: {source}</span></div></div>')

def roast_screen(pose, alt, eyebrow, roast, stat, close, snooze=None, note=None, size=34, fact=None, img=270):
    f = f'<div style="height: 16px;"></div>{fact}' if fact else ""
    return (f'{top()}{loop(pose, alt, size=img)}{body(eyebrow, roast, stat, size)}{f}'
            f'<div style="flex-grow: 1;"></div>{buttons(close, snooze, note)}')

# A · entrance: slides up, Loop mid eye-roll, text not typed yet
A = (f'{top(share=False)}{loop("honest", "Loop rolling his eyes", lift=120, opacity=0.9)}'
     f'<div style="flex-grow: 1;"></div>')

# B · final state, Honest
B = roast_screen("honest", "Loop, unimpressed, holding his phone", "TIME'S UP",
                 "1h 10m of other people's vacations. Your own life is on airplane mode.",
                 "Instagram · 1h 10m today · opened 14 times",
                 "Fine. Close it.", "I need 5 more minutes", size=32)

# C · reopened right after closing: escalates
C_ = roast_screen("ohno", "Loop, appalled", "BACK ALREADY?",
                  "It's been 40 seconds. I'm not tired. Are you?",
                  "Instagram · reopened 3 times since your roast",
                  "Fine. Close it.", "I need 5 more minutes")

# D · snoozes used up
D = roast_screen("arms", "Loop, arms crossed", "NO MORE SNOOZES",
                 "Two snoozes. Both gone. This one's final.",
                 "Instagram · 1h 32m today · opened 21 times",
                 "Fine. Close it.", None, "Snoozes reset at midnight.")

# E · share card (what Share this roast makes: story-sized image)
E = (f'<div style="flex-grow: 1; display: flex; flex-direction: column; padding: 56px 28px 40px; gap: 18px;">'
     f'<span style="font-size: 13px; font-weight: 700; letter-spacing: 1.6px; color: #FFE3E6;">I GOT ROASTED</span>'
     f'<span style="font-size: 40px; line-height: 1.05; color: #FFFFFF; {DISPLAY}">1h 10m of other people\'s vacations. Your own life is on airplane mode.</span>'
     f'<span style="font-size: 16px; font-weight: 500; color: rgba(255,255,255,0.85);">Instagram · 1h 10m today</span>'
     f'<div style="flex-grow: 1;"></div>'
     f'{loop("honest", "Loop, unimpressed", size=300)}'
     f'<div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px;">{WORD_BIG}'
     f'<span style="font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.85);">Get roasted. Scroll less.</span></div></div>')

# F · Lupe, Savage, Tanglish
F = roast_screen("lupe_savage", "Lupe in sunglasses, unimpressed", "TIME'S UP",
                 "1h 10m aachu Instagram-la. Unnoda thumb unna vida jaasti exercise pannudhu.",
                 "Instagram · innaiku 1h 10m · 14 thadava open panna",
                 "Sari, close pannu", "Innum 5 minutes venum", size=30)

# G · with a fact card (Honest tone)
G = roast_screen("honest", "Loop, unimpressed, holding his phone", "TIME'S UP",
                 "1h 10m of other people's vacations.",
                 "Instagram · 1h 10m today · opened 14 times",
                 "Fine. Close it.", "I need 5 more minutes", size=32, img=210,
                 fact=fact_card("Average attention on one screen: 47 seconds. It was 2.5 minutes in 2004.", "Gloria Mark, UC Irvine"))

frames = [
    ("S09-Roast-A-Entrance.dc.html", "0.3s · slides up, Loop eye-rolls", A),
    ("S09-Roast.dc.html", "Final · Honest · Loop", B),
    ("S09-Roast-C-Reopened.dc.html", "Reopened 40s later · escalates", C_),
    ("S09-Roast-D-NoSnoozes.dc.html", "Snoozes used up", D),
    ("S09-Roast-E-ShareCard.dc.html", "Share this roast · story card", E),
    ("S09-Roast-F-LupeTanglish.dc.html", "Lupe · Savage · Tanglish", F),
    ("S09-Roast-G-Fact.dc.html", "With a fact card · Honest tone", G),
]
for f, t, inner in frames:
    write(f, screen(f"Roast · {t}", "#C20F24", inner, f"background: {ROASTED};"))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 9532 + H + 380  # Screen 9 row
    for i, (f, t, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s09"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 9 · Roast screen", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _ in frames}))
