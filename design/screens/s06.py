import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

RED, INK, MUTED, SURF, LINE, BLUSH, CHILL, HEADS = C["red"], C["ink"], C["muted"], C["surface"], C["line"], C["blush"], C["chill"], C["heads"]
POSE = {"arms": "/_blob/6d99d55593a111201d89cc12d0e961e1", "peer": "/_blob/14efeff79f0551274251640f722df9b0",
        "ohno": "/_blob/8950d72307c4db383ade218ef377fbf4", "thug": "/_blob/b7acb3ccab47347e8ffb1eab9dd92bb8"}

ICONS = {
    "bell": '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    "layers": '<rect x="4" y="7" width="12" height="13" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4H18.5A1.5 1.5 0 0 1 20 5.5V15a1.5 1.5 0 0 1-1.5 1.5H16"/>',
    "battery": '<rect x="3" y="7" width="16" height="10" rx="2.5"/><path d="M21 10.5v3"/><path d="M7 10.5v3M10.5 10.5v3"/>',
}
CARDS = [
    ("bell", "Notifications", "So I can warn you before I get mean.", "Allow"),
    ("layers", "Display over apps", "So I can interrupt you mid-scroll. Rudely.", "Turn on"),
    ("battery", "Battery", "So your phone doesn't put me to sleep on the job.", "Fix it"),
]
TICK = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>')

def card(i, state, extra=""):
    ic, name, line, btn = CARDS[i]
    col = {"pending": MUTED, "active": RED, "done": CHILL, "skipped": HEADS}[state]
    border = {"pending": f"1px solid {LINE}", "active": f"2px solid {RED}", "done": f"1px solid {LINE}", "skipped": f"2px solid {HEADS}"}[state]
    bg = "#FFFFFF" if state in ("active", "skipped") else SURF
    op = "0.55" if state == "pending" else "1"
    if state == "done":
        right = (f'<div style="display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: {CHILL};">'
                 f'<span style="width: 26px; height: 26px; border-radius: 50%; background: {CHILL}; display: flex; align-items: center; justify-content: center;">{TICK}</span>Done</div>')
    else:
        filled = state == "active"
        right = (f'<button type="button" {"disabled" if state == "pending" else ""} style="height: 38px; padding: 0 16px; border-radius: 12px; '
                 f'border: {"none" if filled else "1.5px solid " + col}; background: {RED if filled else "#FFFFFF"}; color: {"#FFFFFF" if filled else col}; '
                 f'font-size: 14px; font-weight: 700; cursor: pointer; flex: none;">{btn}</button>')
    iconsvg = (f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="1.9" stroke-linecap="round" '
               f'stroke-linejoin="round" aria-hidden="true">{ICONS[ic]}</svg>')
    return (f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: 18px; border: {border}; background: {bg}; opacity: {op};">'
            f'<div style="display: flex; align-items: center; gap: 12px;">'
            f'<div style="width: 42px; height: 42px; border-radius: 12px; background: {BLUSH if state != "done" else "#E3F3EC"}; display: flex; align-items: center; justify-content: center; flex: none;">{iconsvg}</div>'
            f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 16px; font-weight: 700; color: {INK};">{name}</span>'
            f'<span style="font-size: 13px; line-height: 1.35; font-weight: 500; color: {MUTED};">{line}</span></div>{right}</div>{extra}</div>')

def brand_steps():
    return (f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 12px; background: {SURF}; font-size: 13px; line-height: 1.45; color: {INK};">'
            f'<span style="font-weight: 700;">On your Xiaomi phone</span>'
            f'<span>1. Battery saver → <b>No restrictions</b></span><span>2. Autostart → switch <b>Endloop</b> on</span></div>')

def warning():
    return (f'<div role="status" style="display: flex; gap: 10px; align-items: flex-start; background: #FFF3E0; border-radius: 14px; padding: 12px 14px;">'
            f'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{HEADS}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none; margin-top: 1px;"><path d="M12 4l9 16H3z"/><path d="M12 10v4"/><path d="M12 17.5h.01"/></svg>'
            f'<span style="font-size: 14px; line-height: 1.45; color: {INK};">Without this, I can only send notifications. Be honest, you\'ll ignore them.</span></div>')

def page(pose, states, ready, extra_after_cards="", battery_extra=""):
    cards = "".join(card(i, s, battery_extra if i == 2 else "") for i, s in enumerate(states))
    done = sum(s == "done" for s in states)
    btn_style = f"background: {RED}; color: #FFFFFF;" if ready else f"background: {LINE}; color: {MUTED};"
    return f"""{brand_bar(6)}
<div style="display: flex; align-items: flex-end; gap: 12px; padding: 8px 24px 0;">
<img src="{POSE[pose]}" alt="Loop, getting ready" style="display: block; width: 132px; height: 132px; object-fit: cover; flex: none; -webkit-mask-image: linear-gradient(180deg, #000 80%, transparent 100%); mask-image: linear-gradient(180deg, #000 80%, transparent 100%);">
<div style="display: flex; flex-direction: column; gap: 6px; padding-bottom: 10px;">
<h1 style="margin: 0; font-size: 28px; line-height: 1.08; color: {INK}; {DISPLAY}">3 quick things and I'm ready.</h1>
<span style="font-size: 14px; font-weight: 700; color: {RED if done < 3 else CHILL};">{done} of 3 done</span></div></div>
<div style="display: flex; flex-direction: column; gap: 10px; padding: 16px 24px 0;">{cards}{extra_after_cards}</div>
<div style="flex-grow: 1;"></div>
<div style="padding: 0 24px 28px;"><button type="button" {"" if ready else "disabled"} style="width: 100%; height: 58px; border: none; border-radius: 18px; {btn_style} font-size: 18px; font-weight: 700; cursor: pointer;">I'm ready</button></div>"""

frames = [
    ("S06-Permissions.dc.html", "Start · notifications first", page("arms", ["active", "pending", "pending"], False)),
    ("S06-Permissions-B-Overlay.dc.html", "1 done · display over apps lit", page("peer", ["done", "active", "pending"], False)),
    ("S06-Permissions-C-Skipped.dc.html", "Overlay skipped · battery with phone steps", page("ohno", ["done", "skipped", "active"], True, warning(), brand_steps())),
    ("S06-Permissions-D-Ready.dc.html", "All done · ready", page("thug", ["done", "done", "done"], True)),
]
for f, t, inner in frames:
    write(f, screen(f"Permissions · {t}", "#FFFFFF", inner))

if __name__ == "__main__":
    c = json.load(open(SAVED))
    y = 3672 + 2 * H + 120 + 380 + H + 380
    for i, (f, t, _) in enumerate(frames):
        c["boards"][f] = {"x": i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s06"] = {"kind": "title1", "x": 0, "y": y - 260, "text": "Screen 6 · Final permissions", "maxW": 4 * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print(json.dumps({f"project/{f}": f"project/{f}" for f, _, _ in frames}))
