import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, SURF, LINE, BLUSH = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"]
ARMS = "/_blob/6d99d55593a111201d89cc12d0e961e1"   # unimpressed, arms crossed
PRESENT = "/_blob/654f631c3bb02a2a20db31769b070e5a"  # palms up, "it's that simple"

TITLE = f'margin: 0; font-size: 32px; line-height: 1.08; letter-spacing: -0.3px; color: {INK}; {DISPLAY}'
SUB = f'margin: 0; font-size: 16px; line-height: 1.45; color: {MUTED}; font-weight: 500;'

# demo data: last 7 days, worst first (placeholder numbers)
APPS = [("Instagram", "18h 40m", "#B04A7A"), ("YouTube", "14h 05m", "#B8443A"), ("Snapchat", "9h 12m", "#B9A032"),
        ("WhatsApp", "6h 30m", "#3E8B5E"), ("Chrome", "4h 10m", "#4A6FB0"), ("X", "3h 25m", "#3A3A3A"),
        ("Netflix", "2h 50m", "#8E2E2E"), ("Spotify", "1h 40m", "#2E7D4F")]

def mini_loop(size=76):
    return (f'<div style="width: {size}px; height: {size}px; overflow: hidden; flex: none; border-radius: 0 0 0 0;">'
            f'<img src="{ARMS}" alt="Loop, unimpressed" style="display: block; width: {size*1.6:.0f}px; height: {size*1.6:.0f}px; '
            f'margin-left: -{size*0.3:.0f}px; margin-top: -{size*0.02:.0f}px; object-fit: cover;"></div>')

def avatar(size=36):
    return (f'<div style="width: {size}px; height: {size}px; overflow: hidden; border-radius: 50%; background: {BLUSH}; flex: none;">'
            f'<img src="{ARMS}" alt="" style="display: block; width: {size*1.7:.0f}px; height: {size*1.7:.0f}px; '
            f'margin-left: -{size*0.35:.0f}px; margin-top: -{size*0.05:.0f}px; object-fit: cover;"></div>')

def icon(name, color):
    return (f'<div aria-hidden="true" style="width: 44px; height: 44px; border-radius: 12px; background: {color}; color: #FFFFFF; '
            f'display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex: none;">{name[0]}</div>')

CHECK = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>')

def row(name, hours, color, selected, show_hours=True):
    ring = f"box-shadow: 0 0 0 2px {RED};" if selected else f"box-shadow: 0 0 0 1px {LINE};"
    bg = SURF if selected else "#FFFFFF"
    mark = (f'<div style="width: 26px; height: 26px; border-radius: 50%; background: {RED}; display: flex; align-items: center; justify-content: center; flex: none;">{CHECK}</div>'
            if selected else
            f'<div style="width: 26px; height: 26px; border-radius: 50%; border: 2px solid {LINE}; box-sizing: border-box; flex: none;"></div>')
    hrs = f'<span style="font-size: 15px; font-weight: 700; color: {INK};">{hours}</span>' if show_hours else ""
    return (f'<label style="display: flex; align-items: center; gap: 14px; padding: 10px 14px; border-radius: 16px; background: {bg}; {ring} cursor: pointer;">'
            f'<input type="checkbox" {"checked" if selected else ""} style="position: absolute; opacity: 0; width: 1px; height: 1px;">'
            f'{icon(name, color)}<span style="flex-grow: 1; font-size: 16px; font-weight: 700; color: {INK};">{name}</span>{hrs}{mark}</label>')

SEARCH = (f'<div style="display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 14px; border-radius: 14px; background: {SURF}; border: 1px solid {LINE};">'
          f'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="{MUTED}" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'
          f'<label style="flex-grow: 1; display: flex;"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden;">Search apps</span>'
          f'<input type="text" placeholder="Search apps" style="border: none; background: transparent; outline: none; font-family: inherit; font-size: 15px; color: {INK}; width: 100%;"></label></div>')

def counter(left, n):
    return (f'<div style="display: flex; align-items: center; justify-content: space-between;">'
            f'<span style="font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED};">{left}</span>'
            f'<span style="font-size: 13px; font-weight: 700; color: {RED}; background: {BLUSH}; padding: 5px 10px; border-radius: 999px;">{n} of 3 free</span></div>')

def speech(text):
    return (f'<div role="status" style="display: flex; align-items: center; gap: 10px;">{avatar()}'
            f'<div style="background: {INK}; color: #FFFFFF; font-size: 15px; font-weight: 700; padding: 10px 14px; border-radius: 16px 16px 16px 4px;">{text}</div></div>')

def button(label, enabled=True):
    st = f"background: {RED}; color: #FFFFFF;" if enabled else f"background: {LINE}; color: {MUTED};"
    return (f'<button type="button" {"" if enabled else "disabled"} style="width: 100%; height: 58px; border: none; border-radius: 18px; {st} '
            f'font-size: 18px; font-weight: 700; cursor: pointer;">{label}</button>')

def list_block(rows):
    return (f'<div style="flex-grow: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 10px; padding: 2px 24px; '
            f'-webkit-mask-image: linear-gradient(180deg, #000 85%, transparent 100%); mask-image: linear-gradient(180deg, #000 85%, transparent 100%);">{rows}</div>')

def header(title, sub):
    # Loop presents the list with both palms up; title centred under him
    return (f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 4px 24px 0;">'
            f'<img src="{PRESENT}" alt="Loop, palms up, presenting the damage" style="display: block; width: 290px; height: 218px; object-fit: contain; '
            f'-webkit-mask-image: linear-gradient(180deg, #000 88%, transparent 100%); mask-image: linear-gradient(180deg, #000 88%, transparent 100%);">'
            f'<h1 style="{TITLE} font-size: 30px; text-align: center;">{title}</h1><p style="{SUB} text-align: center;">{sub}</p></div>')

def main_screen(sel, reaction, n):
    rows = "".join(row(a, h, c, a in sel) for a, h, c in APPS)
    return f"""{header("Okay. Here's the damage.", "Pick up to 3. I'll keep an eye on them.")}
<div style="display: flex; flex-direction: column; gap: 14px; padding: 14px 24px 10px;">{SEARCH}{counter("Last 7 days", n)}</div>
{list_block(rows)}
<div style="display: flex; flex-direction: column; gap: 14px; padding: 8px 24px 28px;">{speech(reaction)}{button("Watch these")}</div>"""

# A — default: top 3 pre-selected, reaction to last tap
A = main_screen({"Instagram", "YouTube", "Snapchat"}, "Streaks don't count as a personality.", 3)

# B — tapped a 4th app: Premium sheet
sheet = f"""<div style="position: absolute; inset: 0; background: rgba(20, 20, 20, 0.45);"></div>
<div role="dialog" aria-label="Premium" style="position: absolute; left: 0; right: 0; bottom: 0; background: #FFFFFF; border-radius: 28px 28px 0 0; padding: 12px 24px 28px; display: flex; flex-direction: column; gap: 16px;">
<div style="width: 44px; height: 5px; border-radius: 3px; background: {LINE}; align-self: center;"></div>
<div style="display: flex; align-items: center; gap: 14px;">{avatar(56)}<h2 style="margin: 0; font-size: 26px; line-height: 1.1; color: {INK}; {DISPLAY}">Watching more than 3? That's Premium.</h2></div>
<p style="{SUB}">Free keeps an eye on 3 apps. Premium watches all of them.</p>
{button("See Premium")}
<button type="button" style="height: 48px; border: none; background: transparent; font-size: 16px; font-weight: 700; color: {MUTED}; cursor: pointer;">Maybe later</button>
</div>"""
B = main_screen({"Instagram", "YouTube", "Snapchat"}, "Interesting choice.", 3) + sheet

# C — Usage Access denied: no hours, usual suspects pinned
suspects = [a for a in APPS if a[0] in ("Instagram", "YouTube", "Snapchat", "X")]
others = [a for a in APPS if a not in suspects]
label = lambda t: f'<div style="font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: {MUTED}; padding-top: 6px;">{t}</div>'
rows_c = (label("Usual suspects") + "".join(row(a, h, c, a == "Instagram", False) for a, h, c in suspects)
          + label("All apps") + "".join(row(a, h, c, False, False) for a, h, c in others))
C_ = f"""{header("Which apps are ruining your life?", "Pick up to 3. I'll keep an eye on them.")}
<div style="display: flex; flex-direction: column; gap: 14px; padding: 14px 24px 10px;">{SEARCH}<div style="display: flex; justify-content: flex-end;"><span style="font-size: 13px; font-weight: 700; color: {RED}; background: {BLUSH}; padding: 5px 10px; border-radius: 999px;">1 of 3 free</span></div></div>
{list_block(rows_c)}
<div style="display: flex; flex-direction: column; gap: 14px; padding: 8px 24px 28px;">{speech("Classic.")}{button("Watch these")}</div>"""

frames = [
    ("S03-PickApps.dc.html", "Damage + top 3 pre-picked", A),
    ("S03-PickApps-B-Premium.dc.html", "4th app · Premium sheet", B),
    ("S03-PickApps-C-NoAccess.dc.html", "Usage Access denied", C_),
]
for f, t, inner in frames:
    write(f, screen(f"Pick apps · {t}", "#FFFFFF", brand_bar(3) + inner))

if __name__ == "__main__":
    add_row(2, "s03", "Screen 3 · The damage / pick apps", [(f, t) for f, t, _ in frames])
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _ in frames}))
