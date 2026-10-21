# Build status (28 Sep 2026; onboarding rows updated 21 Oct)

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
| S07 | Home | `src/app/(tabs)/today.tsx` | Built, tested (pose crop bug fixed 25 Sep). Moods: binoculars (first visit), chill, eyes-on-you (close), disgusted (over), unplugged (Usage Access lost). "Here's how it works" card + Test the roast. |
| S08 | Notifications | native: `Alerts.kt`, `Notifier.kt`, `Banner.kt` | Built. Heads up 75%, last call 90%, late night, weekly, one-time watcher explainer; rich banners drawn at runtime. Dev test buttons in Settings. New S08 poses for both roasters (28 Sep). |
| S09 | Roast overlay | native: `RoastOverlay.kt`, `EnforcerService.kt` | Built, partly tested. Full-screen edge-to-edge overlay over the status bar, wordmark + share, word-by-word reveal, reopen escalation (<10 min), snoozes-used-up, share card, fact card. **Fix pending test:** apps that hide overlays (Files) → user is sent home so the roast shows. |
| S10 | Snooze friction | native: `RoastOverlay.kt` | Built, partly tested. 1 convince (reason chips) → 2 type the sentence (no paste, no suggestions, green/red letters) → 3 10 s wait with a fact → ready. Backed out = a win (proud screen 1.8 s). Max 2 snoozes/app/day; 2nd wait 20 s. |
| S11 | App detail | `src/app/app/[pkg].tsx` | Built, **untested**. Usage chart, time-of-day parts, opens, longest session, limit edit (lower = now, raise = tomorrow), stop tracking (from tomorrow). |
| S12 | Stats | `src/app/(tabs)/stats.tsx` | Built, **untested**. Week view (month = Premium), baseline week, worse week. |
| S13 | Weekly roast | `src/app/weekly.tsx`, `lib/weekly.ts`, `ShareCard.kt` | Built, **untested**. Story-style pages; native 1080×1920 share card (Stories or save to Pictures/Endloop); bad-week hides app names. Opened by `endloop://weekly`. |
| S14 | Settings | `src/app/(tabs)/settings.tsx`, `src/app/prefs/*`, `components/settings-ui.tsx`, `components/roaster-sheet.tsx`, `privacy.tsx` | Built, **untested**. **Restructured 6 Oct:** main list = roaster card (opens a dark bottom sheet to switch) + Roasting / Apps and limits / Notifications / Permissions / App icon rows showing their current value, Pause for today, Privacy and data, About and help; each opens its own sub-screen in `prefs/`. Premium banner moved to the bottom. Roast level, roaster, language, sound (stored only), App icon row, limits, bedtime, weekly, pause for today, notification toggles, permission health, privacy page, delete all data, about. Dev: Test notifications, Replay onboarding. "Suggest a roast", Privacy policy, Terms show "Soon". |
| S15 | Paywall | `src/app/paywall.tsx`, `lib/plans.ts`, `components/premium-sheet.tsx` | UI built, **no real billing yet**. Launch prices (16 Oct): Yearly ₹199 (7-day trial) default, Monthly ₹39, Lifetime ₹499; founding ₹299 lifetime not shown yet. Welcome screen after purchase. |
| S16 | Edge cases | mostly `today.tsx` | Built, **untested**: day one, no apps, phone killed the watcher (battery steps), paused (grey), every limit hit, perfect day, app uninstalled toast. **Not built:** Premium ended → keep 3. |
| S17 | App icon | `lib/app-icon.tsx`, `plugins/with-app-icons.js`, `AppIcon.kt` | Built, **untested**. Red default / Loop / Lupe launcher aliases; switch applied when the app goes to background. Needs `prebuild --clean`. |

## Poses in the app

`src/characters.ts` maps every `Pose` name to `assets/characters/{loop,lupe}/*.webp` (768×768, transparent). Done: S02–S07 poses for both characters (35 new images, 25 Sep). S08–S10 poses done for both roasters (28 Sep; peeking, sigh, pointer and eye-roll have no slot in the approved screens yet). S11 onward still reuse older poses until the new images are made; see 04-characters-and-poses.md.

## Not built yet

- Real purchases (RevenueCat + Play Console products), restore, and the "Premium ended" state. A `premium` flag exists, but only dev builds can set it (paywall button), for testing the Premium screens.
- Privacy policy / terms pages and feedback link (need a URL and an email).
- Roast sound (toggle is stored but nothing plays).
- Animated clips (planned last).
- Play Store listing assets, data-safety form.
- iOS (assessed; see 05).
