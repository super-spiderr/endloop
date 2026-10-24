# Build status (28 Sep 2026; onboarding rows 21 Oct; D2 features 23 Oct)

Every screen below was designed on the canvas, approved, then built. "Built" means the code exists and typechecks/lints; **most of S08–S17 has not yet been tested on a real phone** (see 06-next-steps.md). Kotlin is only verified when Vignesh runs `npx expo run:android`.

Stack: Expo SDK 57 · React Native 0.86 · Expo Router (routes in `src/app`) · zustand + MMKV persist · reanimated · local Expo module `modules/endloop-core` (Kotlin). Android only for v1.

## Screens

| # | Screen | Where | Status / notes |
|---|---|---|---|
| OB 0 | Welcome (v2) | `onboarding/welcome.tsx` | Built 21 Oct, emulator-checked. Shared red background, excuse marquee behind Loop's sneak-in, "Here we go again." copy. |
| OB 1 | Pick your roaster + about you | `onboarding/roaster.tsx` | Built, emulator-checked. Animated `choose` poses, Loop ∣ Lupe; bottom sheet: English ∣ Tanglish, optional group (school/college/working/other). Replaces `name.tsx` (deleted). |
| OB 2 | Usage Access | `onboarding/usage-access.tsx` | Built, emulator-checked. Skips Settings when access is already on. |
| OB 3 | Reveal + what should I call you | `onboarding/reveal.tsx` | Built, emulator-checked. 7-day average, top app, band reaction; earned-title name sheet (skip = roaster picks). |
| OB 4 | Pick apps | `onboarding/pick-apps.tsx` | Built, emulator-checked. Top used apps pre-ticked, Endloop never listed; 4th app → Premium nudge (6 with test Premium). |
| OB 5 | Limits | `onboarding/limits.tsx` | Built, emulator-checked. Earning-Loops pill, Loops sheet, weekend nudge; Premium: weekend switch + tabs. Weekend limits apply on Saturday and Sunday (watcher `TrackedApp.limitMin` in `Store.kt`, JS `limitOn()`), 21 Oct. |
| OB 6a | Roast level | `onboarding/intensity.tsx` | Built, emulator-checked. Stage card + heat meter; white (Polite/Honest), red (Savage), black/gold (Unhinged, Premium). School: Unhinged locked. |
| OB 6b | Why are you here? | `onboarding/goal.tsx` | Built, emulator-checked. 6 goals + own words; Premium "★ ON" note. |
| OB 7 | Permissions | `onboarding/permissions.tsx` | Built, emulator-checked. Overlay + notifications (+ battery on listed brands, never named); syncs with the phone on replay; skipped: "Fine, allow it" / "Continue with notifications only". |
| OB 8 | Test roast + welcome bonus | `onboarding/finish.tsx` | Built, emulator-checked. Test roast with the user's numbers, then 100 Loops + 2 Leaves (grant stored only). |
| S17a | App icon ask | `onboarding/app-icon.tsx` | **Removed from onboarding** (moves to Settings, per 08); file kept. |
| S07 | Home | `src/app/(tabs)/today.tsx` | **Today v2 (21 Oct, canvas "Today v2", boards `TD2-*`):** streak · Loops · Leaves chips (Loops/Leaves show the welcome-bonus grant until the Loops system exists; chips don't open Attendance yet), "Next roast in…" line, goal line, one event card at a time (killed → fresh roasts → perfect day → how it works / day one), per-app streak (from 30-day history) and Earning label; "Test the roast" removed from Today. Premium Today built: black with red light from the top (no gold), the tab bar turns white; Premium users can switch Settings → Home look: Premium (default) or Classic (the white look). Earlier: built, tested (pose crop bug fixed 25 Sep). Moods: binoculars (first visit), chill, eyes-on-you (close), disgusted (over), unplugged (Usage Access lost). "Here's how it works" card + Test the roast. |
| S08 | Notifications | native: `Alerts.kt`, `Notifier.kt`, `Banner.kt` | Built. Heads up 75%, last call 90%, late night, one-time watcher explainer; rich banners drawn at runtime. **23 Oct (C8):** Sunday 7 pm is one notification: "Your week is in. Instagram ↓ 32%, YouTube ↑ 12%. And 240 Loops expire at midnight 👀" (swing from the native daily sums, Loops from the app); Saturday 10 am Loops reminder (`maybeLoops`, opens the Leave Letter at 200+ else Attendance; shares the Weekly switch). Loops reach the watcher via `settings.loopsNow` → config `loops` (only used for the matching week, so a stale count is never shown). Dev test buttons in Settings, including "Loops reminder". **Kotlin not compiled yet.** |
| S09 | Roast overlay | native: `RoastOverlay.kt`, `EnforcerService.kt` | Built, partly tested. Full-screen edge-to-edge overlay over the status bar, wordmark + share, word-by-word reveal, reopen escalation (<10 min), snoozes-used-up, share card, fact card. **Fix pending test:** apps that hide overlays (Files) → user is sent home so the roast shows. |
| S10 | Snooze friction | native: `RoastOverlay.kt` | Built, partly tested. 1 convince (reason chips) → 2 type the sentence (no paste, no suggestions, green/red letters) → 3 10 s wait with a fact → ready. Backed out = a win (proud screen 1.8 s). Max 2 snoozes/app/day; 2nd wait 20 s. |
| S11 | App detail | `src/app/app/[pkg].tsx` | Built, **untested**. Usage chart, time-of-day parts, opens, longest session, limit edit (lower = now, raise = tomorrow), stop tracking (from tomorrow). |
| S19 | Report Card (was Stats) | `src/app/(tabs)/stats.tsx`, `lib/report.ts` | **Rewritten 23 Oct**, web-preview checked. Week: won/lost hero (popcorn / head shake + weekly roast), bars with the normal line, per app vs normal, most used excuse (air quotes), tiles, weakest-hour strip (locked for Free → `worst-hour` sheet). Month (Premium): tiles, 30-day trend, weakest hour, worst/best weekday, past weeks. First week: drumroll. Tab label "Report Card". |
| S25 | Weekly roast v2 | `src/app/weekly.tsx`, `lib/weekly.ts` | **Rewritten 23 Oct**, web-preview checked. Story cards, tap left third to go back: Cover → Skyline (week bars, normal line, worst day tag, hatched "switched off" days from `offGaps`) → Podium (app ranks, % vs last week, rebound line) → Excuse of the week (REJECTED stamps; skipped if none) → Receipt (time won back per app) → Loops last call (countdown to Sunday midnight, where they came from, Write a Leave Letter at 200+; week-one carry-over copy) → Share (S21-D card preview, hide app names). Opened by `endloop://weekly`. |
| S14 | Settings | `src/app/(tabs)/settings.tsx`, `src/app/prefs/*`, `components/settings-ui.tsx`, `components/roaster-sheet.tsx`, `privacy.tsx` | Built, **untested**. **Restructured 6 Oct:** main list = roaster card (opens a dark bottom sheet to switch) + Roasting / Apps and limits / Notifications / Permissions / App icon rows showing their current value, Pause for today, Privacy and data, About and help; each opens its own sub-screen in `prefs/`. Premium banner moved to the bottom. Roast level, roaster, language, sound (stored only), App icon row, limits, bedtime, weekly, pause for today, notification toggles, permission health, privacy page, delete all data, about. Dev: Test notifications, Replay onboarding. "Suggest a roast", Privacy policy, Terms show "Soon". |
| S20 | Paywall v2 | `src/app/paywall.tsx`, `lib/plans.ts`, `components/premium-sheet.tsx` | **Rewritten 23 Oct**, web-preview checked. LAUNCH PRICE pill, new benefit list, founding lifetime ₹299 (struck ₹499, "Founding member · first 500"; `FOUNDING` flag in `plans.ts`), headline + pose per entry point (`reason`: apps, unhinged, stats, archive, strict, worst-hour, half-day, game, ended); picking a plan swaps the pose (key = trial, crown = founding). Test builds: buy → Welcome (bow, "Try these first"); "Turn off test Premium" → Premium ended state (goodbye). `TEST_BUILD` now lives in `plans.ts`. **No real billing yet.** |
| S16 | Edge cases | mostly `today.tsx` | Built, **untested**: day one, no apps, phone killed the watcher (battery steps), paused (grey), every limit hit ("Done" meltdown state), perfect day (+N Loops), leave day, strict nudge, app uninstalled toast. Premium ended: paywall `reason=ended` state (keep-3 behaviour itself not built). |
| S18 | Attendance | `src/app/(tabs)/attendance.tsx`, `lib/attendance.ts`, `components/attendance-moments.tsx`, `leave-letter.tsx` | Built (batch 1), web-preview checked. Intro (AT2-D), Streak saver moment, milestones 3/7/14/30/100, no-apps view, Leave Letter with Premium half day (½ unit, from 6 pm, 100 Loops). `weekLoops` (Mon–Sun Loops) added 23 Oct. Share buttons now use the native S21 cards. |
| S21 | Share cards | native `ShareCard.kt` (`shareCard(json, share)`), `lib/share-cards.ts` | **Built 23 Oct, Kotlin not compiled.** Square 1080×1080 cards to the S21 specs: A roast (eyebrow adds "· 3RD TIME TODAY" from the 2nd roast), B milestone (cream, big red number, rare smile), C leave letter (blush, letter card + rotated APPROVED stamp, slow clap), D weekly (dark, time won back, two biggest app swings, rebound line). New drawables: `endloop_{loop,lupe}_rare_smile.webp`, `endloop_wordmark_ink.xml`. Off Android a text share stands in. `weeklyCard` was replaced by `shareCard`. |
| Snooze ladder | "5 more minutes" | `src/app/snooze.tsx`, `components/snooze-games.tsx`, `snooze-ui.tsx`, `content/snooze.ts`; native `openLadder` | Built (batch 1), web-preview checked; **native hand-off not compiled.** Convince → reply → game (Catch, Quick draw, Swipe, RPS; fallback timer) → cool-off → Bunk / timeout / pay it back; Strict wall; your own words. |
| S24 | Apps & limits | `src/app/prefs/limits.tsx`, `src/app/app/[pkg].tsx` | Built 23 Oct. Cards with today's use, bar, % of normal, Earning pill, add-app card (3/6). Edit limit: below-today confirm ("Roast me now" / "Apply from tomorrow"), Premium weekday/weekend split with anti-cheat (no raising the weekend limit on a weekend). |
| S26 | Snooze and Strict mode | `src/app/prefs/snooze.tsx` | Built 23 Oct. Strict mode ("Lock yourself in?" sheet, switching off waits until tomorrow), snooze 5/2 min, Hard mode, Your own words (90 chars). All Premium. Settings also has a hidden-in-production Testing group (Free/Premium switch) for dev builds and the preview APK (`EXPO_PUBLIC_TEST_BUILD=1` in `eas.json`). |
| S17 | App icon | `lib/app-icon.tsx`, `plugins/with-app-icons.js`, `AppIcon.kt` | Built, **untested**. Red default / Loop / Lupe launcher aliases; switch applied when the app goes to background. Needs `prebuild --clean`. |

## Poses in the app

`src/characters.ts` maps every `Pose` name to `assets/characters/{loop,lupe}/*.webp` (768×768, transparent). Done: S02–S07 poses for both characters (35 new images, 25 Sep). S08–S10 poses done for both roasters (28 Sep; peeking, sigh, pointer and eye-roll have no slot in the approved screens yet). S11 onward still reuse older poses until the new images are made; see 04-characters-and-poses.md.

## Not built yet

- Real purchases (RevenueCat + Play Console products) and restore. A `premium` flag exists; dev builds and the preview APK can flip it (paywall button or Settings → Testing). What happens to apps 4–6 when Premium ends is not built.
- Privacy policy / terms pages and feedback link (need a URL and an email).
- Roast sound (toggle is stored but nothing plays).
- Animated clips (planned last).
- Play Store listing assets, data-safety form.
- iOS (assessed; see 05).

## Device test list (23 Oct batch)

Kotlin from 20–23 Oct has not been compiled. First run `npx expo prebuild --clean && npx expo run:android` and send any build errors. Then:

1. **Roast escalation:** hit a limit 3 times in a day on one app. 2nd roast: "ROAST 2 OF TODAY · YOU CAME BACK", darker. 3rd: "3RD ROAST OF TODAY · SERIOUSLY?", meltdown pose, shake and heavy buzz.
2. **Snooze ladder:** tap "5 more minutes" on the roast. The app should open the snooze screen within a second and the roast should go away. Win a game → back in the app with the snooze. Bunk → no roasts for that app until midnight.
3. **Strict mode (test Premium):** turn it on in Settings → Snooze. After the 3rd snooze of the day the roast shows only "Fine. Close it." with the padlock.
4. **Half-day leave:** book one for today (Premium); after 6 pm no roasts.
5. **Pay it back:** choose it on the bunk step; tomorrow that app's limit is 15 minutes shorter (Apps & limits shows it).
6. **Share cards:** share a roast from the roast screen (with 2+ roasts today for the eyebrow), a milestone (Attendance), a Leave Letter, and the weekly card (Share and Save image). Check the layouts against `design/screens/new/S21-*`.
7. **Notifications:** Settings → Test notifications → "Weekly roast · Sunday" (should list app swings and Loops) and "Loops reminder · Saturday" (open Attendance once first).
8. **Report Card, weekly story, paywall states:** these were checked in the web preview only; check on the phone for layout and fonts.
