import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import s07
from s07 import header, loop_card, total, app_card, home, nav, IG, YT, SC

RED, INK, MUTED, SURF, LINE, BLUSH, CHILL, HEADS = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"], C["chill"], C["heads"]
s07.POSE.update(polite="/_blob/11a91c11030cb6b4340fb0f0fa4b8c42", thug="/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8",
                honest="/_blob/d135c5eecd645436bff50d6d2e0ee283")

def btn(label, tone="red"):
    if tone == "red":
        return f'<button type="button" style="height: 52px; border: none; border-radius: 16px; background: {RED}; color: #FFFFFF; font-size: 16px; font-weight: 700; cursor: pointer;">{label}</button>'
    return f'<button type="button" style="height: 48px; border-radius: 14px; border: 1.5px solid {RED}; background: #FFFFFF; color: {RED}; font-size: 15px; font-weight: 700; cursor: pointer;">{label}</button>'

def plain(inner):
    return (f'{header("Day 1")}<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 16px; padding: 16px 24px 12px;">{inner}</div>{nav()}')

# A · day 1, no data yet: no zeros, no empty charts
A = plain(loop_card("peer", "Day one", "I'm taking notes. Check back tonight.", "#FFF3E0", HEADS) +
          f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 18px; border: 1px dashed {LINE};">'
          f'<span style="font-size: 15px; font-weight: 700; color: {INK};">Watching Instagram, YouTube and Snapchat</span>'
          f'<span style="font-size: 14px; line-height: 1.4; font-weight: 500; color: {MUTED};">Your first numbers show up after you use them a little. Warnings at 75% and 90%, then I take over.</span></div>')

# B · no apps tracked
B = plain(loop_card("arms", "Bored", "Nothing to watch. Suspicious.") +
          f'<span style="font-size: 15px; line-height: 1.45; font-weight: 500; color: {MUTED};">Pick up to 3 apps and I\'ll keep an eye on them.</span>' + btn("Pick apps"))

# C · the phone killed the watcher
kill = (f'<div role="alert" style="display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 18px; background: {INK};">'
        f'<span style="font-size: 17px; line-height: 1.3; font-weight: 700; color: #FFFFFF;">Your phone put me to sleep. Let\'s stop that from happening again.</span>'
        f'<span style="font-size: 13px; font-weight: 700; color: #FFB38A;">On Xiaomi phones:</span>'
        f'<span style="font-size: 14px; line-height: 1.5; font-weight: 500; color: rgba(255,255,255,0.85);">1. Battery saver → No restrictions<br>2. Autostart → switch Endloop on</span>'
        f'<button type="button" style="height: 44px; border: none; border-radius: 12px; background: #FFFFFF; color: {INK}; font-size: 15px; font-weight: 700; cursor: pointer;">Open battery settings</button></div>')
C_ = home({"streak": ("3-day streak",), "top": kill + total(142, "Last known. I missed a few hours.")},
          [(*IG, 92, 110), (*YT, 38, 85), (*SC, 12, 55)])

# D · paused for today (grey)
paused = (f'<div style="display: flex; align-items: flex-end; gap: 4px; background: #EDEDED; border-radius: 22px; padding: 0 16px 0 4px; overflow: hidden; min-height: 118px;">'
          f'<img src="{s07.POSE["arms"]}" alt="Loop, arms crossed" style="width: 118px; height: 118px; object-fit: cover; filter: grayscale(0.7);">'
          f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 16px 0; align-self: center;">'
          f'<span style="font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED};">Day off</span>'
          f'<span style="font-size: 18px; line-height: 1.25; color: {INK}; {DISPLAY}">I\'m judging silently.</span></div></div>')
D = (f'<div style="filter: grayscale(0.85);">{header("Paused", MUTED, "#EDEDED")}</div>'
     f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 16px; padding: 16px 24px 12px;">'
     + paused + btn("Resume now", "outline") +
     f'<div style="display: flex; flex-direction: column; gap: 10px; opacity: 0.55; filter: grayscale(1);">'
     + app_card(*IG, 92, 110) + app_card(*YT, 38, 85) + '</div></div>' + nav())

# E · every limit hit
E = home({"streak": ("Streak at risk", "#FFFFFF", RED), "top": loop_card("ohno", "Disgusted", "Roasted on every app. Go outside. Seriously.") + total(290, "5 episodes of a series. In one day.")},
         [(*IG, 125, 110), (*YT, 110, 85), (*SC, 70, 55)])

# F · perfect day, next morning
perfect = (f'<div style="display: flex; flex-direction: column; gap: 12px; padding: 18px; border-radius: 22px; background: linear-gradient(135deg, #F2EBDD 0%, #FFB38A 100%);">'
           f'<div style="display: flex; align-items: center; gap: 12px;"><img src="{s07.POSE["polite"]}" alt="Loop, quietly proud" style="width: 64px; height: 64px; border-radius: 32px; object-fit: cover; object-position: 50% 10%; background: #FFFFFF;">'
           f'<span style="font-size: 12px; font-weight: 700; letter-spacing: 0.6px; color: #8A4A20;">YESTERDAY · PERFECT DAY</span></div>'
           f'<span style="font-size: 22px; line-height: 1.2; color: {INK}; {DISPLAY}">All under limits. I\'m… proud? Weird feeling.</span>'
           f'<button type="button" style="align-self: flex-start; height: 40px; padding: 0 16px; border: none; border-radius: 12px; background: {INK}; color: #FFFFFF; font-size: 14px; font-weight: 700; cursor: pointer;">Share it</button></div>')
F = home({"streak": ("4-day streak",), "top": perfect + total(18, "Barely a chai break. Keep it that way.")},
         [(*IG, 10, 110), (*YT, 8, 85), (*SC, 0, 55)])

# G · tracked app uninstalled
toast = (f'<div role="status" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: {INK};">'
         f'<img src="{s07.POSE["peer"]}" alt="" style="width: 36px; height: 36px; border-radius: 18px; object-fit: cover; object-position: 50% 10%; background: {BLUSH};">'
         f'<span style="flex-grow: 1; font-size: 14px; font-weight: 700; color: #FFFFFF;">Snapchat\'s gone. Bold move. Slot freed.</span></div>')
G = home({"streak": ("3-day streak",), "top": toast + loop_card("peer", "Suspicious", "Instagram's at 84%. I see you.", "#FFF3E0", HEADS)},
         [(*IG, 92, 110), (*YT, 38, 85)])

# H · Premium ended: pick 3 to keep
def pick(name, color, on):
    return (f'<button type="button" aria-pressed="{"true" if on else "false"}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; '
            f'border: 2px solid {RED if on else LINE}; background: {"#FFF4F5" if on else "#FFFFFF"}; cursor: pointer;">'
            f'<div aria-hidden="true" style="width: 36px; height: 36px; border-radius: 10px; background: {color}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700;">{name[0]}</div>'
            f'<span style="flex-grow: 1; text-align: left; font-size: 16px; font-weight: 700; color: {INK};">{name}</span>'
            f'<span style="width: 22px; height: 22px; border-radius: 6px; background: {RED if on else "#FFFFFF"}; border: 2px solid {RED if on else LINE}; box-sizing: border-box;"></span></button>')
H_ = (header("5-day streak") +
      f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 12px; padding: 16px 24px 12px;">'
      + loop_card("arms", "Premium ended", "Pick 3 apps to keep watching. Your history stays, locked.") +
      pick(*IG, True) + pick(*YT, True) + pick(*SC, True) + pick("WhatsApp", "#3E8B5E", False) + pick("Chrome", "#4A6FB0", False) +
      '<div style="flex-grow: 1;"></div>' + btn("Keep these 3") +
      f'<a href="#" style="align-self: center; font-size: 14px; font-weight: 700; color: {RED}; text-decoration: none;">Renew Premium</a></div>' + nav())

frames = [
    ("S16-Edge-A-DayOne.dc.html", "Day 1 · no data yet", A),
    ("S16-Edge-B-NoApps.dc.html", "No apps tracked", B),
    ("S16-Edge-C-Killed.dc.html", "Phone killed Endloop · battery steps", C_),
    ("S16-Edge-D-Paused.dc.html", "Paused for today · grey Home", D),
    ("S16-Edge-E-AllOver.dc.html", "Every limit hit", E),
    ("S16-Edge-F-Perfect.dc.html", "Perfect day · next morning", F),
    ("S16-Edge-G-Uninstalled.dc.html", "Tracked app uninstalled", G),
    ("S16-Edge-H-PremiumEnded.dc.html", "Premium ended · keep 3", H_),
]
for f, t, inner in frames:
    write(f, screen(f"Edge cases · {t}", "#FFFFFF", inner))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 21128 + 1180 + 380  # below Screen 15 (its boards are 1180 tall)
    for i, (f, t, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s16"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 16 · Empty states and edge cases", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _ in frames}))
