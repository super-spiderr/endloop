import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, SURF, LINE, BLUSH, CHILL, HEADS = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"], C["chill"], C["heads"]
POSE = {"arms": "/_blob/6d99d55593a111201d89cc12d0e961e1", "peer": "/_blob/14efeff79f0551274251640f722df9b0",
        "ohno": "/_blob/8950d72307c4db383ade218ef377fbf4", "thug": "/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8"}
LOGO = re.sub(r'width="\d+" height="\d+"', 'width="100" height="27"', svg("wordmark_ink.svg"), count=1)

def fmt(m):
    h, mm = divmod(m, 60)
    return f"{h}h {mm:02d}m" if h else f"{mm}m"

FLAME = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 3.5 5 5.5 5 11a5 5 0 0 1-10 0c0-2.6 1.3-4.4 2.6-5.6.3 1.9 1.2 3 2.2 3.4C11.5 8 11.2 5 12 2z"/></svg>')

def header(streak, streak_col=RED, streak_bg=BLUSH):
    return (f'<div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 0;">{LOGO}'
            f'<span style="display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 12px; border-radius: 999px; background: {streak_bg}; '
            f'color: {streak_col}; font-size: 13px; font-weight: 700;">{FLAME}{streak}</span></div>')

def loop_card(pose, mood, line, tint=BLUSH, mood_col=RED):
    return (f'<div style="display: flex; align-items: flex-end; gap: 4px; background: {tint}; border-radius: 22px; padding: 0 16px 0 4px; overflow: hidden; min-height: 118px;">'
            f'<img src="{POSE[pose]}" alt="Loop, {mood.lower()}" style="display: block; width: 118px; height: 118px; object-fit: cover; flex: none;">'
            f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 16px 0; align-self: center;">'
            f'<span style="font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {mood_col};">{mood}</span>'
            f'<span style="font-size: 18px; line-height: 1.25; color: {INK}; {DISPLAY}">{line}</span></div></div>')

def total(mins, comparison, label="Today"):
    return (f'<div style="display: flex; flex-direction: column; gap: 2px;">'
            f'<span style="font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED};">{label}</span>'
            f'<span style="font-size: 52px; line-height: 1; color: {INK}; {DISPLAY}">{fmt(mins)}</span>'
            f'<span style="font-size: 15px; font-weight: 500; color: {MUTED};">{comparison}</span></div>')

def app_card(name, color, used, limit):
    pct = used / limit
    state, col = ("Roasted", RED) if pct >= 1 else (("Heads up", HEADS) if pct >= 0.75 else ("Chill", CHILL))
    w = min(pct, 1) * 100
    return (f'<a href="#" style="display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: 18px; border: 1px solid {LINE}; background: #FFFFFF; text-decoration: none;">'
            f'<div style="display: flex; align-items: center; gap: 12px;">'
            f'<div aria-hidden="true" style="width: 38px; height: 38px; border-radius: 11px; background: {color}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex: none;">{name[0]}</div>'
            f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 1px;"><span style="font-size: 16px; font-weight: 700; color: {INK};">{name}</span>'
            f'<span style="font-size: 13px; font-weight: 500; color: {MUTED};">{fmt(used)} of {fmt(limit)}</span></div>'
            f'<span style="font-size: 12px; font-weight: 700; color: {col}; background: {col}1A; padding: 5px 10px; border-radius: 999px;">{state}</span></div>'
            f'<div style="height: 6px; border-radius: 3px; background: {LINE};"><div style="width: {w:.0f}%; height: 6px; border-radius: 3px; background: {col};"></div></div></a>')

def free_line():
    return (f'<div style="display: flex; justify-content: center; gap: 6px; font-size: 13px; font-weight: 500; color: {MUTED};">'
            f'<span>3 of 3 free apps used ·</span><a href="#" style="font-weight: 700; color: {RED}; text-decoration: none;">Go unlimited</a></div>')

NAV_ICONS = {
    "Today": '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"/>',
    "Stats": '<path d="M5 20V11M12 20V5M19 20v-7"/>',
    "Settings": '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
}
def nav():
    items = ""
    for name, path in NAV_ICONS.items():
        on = name == "Today"
        col = RED if on else MUTED
        items += (f'<a href="#" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 0; text-decoration: none; color: {col}; font-size: 12px; font-weight: 700;">'
                  f'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>{name}</a>')
    return (f'<nav aria-label="Main" style="display: flex; border-top: 1px solid {LINE}; background: #FFFFFF; padding: 0 12px 10px;">{items}</nav>')

IG, YT, SC = ("Instagram", "#B04A7A"), ("YouTube", "#B8443A"), ("Snapchat", "#B9A032")

def home(parts, apps, banner=""):
    cards = "".join(app_card(n, c, u, l) for n, c, u, l in apps)
    return f"""{header(*parts["streak"])}
{banner}
<div style="flex-grow: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 16px; padding: 16px 24px 12px;">
{parts["top"]}
<div style="display: flex; flex-direction: column; gap: 10px;">{cards}</div>
{free_line()}
</div>
{nav()}"""

# A — first visit
how = (f'<div style="position: relative; background: {SURF}; border: 1px solid {LINE}; border-radius: 20px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">'
       f'<button type="button" aria-label="Dismiss" style="position: absolute; right: 8px; top: 8px; width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;">'
       f'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{MUTED}" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
       f'<span style="font-size: 16px; font-weight: 700; color: {INK};">Here\'s how it works</span>'
       f'<div style="display: flex; gap: 8px;">'
       + "".join(f'<div style="flex: 1; display: flex; flex-direction: column; gap: 4px; padding: 10px; border-radius: 14px; background: #FFFFFF;">'
                 f'<span style="font-size: 20px; color: {c}; {DISPLAY}">{p}</span><span style="font-size: 12px; line-height: 1.3; font-weight: 600; color: {INK};">{t}</span></div>'
                 for p, t, c in [("75%", "Heads up", HEADS), ("90%", "Last call", HEADS), ("100%", "I take over", RED)])
       + f'</div><button type="button" style="height: 44px; border-radius: 14px; border: 1.5px solid {RED}; background: #FFFFFF; color: {RED}; font-size: 15px; font-weight: 700; cursor: pointer;">Test the roast</button></div>')
A = home({"streak": ("Day 1",), "top": loop_card("thug", "Setup done", "Go live your life. I'll be watching.") + how},
         [(*IG, 0, 110), (*YT, 0, 85), (*SC, 0, 55)])

# B — normal day, one app close
B = home({"streak": ("3-day streak",), "top": loop_card("peer", "Suspicious", "Instagram's at 84%. I see you.", "#FFF3E0", HEADS) + total(142, "A whole movie you didn't watch.")},
         [(*IG, 92, 110), (*YT, 38, 85), (*SC, 12, 55)])

# C — over the limit
C_ = home({"streak": ("Streak at risk", "#FFFFFF", RED), "top": loop_card("ohno", "Disgusted", "Two apps over. I'm not angry. I'm disappointed.") + total(255, "5 episodes of a series. In one day.")},
          [(*IG, 125, 110), (*YT, 90, 85), (*SC, 40, 55)])

# D — permission lost
banner = (f'<div role="alert" style="margin: 14px 24px 0; display: flex; align-items: center; gap: 12px; background: {RED}; border-radius: 16px; padding: 12px 12px 12px 16px;">'
          f'<span style="flex-grow: 1; font-size: 15px; line-height: 1.35; font-weight: 700; color: #FFFFFF;">I can\'t see anything. Did you turn me off?</span>'
          f'<button type="button" style="height: 38px; padding: 0 14px; border: none; border-radius: 12px; background: #FFFFFF; color: {RED}; font-size: 14px; font-weight: 700; cursor: pointer; flex: none;">Fix it</button></div>')
D = home({"streak": ("3-day streak",), "top": loop_card("arms", "Blind", "Usage Access is off. I'm guessing now.") + total(142, "Last known. Could be worse by now.")},
         [(*IG, 92, 110), (*YT, 38, 85), (*SC, 12, 55)], banner)

frames = [
    ("S07-Home-A-FirstVisit.dc.html", "First visit · setup done", A),
    ("S07-Home.dc.html", "Every day · one app close", B),
    ("S07-Home-C-Over.dc.html", "Over the limit", C_),
    ("S07-Home-D-PermissionLost.dc.html", "Permission lost", D),
]
for f, t, inner in frames:
    write(f, screen(f"Home · {t}", "#FFFFFF", inner))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 7084 + H + 380
    for i, (f, t, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s07"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 7 · Home", "maxW": 4 * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _ in frames}))
