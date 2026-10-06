import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, SURF, LINE, BLUSH, CHILL = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"], C["chill"]
POSE = {"thug": "/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8", "polite": "/_blob/11a91c11030cb6b4340fb0f0fa4b8c42",
        "arms": "/_blob/6d99d55593a111201d89cc12d0e961e1"}
CLOSE = ('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">'
         '<path d="M6 6l12 12M18 6L6 18"/></svg>')
TICK = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M5 12l5 5 9-10"/></svg>')

def close_btn(dark=False):
    col = "#FFFFFF" if dark else INK
    bg = "rgba(255,255,255,0.14)" if dark else SURF
    return (f'<div style="display: flex; justify-content: flex-start; padding: 44px 16px 0;">'
            f'<button type="button" aria-label="Close" style="width: 44px; height: 44px; border: none; border-radius: 22px; background: {bg}; color: {col}; '
            f'display: flex; align-items: center; justify-content: center; cursor: pointer;">{CLOSE}</button></div>')

def head(pose, title, dark=False):
    col = "#FFFFFF" if dark else INK
    return (f'<div style="display: flex; align-items: flex-end; gap: 6px; padding: 0 20px 0 12px;">'
            f'<img src="{POSE[pose]}" alt="Loop, smug" style="width: 130px; height: 130px; object-fit: cover; object-position: 50% 0%; flex: none; '
            f'-webkit-mask-image: linear-gradient(180deg, #000 75%, transparent 100%); mask-image: linear-gradient(180deg, #000 75%, transparent 100%);">'
            f'<span style="padding-bottom: 18px; font-size: 28px; line-height: 1.08; color: {col}; {DISPLAY}">{title}</span></div>')

def benefits(dark=False):
    col = "#FFFFFF" if dark else INK
    mut = "rgba(255,255,255,0.7)" if dark else MUTED
    inc = [("Unlimited apps", "Free watches 3."), ("Unhinged mode", "The meanest level. Still never about looks or family."),
           ("Month view and full history", "Plus every past weekly roast.")]
    rows = "".join(f'<div style="display: flex; gap: 12px; align-items: flex-start;"><span style="width: 22px; height: 22px; border-radius: 11px; background: {RED}; flex: none; '
                   f'display: flex; align-items: center; justify-content: center; margin-top: 1px;">{TICK}</span>'
                   f'<div style="display: flex; flex-direction: column; gap: 1px;"><span style="font-size: 15px; font-weight: 700; color: {col};">{t}</span>'
                   f'<span style="font-size: 13px; font-weight: 500; color: {mut};">{d}</span></div></div>' for t, d in inc)
    soon = (f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 12px; border: 1px dashed {"rgba(255,255,255,0.3)" if dark else LINE};">'
            f'<span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: {mut};">COMING SOON</span>'
            f'<span style="font-size: 14px; font-weight: 600; color: {col};">AI roasts about your habits · more roasters · weekday and weekend limits</span></div>')
    return f'<div style="display: flex; flex-direction: column; gap: 12px; padding: 14px 24px 0;">{rows}{soon}</div>'

def plans(sel, dark=False):
    items = [("yearly", "Yearly", "₹699 / year", "₹58 a month · 7-day free trial", "Best value"),
             ("monthly", "Monthly", "₹99 / month", "Cancel anytime", None),
             ("lifetime", "Lifetime", "₹1,499 once", "Pay once, yours forever", None)]
    out = ""
    for k, name, price, sub, badge in items:
        on = k == sel
        bg = "#FFFFFF" if not dark else ("rgba(255,255,255,0.12)" if not on else "#FFFFFF")
        col = INK if (not dark or on) else "#FFFFFF"
        mut = MUTED if (not dark or on) else "rgba(255,255,255,0.7)"
        b = (f'<span style="position: absolute; top: -10px; right: 14px; font-size: 11px; font-weight: 700; color: #FFFFFF; background: {RED}; padding: 3px 9px; border-radius: 999px;">{badge}</span>') if badge else ""
        radio = (f'<span style="width: 22px; height: 22px; border-radius: 11px; box-sizing: border-box; border: {"7px solid " + RED if on else "2px solid " + ("rgba(255,255,255,0.4)" if dark else LINE)}; flex: none;"></span>')
        out += (f'<button type="button" role="radio" aria-checked="{"true" if on else "false"}" style="position: relative; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px; text-align: left; '
                f'border: 2px solid {RED if on else (LINE if not dark else "transparent")}; background: {bg}; cursor: pointer;">{b}{radio}'
                f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 16px; font-weight: 700; color: {col};">{name}</span>'
                f'<span style="font-size: 12px; font-weight: 500; color: {mut};">{sub}</span></div>'
                f'<span style="font-size: 15px; font-weight: 700; color: {col};">{price}</span></button>')
    return f'<div role="radiogroup" aria-label="Plans" style="display: flex; flex-direction: column; gap: 10px; padding: 20px 24px 0;">{out}</div>'

def cta(label, terms, dark=False):
    mut = "rgba(255,255,255,0.7)" if dark else MUTED
    links = " · ".join(f'<a href="#" style="color: {mut}; font-weight: 700; text-decoration: underline; text-underline-offset: 2px;">{l}</a>' for l in ("Restore purchase", "Terms", "Privacy"))
    return (f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 18px 24px 0;">'
            f'<button type="button" style="height: 58px; border: none; border-radius: 18px; background: {RED}; color: #FFFFFF; font-size: 18px; font-weight: 700; cursor: pointer;">{label}</button>'
            f'<span style="font-size: 12px; line-height: 1.45; font-weight: 500; color: {mut}; text-align: center;">{terms}</span>'
            f'<span style="font-size: 12px; text-align: center;">{links}</span></div>')

def loop_line(dark=False):
    col = "rgba(255,255,255,0.85)" if dark else INK
    return (f'<div style="display: flex; justify-content: center; padding: 16px 24px 28px;"><span style="font-size: 15px; font-weight: 700; color: {col}; text-align: center;">'
            f'"Paying to scroll less. Honestly? That\'s growth."</span></div>')

TRIAL = "Free for 7 days, then ₹699/year. Cancel anytime in Play Store before day 7 and you won't be charged."

A = close_btn() + head("thug", "Watching more than 3 apps? Go unlimited.") + benefits() + plans("yearly") + cta("Start 7-day free trial", TRIAL) + loop_line()
A_H = 1180
B = close_btn(True) + head("thug", "You want it meaner? Respect.", True) + benefits(True) + plans("yearly", True) + cta("Start 7-day free trial", TRIAL, True) + loop_line(True)
C_ = close_btn() + head("arms", "The long game is Premium.") + benefits() + plans("lifetime") + cta("Buy lifetime · ₹1,499", "One payment of ₹1,499. No subscription, nothing to cancel.") + loop_line()
D = (f'<div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: 0 28px;">'
     f'<img src="{POSE["polite"]}" alt="Loop, quietly proud" style="align-self: center; width: 240px; height: 240px; object-fit: cover; object-position: 50% 0%; '
     f'-webkit-mask-image: linear-gradient(180deg, #000 75%, transparent 100%); mask-image: linear-gradient(180deg, #000 75%, transparent 100%);">'
     f'<span style="font-size: 13px; font-weight: 700; letter-spacing: 1.2px; color: {RED};">YOU\'RE PREMIUM</span>'
     f'<span style="font-size: 34px; line-height: 1.05; color: {INK}; {DISPLAY}">Paying to scroll less. Honestly? That\'s growth.</span>'
     f'<span style="font-size: 15px; line-height: 1.45; font-weight: 500; color: {MUTED};">Your free trial runs until [DATE]. Cancel anytime in Play Store. Watch as many apps as you like.</span>'
     f'<button type="button" style="height: 58px; border: none; border-radius: 18px; background: {RED}; color: #FFFFFF; font-size: 18px; font-weight: 700; cursor: pointer;">Add more apps</button></div>')

frames = [
    ("S15-Paywall.dc.html", "4th app · yearly + trial (default)", A, A_H, "#FFFFFF"),
    ("S15-Paywall-B-Unhinged.dc.html", "From Unhinged · dark", B, A_H, "#140A0B"),
    ("S15-Paywall-C-Lifetime.dc.html", "Month view · lifetime picked", C_, A_H, "#FFFFFF"),
    ("S15-Paywall-D-Welcome.dc.html", "After purchase · welcome", D, H, "#FFFFFF"),
]

def full(title, inner, h, bg):
    html = screen(title, bg, inner)
    return html.replace(f"height: {H}px; background: {bg}", f"height: {h}px; background: {bg}").replace(f'"height":{H}', f'"height":{h}')

for f, t, inner, h, bg in frames:
    write(f, full(f"Paywall · {t}", inner, h, bg))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 18548 + 2200 + 380  # below Screen 14 (its first board is 2200 tall)
    for i, (f, t, _, h, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": h, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s15"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 15 · Premium paywall", "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, *_ in frames}))
