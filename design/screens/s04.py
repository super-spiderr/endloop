import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, SURF, LINE, BLUSH = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"]
# placeholders until the new chilli expressions exist
IMG = {
    "Loop": {"Polite": "/_blob/11a91c11030cb6b4340fb0f0fa4b8c42", "Honest": "/_blob/d135c5eecd645436bff50d6d2e0ee283", "Savage": "/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8"},
    "Lupe": {"Polite": "/_blob/7c0d266ed4b1e7d6623bee2a018987df", "Honest": "/_blob/bddae17daff4de734e7cef1955edb9c2", "Savage": "/_blob/2ebc0c4d458ed254a821177ee290a044"},
}
ALT = {"Polite": "shrugging politely", "Honest": "holding up the phone with your stats", "Savage": "in pixel sunglasses, arms crossed"}
ALT_LUPE = {"Polite": "sipping tea, unconvinced", "Honest": "pointing at your stats on her phone", "Savage": "in pixel sunglasses, flicking her hair"}
# where the blank phone screen sits in the 236 px image (the real stat goes on it)
PHONE = {"Loop": (40, 96, 31, 61), "Lupe": (161, 103, 31, 59)}
LUPE = "/_blob/bcfcbb4803f834723accd201f6b02f82"
FACE = "/_blob/6d99d55593a111201d89cc12d0e961e1"
LEVELS = ["Polite", "Honest", "Savage", "Unhinged"]
HEAT = {"Polite": 1, "Honest": 2, "Savage": 3, "Unhinged": 4}
ROAST = {
    "Polite": "14 hours on Instagram last week. Maybe a little less this week?",
    "Honest": "14 hours on Instagram. That's two workdays of other people's lives.",
    "Savage": "14 hours on Instagram. Your thumb gets more exercise than you do.",
}
ROAST_TA = {
    "Polite": "Last week 14 hours Instagram-la. Indha week konjam kammi pannalaam, okay?",
    "Honest": "14 hours Instagram-la. Adhu rendu full working days, boss.",
    "Savage": "14 hours Instagram. Unnoda thumb unna vida jaasti exercise pannudhu, boss.",
}

def lang_toggle(t, lang):
    def seg(label, on):
        bg = t["pill_on"] if on else "transparent"
        fg = t["pill_on_fg"] if on else t["ink"]
        return (f'<button type="button" aria-pressed="{"true" if on else "false"}" style="flex: 1; height: 34px; border: none; border-radius: 999px; '
                f'background: {bg}; color: {fg}; font-size: 14px; font-weight: 700; cursor: pointer;">{label}</button>')
    return (f'<div style="display: flex; align-items: center; gap: 10px;">'
            f'<span style="font-size: 13px; font-weight: 700; color: {t["muted"]}; flex: none; width: 84px;">Roast in</span>'
            f'<div role="group" aria-label="Roast language" style="flex-grow: 1; display: flex; gap: 4px; padding: 3px; border-radius: 999px; background: {t["chip"]}; box-shadow: 0 0 0 1px {t["line"]};">'
            f'{seg("English", lang == "en")}{seg("Tanglish", lang == "ta")}</div></div>')

# the screen heats up as the roast gets meaner
THEME = {
    "Polite": dict(bg="#FFFFFF", ink=INK, muted=MUTED, card=SURF, line=LINE, accent=RED, btn_bg=RED, btn_fg="#FFFFFF",
                   pill_on=RED, pill_on_fg="#FFFFFF", pill_off="#FFFFFF", chip=SURF),
    "Honest": dict(bg="linear-gradient(180deg, #FFFFFF 0%, #FFE3E6 100%)", ink=INK, muted=MUTED, card="#FFFFFF", line=LINE, accent=RED,
                   btn_bg=RED, btn_fg="#FFFFFF", pill_on=RED, pill_on_fg="#FFFFFF", pill_off="#FFFFFF", chip="#FFFFFF"),
    "Savage": dict(bg="radial-gradient(120% 50% at 50% 34%, rgba(255, 92, 108, 0.5) 0%, rgba(255, 92, 108, 0) 60%), linear-gradient(180deg, #F0263D 0%, #C20F24 55%, #7A0714 100%)",
                   ink="#FFFFFF", muted="#FFE3E6", card="rgba(255, 255, 255, 0.14)", line="rgba(255, 255, 255, 0.4)", accent="#FFFFFF",
                   btn_bg="#FFFFFF", btn_fg=RED, pill_on="#FFFFFF", pill_on_fg=RED, pill_off="rgba(255, 255, 255, 0.14)", chip="rgba(255, 255, 255, 0.14)"),
}
LOCK = ('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>')

def chilli(color, size=14):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" aria-hidden="true">'
            f'<path d="M15.5 6.5c2.8.6 4.4 3.3 3.3 6.6-1.5 4.6-6.7 8.3-12.6 8.4-1 0-1.3-1.2-.4-1.6 4-1.8 6.3-5 6.9-9.2.4-2.6 1.3-4.6 2.8-4.2z" fill="{color}"/>'
            f'<path d="M15.2 6.6c.1-1.6.9-3 2.3-3.9" stroke="{color}" stroke-width="2" stroke-linecap="round" fill="none"/></svg>')

def loop_face(size=40):
    return (f'<div style="width: {size}px; height: {size}px; border-radius: 50%; overflow: hidden; background: {BLUSH}; flex: none;">'
            f'<img src="{FACE}" alt="" style="display: block; width: {size*1.7:.0f}px; height: {size*1.7:.0f}px; margin-left: -{size*0.35:.0f}px; margin-top: -{size*0.05:.0f}px; object-fit: cover;"></div>')

def lupe_face(size=40):
    return (f'<div style="width: {size}px; height: {size}px; border-radius: 50%; overflow: hidden; background: {BLUSH}; flex: none;">'
            f'<img src="{LUPE}" alt="" style="display: block; width: {size*1.5:.0f}px; height: {size*1.5:.0f}px; margin-left: -{size*0.25:.0f}px; margin-top: -{size*0.02:.0f}px; object-fit: cover;"></div>')

def picker(t, who="Loop"):
    def chip(name, sel, face):
        ring = f"box-shadow: 0 0 0 2px {t['accent']};" if sel else f"box-shadow: 0 0 0 1px {t['line']};"
        return (f'<button type="button" aria-pressed="{"true" if sel else "false"}" style="flex: 1; display: flex; align-items: center; gap: 10px; '
                f'padding: 6px 12px 6px 6px; border: none; border-radius: 999px; background: {t["chip"]}; {ring} cursor: pointer;">'
                f'{face}<span style="font-size: 15px; font-weight: 700; color: {t["ink"]};">{name}</span></button>')
    return (f'<div style="display: flex; align-items: center; gap: 10px;">'
            f'<span style="font-size: 13px; font-weight: 700; color: {t["muted"]}; flex: none; width: 84px;">Your roaster</span>'
            f'{chip("Loop", who == "Loop", loop_face(34))}{chip("Lupe", who == "Lupe", lupe_face(34))}</div>')

def heat_meter(level, t):
    pills = ""
    for name in LEVELS:
        on = name == level
        locked = name == "Unhinged"
        bg = t["pill_on"] if on else t["pill_off"]
        fg = t["pill_on_fg"] if on else t["ink"]
        chil_col = (t["pill_on_fg"] if on else (t["accent"] if not locked else t["muted"]))
        chillies = "".join(chilli(chil_col, 13) for _ in range(HEAT[name])) if not locked else LOCK
        border = f"1px solid {t['line']}" if not on else "none"
        pills += (f'<button type="button" aria-pressed="{"true" if on else "false"}" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; '
                  f'padding: 10px 2px; border: {border}; border-radius: 14px; background: {bg}; cursor: pointer; opacity: {0.7 if locked else 1};">'
                  f'<span style="display: flex; gap: 1px; height: 14px; align-items: center; color: {chil_col};">{chillies}</span>'
                  f'<span style="font-size: 13px; font-weight: 700; color: {fg};">{name}</span></button>')
    return f'<div role="group" aria-label="Roast intensity" style="display: flex; gap: 8px;">{pills}</div>'

def preview(level, t, lang="en"):
    return (f'<div style="background: {t["card"]}; border: 1px solid {t["line"]}; border-radius: 20px; padding: 16px 18px; display: flex; flex-direction: column; gap: 8px;">'
            f'<div style="font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {t["accent"]};">Your first roast</div>'
            f'<div style="font-size: 21px; line-height: 1.25; color: {t["ink"]}; {DISPLAY}">{(ROAST_TA if lang == "ta" else ROAST)[level]}</div></div>')

def button(label, t):
    return (f'<button type="button" style="width: 100%; height: 58px; border: none; border-radius: 18px; background: {t["btn_bg"]}; color: {t["btn_fg"]}; '
            f'font-size: 18px; font-weight: 700; cursor: pointer;">{label}</button>')

def body(level, who="Loop", lang="en"):
    t = THEME[level]
    alt = (ALT if who == "Loop" else ALT_LUPE)[level]
    phone = ""
    if level == "Honest":
        x, y, w, h = PHONE[who]
        phone = (f'<div aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;">'
                 f'<span style="font-size: 13px; line-height: 1; font-weight: 700; color: {RED};">14h</span><span style="font-size: 6px; font-weight: 700; color: {MUTED};">INSTA</span></div>')
    return f"""<div style="display: flex; flex-direction: column; gap: 14px; padding: 16px 24px 0;">
<h1 style="margin: 0; font-size: 32px; line-height: 1.08; color: {t['ink']}; {DISPLAY}">How mean should I be?</h1>
{picker(t, who)}
{lang_toggle(t, lang)}
</div>
<div style="display: flex; justify-content: center; padding-top: 4px;">
<div style="position: relative; width: 236px; height: 236px;"><img src="{IMG[who][level]}" alt="{who}, {alt}" style="display: block; width: 236px; height: 236px; object-fit: cover; -webkit-mask-image: linear-gradient(180deg, #000 80%, transparent 100%); mask-image: linear-gradient(180deg, #000 80%, transparent 100%);">{phone}</div>
</div>
<div style="display: flex; flex-direction: column; gap: 14px; padding: 0 24px;">{heat_meter(level, t)}{preview(level, t, lang)}</div>
<div style="flex-grow: 1;"></div>
<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 0 24px 28px;">
<div style="font-size: 13px; font-weight: 500; color: {t['muted']};">You can change this anytime in Settings.</div>
{button("Roast me like that", t)}
</div>"""

RT = THEME["Polite"]
sheet = f"""<div style="position: absolute; inset: 0; background: rgba(20, 20, 20, 0.5);"></div>
<div role="dialog" aria-label="Premium" style="position: absolute; left: 0; right: 0; bottom: 0; background: #140A0B; border-radius: 28px 28px 0 0; padding: 12px 24px 28px; display: flex; flex-direction: column; gap: 16px;">
<div style="width: 44px; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.25); align-self: center;"></div>
<div style="display: flex; gap: 3px;">{"".join(chilli(RED, 22) for _ in range(4))}</div>
<h2 style="margin: 0; font-size: 28px; line-height: 1.1; color: #FFFFFF; {DISPLAY}">You want it meaner? Respect.</h2>
<p style="margin: 0; font-size: 16px; line-height: 1.45; color: #D9C7C9; font-weight: 500;">Unhinged is Premium. Absurd, chaotic, still never about your looks or your family.</p>
<button type="button" style="width: 100%; height: 58px; border: none; border-radius: 18px; background: {RED}; color: #FFFFFF; font-size: 18px; font-weight: 700; cursor: pointer;">See Premium</button>
<button type="button" style="height: 44px; border: none; background: transparent; font-size: 16px; font-weight: 700; color: #D9C7C9; cursor: pointer;">Maybe later</button>
</div>"""

frames = [
    ("S04-Intensity.dc.html", "Loop · Honest (default) · 2 chillies", "Honest", "Loop", False),
    ("S04-Intensity-B-Polite.dc.html", "Loop · Polite · 1 chilli", "Polite", "Loop", False),
    ("S04-Intensity-C-Savage.dc.html", "Loop · Savage · 3 chillies, screen goes red", "Savage", "Loop", False),
    ("S04-Intensity-D-Unhinged.dc.html", "Unhinged tapped · Premium sheet", "Savage", "Loop", True),
    ("S04-Intensity-H-Tanglish.dc.html", "Loop · Honest · Tanglish", "Honest", "Loop", False),
    ("S04-Intensity-E-LupePolite.dc.html", "Lupe · Polite", "Polite", "Lupe", False),
    ("S04-Intensity-F-LupeHonest.dc.html", "Lupe · Honest", "Honest", "Lupe", False),
    ("S04-Intensity-G-LupeSavage.dc.html", "Lupe · Savage", "Savage", "Lupe", False),
]
for f, title, lvl, who, sh in frames:
    write(f, screen(f"Roast intensity · {title}", THEME[lvl]["bg"], brand_bar(4, dark=(lvl == "Savage")) + body(lvl, who, "ta" if "Tanglish" in title else "en") + (sheet if sh else "")))

if __name__ == "__main__":
    print(json.dumps({f"project/{f[0]}": f"project/{f[0]}" for f in frames}))
