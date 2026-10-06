import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from s09 import POSE, WORD, ROASTED, loop, fact_card

RED = C["red"]
POSE.update(peer="/_blob/14efeff79f0551274251640f722df9b0", polite="/_blob/11a91c11030cb6b4340fb0f0fa4b8c42",
            lupe_idle="/_blob/bcfcbb4803f834723accd201f6b02f82")  # shared with s09.loop()

def top(step=None, total=3):
    dots = ""
    if step:
        dots = "".join(f'<span style="width: {18 if i == step else 6}px; height: 6px; border-radius: 3px; background: {"#FFFFFF" if i <= step else "rgba(255,255,255,0.35)"};"></span>'
                       for i in range(1, total + 1))
        dots = f'<div role="img" aria-label="Step {step} of {total}" style="display: flex; gap: 4px; align-items: center;">{dots}</div>'
    return f'<div style="display: flex; align-items: center; justify-content: space-between; padding: 52px 24px 0; min-height: 30px;">{WORD}{dots}</div>'

def head(eyebrow, title, sub=None, size=36):
    s = f'<span style="font-size: 16px; line-height: 1.4; font-weight: 500; color: rgba(255,255,255,0.9);">{sub}</span>' if sub else ""
    return (f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 0 24px;">'
            f'<span style="font-size: 13px; font-weight: 700; letter-spacing: 1.6px; color: #FFE3E6;">{eyebrow}</span>'
            f'<span style="font-size: {size}px; line-height: 1.05; color: #FFFFFF; {DISPLAY}">{title}</span>{s}</div>')

def primary(label, enabled=True):
    op = "1" if enabled else "0.45"
    dis = "" if enabled else ' disabled'
    return (f'<button type="button"{dis} style="height: 60px; border: none; border-radius: 18px; background: #FFFFFF; color: {RED}; '
            f'font-size: 18px; font-weight: 700; opacity: {op}; cursor: pointer;">{label}</button>')

def never_mind(label="Never mind, close it"):
    return (f'<a href="#" style="align-self: center; padding: 14px 8px 0; font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.85); '
            f'text-decoration: underline; text-underline-offset: 3px;">{label}</a>')

def bottom(*parts):
    return f'<div style="flex-grow: 1;"></div><div style="display: flex; flex-direction: column; padding: 0 24px 34px;">{"".join(parts)}</div>'

def chips(items, sel):
    out = ""
    for i, t in enumerate(items):
        on = i == sel
        out += (f'<button type="button" aria-pressed="{"true" if on else "false"}" style="height: 50px; padding: 0 18px; text-align: left; border-radius: 14px; '
                f'border: 1px solid {"#FFFFFF" if on else "rgba(255,255,255,0.35)"}; background: {"#FFFFFF" if on else "rgba(255,255,255,0.12)"}; '
                f'color: {"#C20F24" if on else "#FFFFFF"}; font-size: 15px; font-weight: 700; cursor: pointer;">{t}</button>')
    return f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 18px 24px 0;">{out}</div>'

REASONS = ["It's actually for work", "Replying to someone", "Finishing what I started", "No reason. I'm weak."]

def typed(sentence, n_ok, typo=None):
    """Target sentence with the typed part green-on-white, a red typo, the rest faded."""
    ok = sentence[:n_ok]
    rest = sentence[n_ok + (1 if typo else 0):]
    bad = f'<span style="color: #FFFFFF; background: #7A0714; border-radius: 3px; padding: 0 1px;">{sentence[n_ok]}</span>' if typo else ""
    return (f'<div style="margin: 18px 24px 0; padding: 18px; border-radius: 18px; background: #FFFFFF; font-size: 21px; line-height: 1.35; font-weight: 700;">'
            f'<span style="color: #16895F;">{ok}</span>{bad}<span style="color: #C9A3A8;">{rest}</span></div>')

def field(value, caret=True, hint=None):
    c = '<span style="display: inline-block; width: 2px; height: 20px; background: #141414; vertical-align: -3px; margin-left: 1px;"></span>' if caret else ""
    h = f'<span style="font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8);">{hint}</span>' if hint else ""
    return (f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 12px 24px 0;">'
            f'<span style="font-size: 13px; font-weight: 700; color: #FFE3E6;">Type it exactly. No pasting.</span>'
            f'<div id="confess" style="min-height: 52px; box-sizing: border-box; padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.14); '
            f'border: 1.5px solid rgba(255,255,255,0.6); color: #FFFFFF; font-size: 17px; font-weight: 500;">{value}{c}</div>{h}</div>')

def keyboard():
    """Where the phone's own keyboard sits (drawn as plain key shapes, not any real keyboard)."""
    rows = [10, 9, 7]
    r = "".join(f'<div style="display: flex; gap: 5px; justify-content: center;">' +
                "".join('<span style="width: 31px; height: 40px; border-radius: 6px; background: #3A3A40;"></span>' for _ in range(n)) + '</div>'
                for n in rows)
    r += '<div style="display: flex; justify-content: center;"><span style="width: 200px; height: 40px; border-radius: 6px; background: #3A3A40;"></span></div>'
    return f'<div aria-hidden="true" style="background: #1E1E22; padding: 10px 6px 22px; display: flex; flex-direction: column; gap: 9px;">{r}</div>'

def ring(sec, total, pose):
    pct = sec / total
    import math
    R = 82
    circ = 2 * math.pi * R
    return (f'<div style="display: flex; justify-content: center; padding-top: 12px;"><div style="position: relative; width: 200px; height: 200px;">'
            f'<svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true" style="position: absolute; inset: 0;">'
            f'<circle cx="100" cy="100" r="{R}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="10"/>'
            f'<circle cx="100" cy="100" r="{R}" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" '
            f'stroke-dasharray="{circ:.1f}" stroke-dashoffset="{circ * (1 - pct):.1f}" transform="rotate(-90 100 100)"/></svg>'
            f'<img src="{POSE[pose]}" alt="Loop, staring" style="position: absolute; left: 30px; top: 30px; width: 140px; height: 140px; border-radius: 70px; object-fit: cover; object-position: 50% 8%; background: #FFE3E6;">'
            f'<span style="position: absolute; right: 2px; bottom: 6px; min-width: 46px; height: 46px; padding: 0 8px; box-sizing: border-box; border-radius: 23px; background: #FFFFFF; '
            f'color: {RED}; display: flex; align-items: center; justify-content: center; font-size: 22px; {DISPLAY}">{sec}</span></div></div>')

S1 = "I am choosing reels over my dreams."
S2 = "I, a fully grown adult, cannot stop watching strangers dance."

# A · step 1: why?
A = (top(1) + loop("arms", "Loop, arms crossed, pulling out one earbud", size=190) +
     head("5 MORE MINUTES?", "Oh? Convince me.", "Why do you need more Instagram? Pick one. Be honest, I'll know.", 34) +
     chips(REASONS, 3) + bottom(primary("Next"), never_mind()))

# B · step 2: type the confession (sentence follows the reason)
B = (top(2) + head("YOUR CONFESSION", "Type this. Out loud, in your head.", None, 28) +
     typed(S1, 19, typo=True) + field("I am choosing reels b", hint="Typo. Letters must match exactly.") +
     '<div style="flex-grow: 1;"></div>' + keyboard())

# C · step 3: wait it out
C_ = (top(3) + ring(7, 10, "peer") +
      head("TYPED. NOW WAIT.", "I'm staring. You're waiting.", None, 30) +
      '<div style="height: 16px;"></div>' +
      fact_card("Every extra hour on your phone is linked to going to bed about 13 minutes later.", "Frontiers in Psychiatry, 2025",
                "WHILE YOU WAIT") +
      bottom(primary("Give me 5 minutes · 7", enabled=False), never_mind()))

# D · ready
D = (top(3) + ring(0, 10, "peer") +
     head("FINE.", "Five minutes. I'm counting.", "When they're up, I'm back. With material.", 34) +
     bottom(primary("Give me 5 minutes"), never_mind()))

# E · backed out: counts as a win
E = (top() + loop("polite", "Loop, quietly proud", size=260) +
     head("CLOSED WITHOUT A FIGHT", "Look at you. Choosing yourself.", "That counts as a win. I'm writing it down.", 36) +
     bottom(primary("Back to my life")))

# F · second snooze: longer sentence, 20 s
F = (top(2) + head("SECOND SNOOZE", "Longer sentence. Longer wait.", "20 seconds after this one.", 28) +
     typed(S2, 22) + field("I, a fully grown adult,") + '<div style="flex-grow: 1;"></div>' + keyboard())

# H · one fact, three tones (reference board)
def tone(name, chillies):
    return (f'<span style="align-self: flex-start; margin: 0 24px; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,0.2); '
            f'font-size: 12px; font-weight: 700; color: #FFFFFF;">{name} · {chillies}</span>')
H = (top() + head("FACTS, IN YOUR TONE", "Same fact. Three voices.", "Mental-health facts stay calm in every tone.", 30) +
     '<div style="display: flex; flex-direction: column; gap: 10px; padding-top: 18px;">' +
     tone("Polite", "1 chilli") + fact_card("Attention on one screen now lasts about 47 seconds on average. Yours deserves longer.", "Gloria Mark, UC Irvine") +
     tone("Honest", "2 chillies") + fact_card("Average attention on one screen: 47 seconds. It was 2.5 minutes in 2004.", "Gloria Mark, UC Irvine") +
     tone("Savage", "3 chillies") + fact_card("Attention on one screen: 47 seconds. You've used most of yours reading this.", "Gloria Mark, UC Irvine") +
     tone("Any tone", "calm") + fact_card("People who cut social apps to about 30 minutes a day for 3 weeks felt less lonely and less low.", "Hunt et al., Univ. of Pennsylvania", "GOOD NEWS") +
     '</div>')

frames = [
    ("S10-Snooze-A-Why.dc.html", "1 · Convince me · pick a reason", A),
    ("S10-Snooze-B-Type.dc.html", "2 · Type the confession · typo shown", B),
    ("S10-Snooze-C-Wait.dc.html", "3 · 10 s wait · Loop stares", C_),
    ("S10-Snooze-D-Ready.dc.html", "Ready · Give me 5 minutes", D),
    ("S10-Snooze-E-BackedOut.dc.html", "Never mind · counts as a win", E),
    ("S10-Snooze-F-Second.dc.html", "Second snooze · longer, 20 s", F),
    ("S10-Facts-Tones.dc.html", "Facts · one fact, three tones", H),
]
for f, t, inner in frames:
    write(f, screen(f"Snooze · {t}", "#C20F24", inner, f"background: {ROASTED};"))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 10756 + H + 380
    for i, (f, t, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s10"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 10 · Snooze friction", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _ in frames}))
