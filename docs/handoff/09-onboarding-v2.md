# 09 · Onboarding v2: designs, decisions and build progress (21 Oct 2026)

Written so a new chat can continue the onboarding build without the original conversation. Read after `README.md` and `08-product-book.md`. Where this file and 08 disagree on onboarding, **this file wins** (decisions below were made on 21 Oct, after 08 was exported).

## Where things are

| What | Where |
|---|---|
| Approved screen designs | Design canvas "Endloop Screens" (https://claude.ai/artifact/CRJ4a1sUUDktx9zDk26baG), column **"Onboarding v2"** to the right of the old screens. Boards are named `OB2-<step>-…` (e.g. `OB2-03-Reveal-B-Numbers.dc.html`). Read them with the Artifact tool (`action: "read"`, `path: "project/OB2-….dc.html"`). |
| Every line of copy (EN + Tanglish), with IDs | `docs/content/C4-onboarding.md` (draft 2 + later edits). Vignesh edited several lines himself; the doc is the source of truth for wording. |
| New animated chooser poses | `assets/characters/{loop,lupe}/choose.webp` (640 px animated WebP, alpha), pose key `choose` in `src/characters.ts`. |
| Old onboarding (being replaced) | `src/app/onboarding/{welcome,name,usage-access,pick-apps,intensity,limits,permissions,app-icon}.tsx` |
| Other session work | Bug fixes + PiP fix committed and pushed as `b25f1bc` (21 Oct). **PiP fix still needs a test on Vignesh's Vivo** (on hold until the end). |

## The new flow (approved screen by screen on 21 Oct)

| # | Screen | Look | Notes |
|---|---|---|---|
| 0 | **Welcome** (v2 since 21 Oct; canvas row "Step 0", boards `OB2-00-Welcome*`) | red (shared red background), big faint loop, 4-row excuse marquee behind Loop | "Here we go again." · patient line · "Okay doc. Roast me." → 1a |
| 1a | **Pick your roaster** | full-screen red spotlight | animated `choose` pose full width, name 40 px, one-line description, italic roaster line, Loop ∣ Lupe pill switch, white button "Roast me, Loop/Lupe" |
| 1b | **A bit about you** | white bottom sheet over 1a (dimmed) | "Roast me in" English ∣ Tanglish segmented; "Which one are you? · Optional" 2×2 chips (School student, College student, Working, Other); roaster avatar + reaction line; "Let's go" |
| 2 | **Usage Access** | white | peer pose, title is a roaster line, privacy line, Settings preview card; back-without-granting state (Lupe arms crossed, help card incl. restricted settings); granted state (oh-no, progress bar "Reading your last 7 days…", auto-advance) |
| 3 | **The reveal** | red spotlight | drumroll (stand-in pose `waiting`) → numbers: big daily average, top-app card with year line, reaction pose (`jawDrop`; Lupe `dramatic` for 6 h+), band reaction line, "This is your normal. Stay under it and you earn Loops.", "Okay, that's bad" |
| 3b | **What should I call you?** | white bottom sheet over the reveal | 3 earned-title chips + "Or your own name" field, reaction line, "That's me", link "Skip. You pick one for me." |
| 4 | **Pick apps** | white | top 3 pre-ticked, list with daily averages, "3 of 3"; 4th app → white bottom sheet Premium nudge (Lupe `vip`); no Usage Access → blind pose, search, installed apps |
| 5 | **Limits** | white | one card per app: "Your normal", limit, slider with a "normal" mark, pill 🪙 Earning Loops / ⛔ Not earning; locked row "Different limits on weekends ★ Premium" (→ Premium sheet); ⓘ "What are Loops?" (→ explainer sheet); reaction line; "Set my limits" |
| 6a | **Roast level** | **look follows the level** (21 Oct): white for Polite/Honest, red gradient for Savage, black and gold for Unhinged. Canvas row "Step 6a v2" (boards `OB2-06a-v2-*`) | Polite / Honest / Savage / Unhinged (★ Premium, locked; school students: LOCKED, no nudge, default Honest); pose per level; "Your first roast" preview card with the user's numbers; Unhinged tap → Premium sheet (`evilGrin`) |
| 6b | **Why are you here?** | white (was red; changed 21 Oct) | 6 radio rows (Exams / studies, Better sleep, Focus at work, Family time, Just checking how bad it is, In my own words + text field), reaction line, gold hint "★ Premium: I'll throw this back at you when you try to snooze.", "That's why" |
| 7 | **Permissions** | white | cards: Display over other apps, Notifications, Battery (only on aggressive brands; **never name the brand**); skipped-overlay state; all-done "All set, {name}. Let's test it." → "Roast me now" |
| 8a | **Test roast** | red spotlight | real roast look with chip "Test roast · this one's free", user's numbers, "Fine. Close it.", note "The real one also lets you snooze. It'll cost you." |
| 8b | **Welcome bonus** | red spotlight | party pose (stand-in for gift box P3), roaster line with {name}, tiles 100 Loops + 2 Leaves, explainer, "Day 1 starts now" → Today |

The app-icon ask (old S17a) is **removed from onboarding** (moves to Settings, per 08).

### Visual rules (approved)
- Clean and small: titles 22–24 px Clash Display, body 13–14 px Satoshi, section labels 11 px uppercase grey, buttons 54 px tall / radius 16, cards 1 px `#EDE3E4` border / radius 16, selected = red outline or solid red.
- **Red screens** (1a, 1b behind the sheet, 3, 3b behind the sheet, 8a, 8b; 6a and 6b are white since 21 Oct) use `#7A0A1A → #5C0714 → #3D040D` vertical with a red glow from the top and **one big faint infinity loop as in board `OB2-BG-3-Motif`** (loop ~1.7× screen width, white 10%, tilted −14°, bleeding off both sides). **No coral spotlight behind the character** (Vignesh removed it on 21 Oct, after the first build). Film grain isn't in the app. White text, translucent white cards, white primary button with red text.
- Bottom sheets are always white, rounded 24 px top, grab handle.
- Premium accents are gold (`#E8A317`, text `#8A5A00`), dashed outline when locked.

## Decisions made on 21 Oct (not in 08 yet)
1. Step 1 split: full-screen roaster chooser + "about you" bottom sheet (language + group). Roaster and language moved to the front.
2. **Nickname moved to step 3b** (after the reveal) with earned titles (Doomscroller, Reel Researcher, Night Owl, Binge Boss, Last Seen Legend, … table in C4). **Skipping = the roaster picks one** (first earned title; no Usage Access → "Mystery Scroller"). There is always a {name}; "Boss" is never a placeholder.
3. {name} is used from step 7 on (all-done title, test roast, welcome bonus).
4. Battery copy never names the phone brand.
5. Premium in onboarding: nudges only (4th app, weekend limits, Unhinged, own-words-at-snooze), each a white sheet with roaster copy, "See Premium" → existing `/paywall`, "Maybe later". **Premium-only features are not built yet** ("keep open"): 6 apps, weekend limits, Unhinged unlocked. Designs for the Premium user exist (OB2-05-Limits-F-Premium6, OB2-06a-Level-E-Premium, OB2-06b-Goal-C-Premium).
6. Same welcome bonus for Free and Premium (Premium never more lenient).
7. Funnier copy everywhere (C4 has the final lines). Vignesh's own lines: Loop "I don't do motivation quotes. I do roasts."; Tanglish 6 h+ "Un phone-ku daily charging podra… un life-ku mattum eppo bro recharge poda pora?"; 4th-app nudge "Moonu app podhuma? 😏 / Premium vaangunga, enga kitta 6 apps irukku! …"; Lupe test roast "Instagram limit mudinjiduchu boss! 😂 Inime "innoru reel mattum" nu kenja pora face-a ippave practice pannunga."

### Still open (use these defaults until Vignesh decides)
- Apps under 15 min/day earning no Loops: **not built** (default: no rule).
- Goal list by group (e.g. hide "Focus at work" for school): **default: same list for everyone**.
- Low-use-app reaction lines (C4-style, listed in chat): optional extra.
- Poses P1 drumroll, P2 chin on hand, P3 gift box not drawn yet; stand-ins: `waiting`, `thinking`, `party`.

## Build plan and progress

Files so far: `src/content/onboarding.ts` (lines + `say()`, titles, bands), `src/components/onboarding-ui.tsx` (SpotlightScreen, StepBar (8 steps), Heading, Label, Quote, PremiumTag, NudgeSheet, `btn`), `src/app/onboarding/roaster.tsx` (1a + 1b sheet), `reveal.tsx` (3 + 3b sheet). Flow: welcome → roaster → usage-access → reveal → pick-apps → limits → intensity → goal → permissions → finish (8a+8b) → today. Static poses on red screens use `FadedPose` (SVG mask fade); the animated `choose` poses have the fade baked into the WebP (scratchpad script `make.py`: key green, crop y0 loop 70 / lupe 100, 640 px, 12 fps, bottom 22% alpha ramp, Loop ping-pong). Film grain from the canvas isn't in the app (react-native-svg has no noise filter).
Tick these as they land. Premium-only behaviour stays out.

- [x] Settings store: `group?`, `goal?` (+ `goalText?`), `nameAuto?` (title picked for them), `welcomeBonus` / `loops` + `leaves` grant record (Loops & Leaves system isn't built; just store the grant), `baselineDailyMin` from the reveal, per-app `avgDailyMin` already exists.
- [x] Copy module `src/content/onboarding.ts` with EN/TA lines from C4 and a `line(id, lang, vars)` helper that never returns raw `{placeholders}`.
- [x] Shared UI: red spotlight background component, white bottom sheet component, earned-title calculator.
- [x] 1a roaster chooser + 1b about-you sheet (replaces `welcome` button target and `name.tsx`; `intensity.tsx` loses roaster/language)
- [x] 2 Usage Access restyle + new lines
- [x] 3 reveal (new) + 3b name sheet (new)
- [x] 4 pick apps restyle + Premium sheet
- [x] 5 limits restyle + Loops sheet + weekend Premium sheet
- [x] 6a level (red) + Unhinged sheet + school lock; 6b goal (new)
- [x] 7 permissions restyle (no brand), {name}
- [x] 8a test roast (uses the native test roast if available) + 8b welcome bonus (new) → Today
- [x] Remove app-icon step from the flow; keep the screen file for Settings use
- [x] Privacy: add group + goal (and earned-title nickname) to `site/privacy.html` (date) and the in-app "What Endloop can see" page (`src/app/privacy.tsx`)
- [x] `npx tsc --noEmit`, `npx expo lint` pass (21 Oct)
- [ ] Emulator check: steps 1a, 1b, 2, 3 (numbers + no-access), 3b, 4, 5, 6a, 6b looked right on 21 Oct. Second pass (21 Oct, evening): 3b pick + skip, 4th-app nudge → paywall → back, weekend nudge, Loops sheet, school lock, 7 (all-done + one-revoked), 8a test roast all look right. **Still not seen on screen: 8b welcome bonus, Unhinged Premium nudge (non-school), 7 skipped-overlay state, 7 battery card (needs a listed brand).**
  - Fixed in that pass: white screens after a red one had white (invisible) status-bar icons (`RedStatusBar` in `onboarding-ui.tsx`, focus-aware); "Show me the damage" no longer sends you to Settings when Usage Access is already on; permissions re-sync both ways on open/return (a permission revoked since the last run is asked again on replay); permissions title counts what's left ("One more thing…"); "★ Premium" pill text was clipped; `InfoIcon` drew "!" instead of "i"; red background changed to the BG-3 big loop, spotlight removed.
  - Open for Vignesh: paywall still says "Unlimited apps" while the onboarding nudge and decision 5 say Premium watches 6; the under-1 h reveal ("basically a monk") still gets the jaw-drop pose and "Okay, that's bad" button (as C4 says).
- [x] Round 3 (21 Oct, Vignesh's feedback): 6a and 6b moved to white; roaster pose zoomed out; reveal drumroll padded; Endloop itself filtered out of every app list (`usage.listApps`, by package or label); pick-apps pre-ticks only apps used this week.
- [x] **Test Premium (dev builds only)**: `premium` in the settings store. In `__DEV__` the paywall's main button switches it on and closes ("Turn off test Premium" when on; off also drops Unhinged to Savage). Release builds never set it (no Play Billing yet). With it on: pick apps allows 6 (no nudge, "★ Premium" badge); limits shows the badge, the "Six apps…" title when more than 3 apps, a weekend switch and Weekdays/Weekends tabs (`TrackedApp.weekendLimitMin`, `weekendLimits`; **stored only, the watcher doesn't enforce weekend limits yet**); 6a unlocks Unhinged (never for school) with its title and preview; 6b shows "★ ON" and the own-words Premium line; Settings → Roasting unlocks Unhinged. `Intensity` now includes `'unhinged'`; `toneOf()` maps it to Savage where only three tones exist (fact cards, app-detail tips, the native roast image name).
- [x] 6a v2 built (21 Oct): big "stage" card (level name 44 px, chillies, 4-step heat meter, one-line meaning, roaster pose), 76 px level cards, first roast as a speech bubble from the roaster; background crossfades per level; Unhinged gets a gold button. Seen on the emulator: Honest (white), Savage (red), Unhinged (gold). Not seen yet: Polite, the locked Unhinged card on Savage, school note.
- [x] Welcome v2 built (21 Oct): shared red background, marquee (4 tilted rows, alternate directions, still with Reduce motion), new copy. Seen on the emulator. The chest fade is painted in the background colour, so the marquee and the big loop are kept above it (a real alpha mask would need masked-view as a direct dependency + native rebuild).
- [ ] Not yet looked at on screen after round 3: 6a and 6b on white (Free and Premium), roaster zoom, reveal drumroll padding.
- [x] Emulator pass 4 (21 Oct, late): paywall (6 apps copy), 6a Free on Polite/Honest/Savage + locked Unhinged + Unhinged nudge (Lupe, Tanglish), school lock + note, 6b white with own words, 7 one-left title + skipped-overlay state, 8a test roast, 8b welcome bonus, Welcome v2 (no big loop on this screen; marquee between wordmark and chest fade), roaster, reveal drumroll (padding + centred headline). All look right.
  - Decided 21 Oct: Premium = up to 6 apps (paywall, Premium sheet and website say so now); the under-1 h "monk" reveal stays as is.
  - After skipping the overlay, C4 says the main button should read "Fine, allow it" with a link "Continue with notifications only"; the app shows "Roast me now". The roaster clip is a head crop, so showing more body needs a re-export from the source video.
- [ ] Vignesh tests on device (`npx expo run:android`, Settings → Replay onboarding)
- [ ] Update `02-build-status.md`, `06-next-steps.md` and 08 (onboarding section) once built

## Notes for whoever continues
- The canvas mockups were generated with throwaway Python scripts in a session scratchpad (not in the repo). To change a board, read it from the canvas, edit the HTML, publish to the same URL (re-read `project/canvas.json` before sending it).
- Commit only when Vignesh asks; Super Spider identity (`189033162+super-spiderr@users.noreply.github.com`). `git push` from Claude was blocked by the permission classifier last time; Vignesh pushes.
- Shell has no `ANDROID_HOME`; prefix Gradle/expo run commands with `ANDROID_HOME=~/Library/Android/sdk`.
