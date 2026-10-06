# Session handoff · 28–29 Sep 2026

Paste this into a new chat (or say "read docs/handoff/07-session-29-sep.md") to continue. Read `docs/handoff/README.md` first as usual.

## What was done

**Poses (the big one).** Every character image had squashed, wide faces. All poses were regenerated in ChatGPT via Claude in Chrome, with the onboarding still attached as the reference each time, and checked side by side before keeping.

| Screens | Loop | Lupe |
|---|---|---|
| S01–S11 | ✅ all (48 files incl. idle, sneak-in) | ✅ all (47 files incl. idle) |
| S12 flex, head in hands, notes | ✅ | ❌ uses nearest pose |
| S13 jaw drop, head shake, hand on heart, selfie | ✅ | ❌ uses nearest pose |
| S14 side-eye, dramatic, stretching, shh | ✅ | ❌ uses nearest pose |
| S15 evil grin, chess | ✅ | ❌ uses nearest pose |
| S15 bow | ❌ (may exist unsaved in the last ChatGPT chat) | ❌ |
| S16 bored, asleep, fuming, party popper, impressed, goodbye | ❌ | ❌ |
| S17 frame | ❌ | ❌ |

Remaining: 29 images (Loop 8, Lupe 21). Stopped because the ChatGPT image limit ran out. Prompts for all of them are in `04-characters-and-poses.md`.

**How to generate the rest (rules that worked):**
- Fresh ChatGPT chat every ~8 images; attach `assets/characters/{loop,lupe}/idle.webp` (put on green) to *every* prompt.
- Prompt = proportions block (long oval face, narrow jaw, visible neck, slim build; do not widen/squash; no chibi) + "stylised 3D animated-film render as the reference, NOT photorealistic" + framing (portrait 2:3, head to just above the waist, green space above the cap and at both sides) + chroma green + the pose line.
- Keep the Chrome tab visible (hidden tabs stall sends/uploads).
- Process: `design/poses/process.py sources/<who>-<pose>.png <who> <pose> [--native]` (`--native` only for poses used by notifications / roast overlay). process.py now keeps head room, side room, low hands and raised hands in frame.

**Code changes (all typecheck + lint clean, Kotlin compiles; not yet tested on a phone):**
- Native (`Alerts.kt`, `EnforcerService.kt`, `RoastOverlay.kt`): S08 notifications, S09 reopened/snoozes-used-up, S10 convince/stopwatch/fine-go/slow-clap use the new poses for both roasters; the countdown ring face switches to "fine, go" at zero.
- `src/characters.ts`: new pose keys for S11–S15. Lupe's S12–S15 point at her nearest existing pose (commented) until her images exist.
- S11 app detail: time-of-day bubble (coffee / desk slump / couch / yawning), edit limit (thumbs up / calendar), stop tracking (your call). Confiscate and high five have no slot yet.
- S12 stats (notes / flex / head in hands), S13 weekly (head shake / hand on heart), S14 settings sheets (side-eye / dramatic), home paused (stretching), S15 paywall (evil grin / chess).
- Jaw drop, selfie, shh: made but no slot on any screen yet.
- `src/components/ui.tsx`: `Sheet` wraps content in `GestureHandlerRootView` → the limit slider in the edit-limit sheet works on Android.
- S04 onboarding: roaster choice is now a "Your roaster · Change" button that opens a bottom sheet with two large cards. One-liners need Vignesh's approval: Loop "Deadpan. Has heard every excuse." / Lupe "Unimpressed. Sees right through you." Canvas S04 not updated yet.

**Design canvas:** new row "Screen 10 · Shorter snooze (proposal)" (first snooze = reason + 10 s wait, no typing; second = short sentence + 20 s). Awaiting approval, then build it in `RoastOverlay.kt` + shorter second-snooze sentences (EN + Tanglish).

## Next steps

1. Device test: `npx expo prebuild --clean && npx expo run:android` (native drawables changed). Check notifications (Settings → Test notifications), roast + snooze with a 5-min limit, both roasters, the S04 sheet, the edit-limit slider.
2. Approve/change the S10 shorter-snooze proposal and the S04 one-liners.
3. Animated clips: Vignesh will share a reference GIF per moment; describe its motion frame by frame and write a Flow image-to-video prompt (start frame = the approved still, green background, locked camera, 1–2 s, ends near the still). Never name the GIF's source or any film in prompts. Priority: S09 eye-roll → S10 stopwatch → S10 slow clap → S09 hands on hips → S01 sneak-in → S13 set → S16 Zzz / party popper → S15 bow.
4. When image credits are back: the 29 remaining poses, then wire S16/S17 and swap Lupe's placeholders.
5. Housekeeping: `~/Downloads` has hidden `.Q6L2SF6YDW…` temp files plus `loop-eye-roll-v2.png`, `loop-savage (1).png` (safe to delete). Nothing is committed.
