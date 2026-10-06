"""Screen 10, shorter snooze (proposal, 28 Sep 2026).

First snooze: pick a reason → 10 s wait (no typing). Second snooze: reason → a short sentence to type → 20 s wait.
Boards sit to the right of the original S10 row so the two flows can be compared.
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from s10 import (POSE, ROASTED, loop, fact_card, top, head, primary, never_mind, bottom, chips, typed, field,
                 keyboard, ring, REASONS)

# Loop's S10 poses (uploaded to the canvas 28 Sep)
POSE.update(convince="/_blob/b7c42a41d6dead309cb4d88f2fdf28ea", stopwatch="/_blob/5f620b94ffe206227f87fbd50aafe660",
            fine_go="/_blob/3f6053dc7f1856c466ac78ac786830a6", slow_clap="/_blob/98a67c31d41856f38468b7265d4d202d",
            sigh="/_blob/84b322fbd9a1e98c8fe921468d454a37")

S2_SHORT = "One more. I learned nothing."
FACT = ("Every extra hour on your phone is linked to going to bed about 13 minutes later.", "Frontiers in Psychiatry, 2025", "WHILE YOU WAIT")

# 1st snooze · 1 of 2: pick a reason
A = (top(1, 2) + loop("convince", "Loop, chin on fist, waiting to be convinced", size=190) +
     head("5 MORE MINUTES?", "Oh? Convince me.", "Why do you need more Instagram? Pick one. Be honest, I'll know.", 34) +
     chips(REASONS, 1) + bottom(primary("Next"), never_mind()))

# 1st snooze · 2 of 2: straight to the wait
B = (top(2, 2) + ring(7, 10, "stopwatch") +
     head("FAIR ENOUGH. NOW WAIT.", "I'm staring. You're waiting.", None, 30) +
     '<div style="height: 16px;"></div>' + fact_card(*FACT) +
     bottom(primary("Give me 5 minutes · 7", enabled=False), never_mind()))

# Ready
C_ = (top(2, 2) + ring(0, 10, "fine_go") +
      head("FINE.", "Five minutes. I'm counting.", "When they're up, I'm back. With material.", 34) +
      bottom(primary("Give me 5 minutes"), never_mind()))

# 2nd snooze · 2 of 3: now you type (short)
D = (top(2, 3) + loop("sigh", "Loop, sighing", size=150) +
     head("SECOND SNOOZE", "This time, you type it.", "Then 20 seconds.", 28) +
     typed(S2_SHORT, 10) + field("One more. ") + '<div style="flex-grow: 1;"></div>' + keyboard())

# 2nd snooze · 3 of 3: 20 s
E = (top(3, 3) + ring(14, 20, "stopwatch") +
     head("TYPED. NOW WAIT.", "Twenty seconds this time.", None, 30) +
     '<div style="height: 16px;"></div>' + fact_card(*FACT) +
     bottom(primary("Give me 5 minutes · 14", enabled=False), never_mind()))

# Never mind: still a win
F = (top() + loop("slow_clap", "Loop, slow clapping", size=260) +
     head("CLOSED WITHOUT A FIGHT", "Look at you. Choosing yourself.", "That counts as a win. I'm writing it down.", 36) +
     bottom(primary("Back to my life")))

frames = [
    ("S10b-Short-A-Why.dc.html", "1st snooze · 1 of 2 · pick a reason", A),
    ("S10b-Short-B-Wait.dc.html", "1st snooze · 2 of 2 · 10 s, no typing", B),
    ("S10b-Short-C-Ready.dc.html", "Ready · Give me 5 minutes", C_),
    ("S10b-Short-D-SecondType.dc.html", "2nd snooze · now you type (short)", D),
    ("S10b-Short-E-SecondWait.dc.html", "2nd snooze · 20 s wait", E),
    ("S10b-Short-F-BackedOut.dc.html", "Never mind · slow clap, a win", F),
]
for f, t, inner in frames:
    write(f, screen(f"Snooze (short) · {t}", "#C20F24", inner, f"background: {ROASTED};"))

if __name__ == "__main__":
    # merge into a canvas.json read from the live canvas: python3 s10b.py <path to canvas.json>
    src = sys.argv[1]
    c = json.load(open(src))
    x0, y = 3690, 11980
    for i, (f, t, _) in enumerate(frames):
        c["boards"][f] = {"x": x0 + i * (W + 80), "y": y, "w": W, "h": H, "title": t}
        if f not in c["order"]:
            c["order"].append(f)
    c["notes"]["s10b"] = {"kind": "title1", "x": x0, "y": y - 260, "text": "Screen 10 · Shorter snooze (proposal)",
                          "maxW": len(frames) * (W + 80) - 80, "w": 240}
    json.dump(c, open(f"{ROOT}/project/canvas.json", "w"), indent=1)
    print("wrote", len(frames), "boards +", f"{ROOT}/project/canvas.json")
