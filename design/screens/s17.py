import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import s14

RED, INK, MUTED, SURF, LINE, BLUSH = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"]
FACE = {"loop": "/_blob/6d99d55593a111201d89cc12d0e961e1", "lupe": "/_blob/bcfcbb4803f834723accd201f6b02f82"}
MARK = svg("mark_white.svg")

def mark(size, color="#FFFFFF"):
    m = re.sub(r'width="\d+" height="\d+"', f'width="{size:.0f}" height="{size:.0f}"', MARK, count=1)
    return m.replace('stroke="#FFFFFF"', f'stroke="{color}"').replace("<svg ", '<svg style="display: block;" ', 1)

def icon(kind, s, shape="squircle", label=None):
    r = "50%" if shape == "circle" else f"{s * 0.3:.0f}px"
    if kind == "themed":
        bg, inner = "#DDE3F0", mark(s * 0.56, "#2A3550")
    elif kind == "default":
        bg, inner = RED, mark(s * 0.56)
    else:
        bg = RED
        inner = (f'<img src="{FACE[kind]}" alt="" style="position: absolute; left: {-s * 0.125:.1f}px; top: {s * 0.12:.1f}px; width: {s * 1.25:.1f}px; height: {s * 1.25:.1f}px; object-fit: cover;">'
                 f'<span style="position: absolute; left: {s * 0.1:.1f}px; top: {s * 0.62:.1f}px; width: {s * 0.26:.1f}px; height: {s * 0.26:.1f}px; border-radius: 50%; background: #FFFFFF; '
                 f'display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.25);">{mark(s * 0.19, RED)}</span>')
    alt = {"default": "Endloop icon, red with the loop mark", "loop": "Endloop icon with Loop's face", "lupe": "Endloop icon with Lupe's face",
           "themed": "Themed Endloop icon, loop mark only"}[kind]
    ico = (f'<div role="img" aria-label="{alt}" style="position: relative; width: {s}px; height: {s}px; border-radius: {r}; background: {bg}; overflow: hidden; flex: none; '
           f'display: flex; align-items: center; justify-content: center;">{inner}</div>')
    if label is None:
        return ico
    return (f'<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; width: {max(s, 64)}px;">{ico}'
            f'<span style="font-size: 12px; font-weight: 600; color: #FFFFFF; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">{label}</span></div>')

# ---------- A · the icon set ----------
def cell(ico, cap):
    return (f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1;">{ico}'
            f'<span style="font-size: 13px; font-weight: 700; color: {INK};">{cap}</span></div>')

def section(title, sub, body):
    return (f'<section style="display: flex; flex-direction: column; gap: 12px; padding: 22px 24px 0;">'
            f'<div style="display: flex; flex-direction: column; gap: 2px;"><h2 style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED};">{title}</h2>'
            + (f'<span style="font-size: 13px; line-height: 1.4; font-weight: 500; color: {MUTED};">{sub}</span>' if sub else "") +
            f'</div><div style="display: flex; gap: 8px;">{body}</div></section>')

A = (f'<div style="padding: 28px 24px 0; display: flex; flex-direction: column; gap: 6px;">'
     f'<span style="font-size: 13px; font-weight: 700; letter-spacing: 1.2px; color: {RED};">APP ICON</span>'
     f'<span style="font-size: 28px; line-height: 1.08; color: {INK}; {DISPLAY}">Your roaster lives on your home screen.</span></div>'
     + section("Squircle", None, cell(icon("default", 88), "Default") + cell(icon("loop", 88), "Loop") + cell(icon("lupe", 88), "Lupe"))
     + section("Circle", "Same icons on phones that crop to a circle. The face and badge stay inside.", cell(icon("default", 88, "circle"), "Default") + cell(icon("loop", 88, "circle"), "Loop") + cell(icon("lupe", 88, "circle"), "Lupe"))
     + section("Themed icons · Android 13+", "A face can't be one colour, so themed mode always shows the loop mark.", cell(icon("themed", 64, "circle"), "Any choice"))
     )

# ---------- B, C · home screens ----------
APPS = [("Clock", "#3B4A6B", "C"), ("Notes", "#E0A526", "N"), ("Photos", "#2F8F6A", "P"), ("Weather", "#3A86C8", "W"),
        ("Maps", "#4E9A5B", "M"), ("Music", "#B7417A", "M"), ("Files", "#556070", "F"), None,
        ("Calendar", "#D4553A", "C"), ("Wallet", "#2C2C44", "W"), ("Fitness", "#E0662B", "F"), ("Camera", "#444444", "C")]
DOCK = [("Phone", "#2F8F6A", "P"), ("Messages", "#3A86C8", "M"), ("Browser", "#E0A526", "B"), ("Camera", "#444444", "C")]

def plain(name, color, letter, s=56, label=True):
    ico = (f'<div aria-hidden="true" style="width: {s}px; height: {s}px; border-radius: {s * 0.3:.0f}px; background: {color}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; '
           f'font-size: {s * 0.4:.0f}px; font-weight: 700;">{letter}</div>')
    lab = f'<span style="font-size: 12px; font-weight: 600; color: #FFFFFF; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">{name}</span>' if label else ""
    return f'<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; width: 64px;">{ico}{lab}</div>'

def home(kind, wall):
    grid = "".join(icon(kind, 56, label="Endloop") if a is None else plain(*a) for a in APPS)
    dock = "".join(plain(*d, label=False) for d in DOCK)
    return (f'<div style="position: absolute; inset: 0; background: {wall};"></div>'
            f'<div style="position: relative; display: flex; justify-content: space-between; padding: 12px 24px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;"><span>12:35</span><span>5G · 82%</span></div>'
            f'<div style="position: relative; padding: 48px 24px 0; display: flex; flex-direction: column; gap: 2px; color: #FFFFFF;">'
            f'<span style="font-size: 44px; line-height: 1; font-weight: 500;">12:35</span><span style="font-size: 15px; font-weight: 600; opacity: 0.85;">Friday, 25 September</span></div>'
            f'<div style="position: relative; flex-grow: 1;"></div>'
            f'<div style="position: relative; display: grid; grid-template-columns: repeat(4, 64px); justify-content: space-between; row-gap: 22px; padding: 0 28px;">{grid}</div>'
            f'<div style="position: relative; margin: 26px 16px 28px; padding: 12px; border-radius: 28px; background: rgba(255,255,255,0.18); display: flex; justify-content: space-between;">{dock}</div>')

B = home("loop", "linear-gradient(180deg, #1E2A44 0%, #4A3B5E 60%, #C46B5A 100%)")
C_ = home("lupe", "linear-gradient(180deg, #F4C9A8 0%, #D98C7A 50%, #5E3B52 100%)")

# ---------- D, E · onboarding ask ----------
ARROW = ('<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5F5F5F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         '<path d="M5 12h14M13 6l6 6-6 6"/></svg>')

def ask(kind, name, title, body):
    pron = "my" if kind == "loop" else "my"
    return (brand_bar(6) +
            f'<div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 18px; padding: 0 28px;">'
            f'<div style="display: flex; align-items: center; justify-content: center; gap: 18px; padding: 22px 0; border-radius: 24px; background: {SURF};">'
            f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">{icon("default", 72)}<span style="font-size: 12px; font-weight: 700; color: {MUTED};">Now</span></div>'
            f'{ARROW}'
            f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">{icon(kind, 96)}<span style="font-size: 12px; font-weight: 700; color: {INK};">With {name}</span></div></div>'
            f'<span style="font-size: 30px; line-height: 1.08; color: {INK}; {DISPLAY}">{title}</span>'
            f'<span style="font-size: 16px; line-height: 1.45; font-weight: 500; color: {MUTED};">{body}</span>'
            f'<div role="note" style="display: flex; gap: 10px; padding: 12px 14px; border-radius: 14px; border: 1px solid {LINE};">'
            f'<span aria-hidden="true" style="font-size: 15px; font-weight: 700; color: {RED};">!</span>'
            f'<span style="font-size: 13px; line-height: 1.45; font-weight: 500; color: {INK};">Some phones take the icon off your home screen when it changes. '
            f'If it vanishes, it\'s in your app drawer. Drag it back.</span></div></div>'
            f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 0 28px 30px;">'
            f'<button type="button" style="height: 58px; border: none; border-radius: 18px; background: {RED}; color: #FFFFFF; font-size: 18px; font-weight: 700; cursor: pointer;">Yes, use {name}</button>'
            f'<button type="button" style="height: 46px; border: none; background: transparent; color: {MUTED}; font-size: 15px; font-weight: 700; cursor: pointer;">Keep the red one</button>'
            f'<span style="font-size: 12px; font-weight: 500; color: {MUTED}; text-align: center;">Change it anytime in Settings → App icon</span></div>')

D = ask("loop", "Loop", "Put my face on your home screen?", "Every time your thumb goes looking for Instagram, it walks past me first.")
E = ask("lupe", "Lupe", "Want me on your home screen?", "I'll be right there, next to the apps you swore you'd open less.")

# ---------- F · Settings sheet ----------
def choice(kind, name, on):
    ring = f"box-shadow: 0 0 0 3px #FFFFFF, 0 0 0 5px {RED};" if on else ""
    return (f'<button type="button" role="radio" aria-checked="{"true" if on else "false"}" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 4px; '
            f'border: none; border-radius: 18px; background: {SURF if on else "transparent"}; cursor: pointer;">'
            f'<div style="border-radius: 22px; {ring}">{icon(kind, 72)}</div>'
            f'<span style="font-size: 14px; font-weight: 700; color: {INK if on else MUTED};">{name}</span></button>')

icon_row = s14.row("App icon", s14.value("Loop"), "Matches your roaster, or keep it red")
roasting_icon = s14.group("Roasting", [
    s14.label_in("Roast level") + s14.seg(["Polite", "Honest", "Savage", "Unhinged"], "Honest", locked=("Unhinged",)),
    f'<div style="border-top: 1px solid {LINE};">' + s14.label_in("Your roaster") + s14.roaster_pick("Lupe") + '</div>',
    icon_row,
])
F = (s14.header + roasting_icon +
     f'<div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(20,20,20,0.45);"></div>'
     f'<div role="dialog" aria-label="App icon" style="position: absolute; left: 0; right: 0; bottom: 0; background: #FFFFFF; border-radius: 28px 28px 0 0; padding: 10px 24px 30px; display: flex; flex-direction: column; gap: 14px;">'
     f'<div style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE};"></div>'
     f'<span style="font-size: 26px; line-height: 1.1; color: {INK}; {DISPLAY}">You picked Lupe. Swap the icon too?</span>'
     f'<div role="radiogroup" aria-label="App icon" style="display: flex; gap: 8px;">{choice("default", "Red", False)}{choice("loop", "Loop", False)}{choice("lupe", "Lupe", True)}</div>'
     f'<span style="font-size: 13px; line-height: 1.45; font-weight: 500; color: {MUTED};">It changes when you leave Endloop. Some phones move it to the app drawer. Drag it back.</span>'
     f'<button type="button" style="height: 56px; border: none; border-radius: 16px; background: {RED}; color: #FFFFFF; font-size: 17px; font-weight: 700; cursor: pointer;">Use Lupe</button>'
     f'<button type="button" style="height: 44px; border: none; background: transparent; color: {MUTED}; font-size: 15px; font-weight: 700; cursor: pointer;">Keep Loop</button></div>')

frames = [
    ("S17-Icon-A-Set.dc.html", "Icon set · squircle, circle, themed", A, "#FFFFFF"),
    ("S17-Icon-B-HomeLoop.dc.html", "Home screen · Loop", B, "#1E2A44"),
    ("S17-Icon-C-HomeLupe.dc.html", "Home screen · Lupe", C_, "#F4C9A8"),
    ("S17-Icon-D-AskLoop.dc.html", "Onboarding ask · Loop", D, "#FFFFFF"),
    ("S17-Icon-E-AskLupe.dc.html", "Onboarding ask · Lupe", E, "#FFFFFF"),
    ("S17-Icon-F-Settings.dc.html", "Settings · roaster changed, swap icon?", F, "#FFFFFF"),
]
for f, t, inner, bg in frames:
    write(f, screen(f"App icon · {t}", bg, inner))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 22688 + H + 380  # below Screen 16
    for i, (f, t, _, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s17"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 17 · App icon matches your roaster", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, *_ in frames}))
