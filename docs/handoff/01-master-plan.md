<!-- Exported from the "Endloop Master Plan" doc (https://claude.ai/code/artifact/30a79644-77d3-4506-8105-1c3a6efb5f5e) on 2026-09-28. The doc is the living source; this is a snapshot. -->


# Endloop Master Plan

2026-09-23 · Vignesh

Endloop is an Android-first screen-time limiter that roasts you when you hit your limit, fronted by Loop, a deadpan 3D character. English first, AI-personalised roasts and Tanglish later.

## Product foundation

**Positioning:** the screen-time app that roasts you instead of nagging you. Other blockers are calm and mindful; Endloop is funny, blunt and shareable.

**Target user:** 18–30 year olds in India who know they doomscroll, have tried or ignored Digital Wellbeing, and would rather be called out than lectured.

**Core loop:** set limits → gentle warnings at 75% and 90% → full-screen roast at 100% → close the app, or pay a friction cost to snooze → weekly roast report to share.

**v1 scope (launch)**

- Per-app limits for chosen apps, with a daily reset
- Warnings as rich notifications; full-screen roast overlay at the limit
- Snooze friction: type an embarrassing sentence, wait 10 seconds, max 2–3 snoozes per app per day
- Roast intensity setting: Polite, Honest, Savage
- Two roasters (Loop and Lupe) with still expressions and six animated moments
- Handwritten roast library in English (about 200) and Tanglish (about 100), bundled offline and updated from the cloud
- Home screen with today's usage in human terms, and a streak for "closed on first roast"
- Late-night nudge after a user-set time
- Weekly roast report card with share to Instagram Stories

**Not in v1:** iOS, AI roasts, Tamil script and other languages, more than two characters, accounts or login.

**Monetisation (from launch):** free users track up to 3 apps; Premium unlocks unlimited apps. Three covers the usual trio (Instagram, YouTube, Snapchat), so the free app is genuinely useful and ratings stay healthy; two would feel stingy. This means a paywall and Google Play Billing ship in v1 (about one extra week of work). Later Premium perks: AI personalised roasts, Savage+ mode, extra characters, deeper stats.

**Pricing to test:** a monthly plan, a yearly plan at a big discount, and a lifetime option. Indian users respond well to low monthly prices and lifetime deals; decided prices (25 Sep 2026): Monthly ₹99, Yearly ₹699 (about ₹58 a month, 41% off, 7-day free trial), Lifetime ₹1,499 (about 2.1× yearly). Test later through RevenueCat.

## Roadmap

About 14–16 weeks from today to a public Play Store launch, working solo part-time. Durations are estimates; adjust as you go.

| Phase | Weeks | What gets done | Done when |
|---|---|---|---|
| 0. Plan and assets | 1–3 | This doc, brand, colours, logo, Loop's mood clips, first 100 roasts, all screens designed | Every v1 screen is designed and the core clips are converted |
| 1. Native core | 4–6 | RN app shell, Kotlin usage module, foreground service, limit checks, roast overlay, permission flow | Opening Instagram past its limit shows the overlay on a real phone |
| 2. Full v1 app | 7–10 | All RN screens, animations, rich notifications, snooze friction, streaks, weekly report, settings | App is feature-complete for v1 |
| 3. Polish and test | 11–13 | Battery and OEM testing (Xiaomi, Samsung, Vivo), 200+ roasts, Play Store closed testing with 12+ testers for 14 days | Closed test passes with no crashes and good tester feedback |
| 4. Launch | 14–16 | Store listing, screenshots, privacy policy, launch reels, production release | Live on the Play Store |
| 5. v2 | After launch | Premium, AI roasts via backend, Tanglish, second character | Decided by launch data |

Note: new personal Play Console accounts must run a closed test with at least 12 testers for 14 days before production. Start recruiting testers during Phase 2.

**Production order (decided):** 1) master images for both characters (male Loop and a female roaster) → 2) still expressions for every screen need → 3) animated WebP only where a screen needs motion → repeat 2–3 for the second character → 4) logo and other brand assets → 5) build the app → 6) Play Store assets last.

## Tech stack

React Native is the control panel; Kotlin is the enforcer. The native side must work with the RN app asleep.

| Layer | Choice | Used for |
|---|---|---|
| App framework | Expo (latest SDK) with prebuild and a development build, TypeScript; native core as a local Expo module (modules/endloop-core, Kotlin); manifest and permissions via config plugins; EAS or local builds | All screens and settings |
| Navigation | Expo Router or React Navigation | Onboarding, tabs, modals |
| State | Zustand | UI state |
| Local storage | MMKV (shared with Kotlin) | Limits, roast cache, streaks, settings |
| Animation | Reanimated, Skia, Moti | Transitions, gradients, glitch effects |
| Character playback | expo-image (animated WebP) | Loop's mood clips in RN screens |
| Haptics | expo-haptics | Roast hits, sliders, snooze |
| UI strings | i18next + react-i18next | English now, other languages later |
| Share cards | react-native-view-shot + react-native-share | Weekly roast report to Stories |
| Usage tracking | Kotlin: UsageStatsManager | Per-app screen time, foreground app |
| Enforcement | Kotlin: foreground service | Limit checks, 75/90/100% triggers |
| Roast overlay | Kotlin: SYSTEM_ALERT_WINDOW + AnimatedImageDrawable | Full-screen roast that appears instantly |
| Notifications | Notifee (v1), Kotlin RemoteViews (later) | Warning, late-night and weekly notifications |
| Bridge | Expo Modules API (Kotlin) | RN reads usage, pushes limits and roasts |
| Backend (v2) | Fastify on Node, Postgres | Roast sync, AI roast generation, premium |
| AI (v2) | LLM via backend, daily batch per user | Personalised roasts from aggregated stats only |
| Analytics and crashes | Firebase Crashlytics + PostHog | Stability and funnel (permission drop-off) |
| Payments | RevenueCat on Google Play Billing | Premium subscription, unlimited apps, restore purchases |

**Permissions:** Usage Access, Display over other apps, Notifications, foreground service, ignore battery optimisation. Avoid the Accessibility Service; Play reviewers reject it for this kind of use.

**Repository:** , cloned at ~/superspider/endloop. Everything inside ~/superspider commits with the Super Spider identity and pushes with its own SSH key; always use SSH remotes for Super Spider repos. The Expo app is created inside this repo when development starts; a separate endloop-api repo follows in v2.

## Brand and theme

**Locked: Roast Red and White (option E).** Clean white screens with ink text, and one loud roast red for the brand, buttons and the limit-hit moment. Red is used sparingly on everyday screens so they never feel like error messages; it goes full strength only on the roast overlay and share cards.

**Core palette**

| Token | Hex | Use |
|---|---|---|
| Background | #FFFFFF | App background |
| Surface | #FFF4F5 | Cards, sheets |
| Line | #F1D9DC | Borders, empty bars |
| Ink | #141414 | Primary text |
| Muted | #5F5F5F | Secondary text |
| Roast Red | #E5132B | Brand accent, primary buttons, logo, Loop's earbud tips |
| Blush | #FFE3E6 | Chips, Loop's card, tinted backgrounds |
| Dark mode background | #140A0B | Dark theme base (later) |

**State colours (overlay, notification banners, usage bars)**

| State | Colour | When |
|---|---|---|
| Chill | #16895F | Under 75% of limit |
| Heads up | #B86E00 | 75–99% |
| Roasted | #F0263D → #7A0714 gradient | Limit hit: overlay, weekly card |
| Late night | #6B5BFF → #1B1464 gradient | After the bedtime nudge time |
| Proud | #F2EBDD → #FFB38A gradient | Streaks, closed on first roast |

**Typography**

- **Locked for English: Clash Display + Satoshi** (Fontshare, free for commercial use; keep the licence files in the app and confirm app embedding is covered when downloading).
- Display: Clash Display, Bold and Semibold, for roasts, big numbers and headlines (the logo itself uses Satoshi Bold). Sharp and premium with Roast Red.
- Body: Satoshi, Regular, Medium and Bold, for settings, labels and stats.
- Other languages: fonts switch dynamically per language through a typography theme. Tamil: Anek Tamil or Catamaran (test both); Hindi: Anek Devanagari. Indic scripts get a smaller size and more line height. Tanglish uses Clash + Satoshi.
- Bundle only the weights used. Roast text is always the biggest thing on screen: short lines, sentence case, no emoji inside the roast itself.

**Logo**

- Logo (locked): "endloop" in lowercase Satoshi Bold, ink #141414, with the "oo" replaced by one Roast Red infinity loop. The loop has a break at the top of its right half ("B3", the loop ending) and is tilted 8°. The letters are converted to outlines, so the logo never depends on the font being installed. On red it goes all white; in dark mode the letters go light and the loop stays red. Source: .
- App icon: the white broken loop on Roast Red, round and squircle. It reads down to 48 px. Loop's face moves to the splash screen, share cards and the Play Store graphic instead.
- Notification small icon: the same broken loop in plain white (Android requires a single-colour icon).

**Voice in the UI:** every system message is Loop talking. "I need to spy on you. For your own good." beats "Grant Usage Access permission."

### Theme options to choose from

The palette above is Option A. Pick one direction; state gradients stay the same in all of them so the colour code holds.

| Option | Background | Text | Accent | Second accent | Feel |
|---|---|---|---|---|---|
| A. Ink and Orange | #0E0E0F | #F2EBDD cream | #FF5A1F orange | #FF3D5A red | Premium streetwear; matches Loop's earbuds |
| B. Acid Brutal (light) | #F4F1EA off-white | #111111 ink | #E4FF3A acid yellow | #FF2E4D hot red | Meme poster, loud, very screenshot-friendly |
| C. Midnight Neon | #0B0A1A deep indigo | #EDEBFF lavender white | #B6FF3B neon lime | #FF3DCB magenta | Arcade and late night; feels like a game you're losing |
| D. Sage Deadpan | #10130F near-black green | #F2EBDD cream | #7A9A83 sage | #FF7A59 coral | Calm designer-toy look, closest to the original reference |
| E. Roast Red and White | #FFFFFF white (dark mode #140A0B) | #141414 ink | #E5132B roast red | #FFE3E6 blush tint | Loud and direct, like a warning label; risks every screen feeling like an error |
| F. Plum and White | #FBF8F7 warm white (dark mode #1A0E14) | #1C1016 plum black | #8E1B45 plum red | #F4E3EA plum tint | Premium and distinctive; sarcastic rather than alarming |

**Font pairings** (all free for commercial use; confirm each licence when downloading)

| Pairing | Display (roasts, numbers) | Body (UI) | Best with | Feel |
|---|---|---|---|---|
| 1 | Bricolage Grotesque ExtraBold | Inter | A or D | Quirky, loud, friendly |
| 2 | Clash Display Bold (Fontshare) | Satoshi (Fontshare) | A | Sharp, modern, premium |
| 3 | Anton | DM Sans | B | Condensed meme-poster headlines, huge roast text |
| 4 | Space Grotesk Bold | Space Mono for stats | C | Techy, scoreboard numbers |
| 5 | Syne ExtraBold | Manrope | A or C | Artsy and distinctive |

**D****ec****is****ion:** E, Roast Red and White, chosen after comparing all ten options as app screens on the Endloop Colour Explorations canvas. Font: Clash Display + Satoshi for English; Tamil and Hindi fonts switch dynamically later.

## Character: Loop the Deadpan

Loop is a bored, unimpressed young guy in a cream cap with an infinity emblem and red-tipped earbuds. He never yells; he is just quietly disappointed in you. The master image and the idle loop are done.

**Personality rules**

- Deadpan 90% of the time, so big reactions land harder.
- A real smile is rare and only earned by streaks.
- Roasts the habit, never the person's body, family, caste, religion or looks.
- Jokes use only his own props: cap and earbuds. No hands, no new objects.

**Signature moves:** the slow blink, the side-eye to camera, the earbud pull, the cap tip down.

**Clip list**

| Clip | Moment in the app | Length | Priority | Status |
|---|---|---|---|---|
| Idle (blink, glance, tilt) | Home screen, cards | 8s loop | v1 | Done |
| Eye roll + sigh | Limit hit overlay | 4s | v1 | To do |
| Earbud pull | Taps "5 more minutes" | 4s | v1 | To do |
| Slow head shake | Snoozes used up | 4s | v1 | To do |
| Yawn and jolt awake | Late night | 4s | v1 | To do |
| Slow nod and clap | Closed on first roast | 4s | v1 | To do |
| Suspicious squint | Close to limit, 15th app open | 4s | v1.1 | To do |
| Jaw drop, cap pops up | Huge screen time number | 4s | v1.1 | To do |
| Rare real smile | 7-day streak | 4s | v1.1 | To do |
| Cap over eyes | Third snooze | 4s | v1.1 | To do |
| Turns around slowly | Return after a bad day | 4s | v2 | To do |

**Colour lock****:** the palette is Roast Red and White. Next, regenerate the master image with Loop's earbud tips in Roast Red (#E5132B), keeping the cream cap, emblem and black tee as they are, then redo the idle clip from that master. Hold all reaction clips until the new master is done.

**Asset pipeline**

1. Master image on flat green, used as start and end frame in Google Flow (Veo 3.1).
2. Prompt: body and shoulders still, only head and face move, square 1:1 if available, 4 seconds.
3. Key the green, crop square, export animated WebP: 384px for cards, 512px for the overlay.
4. Still PNG of each mood for notification large icons.

**Size budget:** the 8-second idle came out at about 1 MB (384px) and 2 MB (512px) because the whole body breathes. Aim for under 500 KB per reaction clip by keeping clips to 4 seconds with a still body.

### Naming and future characters

Loop stays the name of the deadpan guy and the face of the brand, including the app icon, even after other characters arrive, the way Duo stays Duolingo's mascot while other characters have their own names. Each new roaster gets a short, easy-to-say name that hints at their personality.

| Name | Personality | Roast style | When |
|---|---|---|---|
| Loop | The Deadpan | Dry one-liners, quietly disappointed | v1 |
| Zara | The Sassy One | Dramatic, eye-rolls, "Babe. Put. It. Down." | v2, Premium |
| Amma | The Disappointed Mom | Guilt trips, food and marriage jokes; huge in Tanglish | With Tanglish |
| Coach Rex | The Shouting Coach | All-caps motivation, treats scrolling like skipping leg day | Later |
| Unit 9 | The Robot | Cold stats, "Efficiency: 3%" | Later |

In the app, the picker reads "Choose your roaster"; everything else talks about the selected character by name.

**Second roaster (locked): Lupe.** Launches in v1 alongside Loop. Same deadpan personality with her own flavour: drier, "I'm not even surprised." Both share one roast library; each gets a handful of signature lines of their own. Same brand uniform: cream cap with the infinity emblem, black tee, red-tipped earbuds; her hair visible below the cap tells them apart at small sizes. Loop and Lupe are inspired by Vignesh and his girlfriend (with her consent), stylised rather than portraits. Loop stays the brand face (app icon, splash, Welcome screen).

### Using the Flow clips

Google's Terms of Service say Google won't claim ownership of content you generate, and you keep the rights you have in it. So you can use the Flow clips in the app. The limits: don't use them to train other AI models, and don't present AI-generated content as human-made. Veo also adds an invisible SynthID watermark, which doesn't affect how the clips look.

One real gap: AI-generated images may not be protected by copyright, so someone could copy Loop's look. Protect what you can: register the Endloop name and logo as trademarks once the app gains traction, and keep your master files and prompts as a record of creation.

### Expression asset list (from the 16 screens)

Rule: stills everywhere by default, with small Reanimated motion (bounce, fade, slide). Animated WebP only for the six moments below, to keep the app light, fast and not distracting. Every item is made for both characters.

**Stills (PNG, transparent)**

| Expression | Used in |
|---|---|
| Neutral deadpan | Home default, Screen 3 corner, snooze countdown stare, notification large icon |
| Suspicious squint | Screen 2 Usage Access, heads-up notification banner, Home when close to limit |
| Shocked, jaw drop | Screen 2 "…oh no", Screen 3 damage reveal |
| Soft half-smile | Screen 4 Polite |
| Smirk, raised eyebrow | Screen 4 Savage, paywall, weekly roast banner |
| Getting ready (earbud in, determined) | Screen 6 permissions, last-call banner |
| Grudgingly proud | Screen 7 first visit, perfect day card, good-week report |
| Disgusted | Home over limits, every limit hit |
| Sleepy, yawning | Late-night banner, paused-day Home |
| Bored | No apps tracked |

**Animated WebP (4 seconds max, body still, head and face only)**

| Clip | Used in | Status (Loop) |
|---|---|---|
| Idle (blink, glance, tilt) | Home card, cards | Done (recolour earbuds) |
| Disappointed sigh | Screen 1 Welcome | To do |
| Eye roll and sigh | Screen 9 roast overlay | To do |
| Earbud pull | Screen 10 snooze | To do |
| Slow head shake | Snoozes used up, weekly reveal | To do |
| Proud nod | Close it, snooze abandoned | To do |

Total per character: 10 stills and 6 clips.

## UI screens and flows

The roast moment is the product; every other screen supports it.

The loop runs every day; the weekly report is the share moment that brings in new users.

| Screen | What it does | Key UX detail |
|---|---|---|
| Onboarding | Loop wakes up and calls you out | One tap, typing animation, no forms |
| Roast intensity | Polite, Honest or Savage | Loop's face changes as you slide |
| Pick apps | Grid of installed apps | Usual suspects pre-highlighted |
| Set limits | Slider per app | Loop reacts live to the number |
| Permissions | Usage Access, overlay, notifications | One card each in Loop's voice; auto-advance on return |
| Home | Today's total, Loop's mood, per-app bars | Numbers in human terms ("a whole movie") |
| App detail | Usage, opens, limit, snooze history | Edit limit inline |
| Roast overlay (native) | Full-screen roast at the limit | Big "Close it", tiny "5 more minutes", haptic hit |
| Snooze friction | Type the sentence, 10s wait | Each snooze makes the next roast harsher |
| Weekly report | Total, worst app, best streak, one roast | One tap share to Instagram Stories |
| Settings | Limits, intensity, bedtime, notifications | Plain and fast; Loop only in empty states |

**Notification styles**

| Type | Trigger | Look |
|---|---|---|
| Heads up | 75% of limit | Big picture banner, Heads up gradient, suspicious Loop |
| Last call | 90% of limit | Banner, Heads up gradient, stretching Loop |
| Late night | Tracked app opened after bedtime | Banner, Late night gradient, yawning Loop |
| Weekly roast | Sunday evening | Banner, Roasted gradient, "Brace yourself" |

At 100% there is no notification: the overlay takes over.

### Screen specs (locked one by one)

**Onboarding order:** 1 Welcome → 2 Usage Access → 3 The damage (pick apps) → 4 Roast intensity → 5 Set limits → 6 Overlay and notification permissions → 7 First home. Usage Access comes early so screen 3 can show the user's real hours.

**Onboarding header (approved):** screens 2 to 6 carry a slim top bar: the wordmark (about 92 px wide) on the left and six progress dots on the right, with the current step stretched into a pill. On the red Savage state it switches to the white wordmark and white dots. Welcome keeps its centred white wordmark.

#### Screen 1: Welcome (locked)

Shown once, on first launch only. Returning users go splash → Home. Its job: hook the user in 5 seconds and get one tap into setup.

**Splash:** system splash with a Roast Red background and Loop's face as the icon, so the app opens straight into red with no white flash.

| Time | What happens |
|---|---|
| 0.0s | Full Roast Red screen |
| 0.3s | Loop peeks in from the left edge, half his face, and freezes for a beat |
| 0.9s | He slides to the centre and gives a slow, disappointed sigh |
| 1.5s | "Oh. Another one." types out in big white Clash Display, a light haptic tick per word |
| 2.4s | Second line types: "Let me guess. You 'just checked Instagram' and lost 3 hours." |
| 3.4s | White button slides up, privacy line fades in under it |
| Tap | Slide transition to Screen 2 |

**Contents:** Loop (disappointed sigh clip, about 60% of screen width), headline, second line, one white button with red text, privacy line. No skip, no login.

**Mockup changes (approved):** Roast Red gradient background (#F0263D top, #E5132B middle, #9E0B1C bottom, soft glow behind Loop); the all-white wordmark at the top centre from the first frame; the sneak-in is one Flow clip (peek from the left edge, step to centre, sigh), keyed and exported as a play-once animated WebP at full screen width with the chest fading into the red. Lupe is not introduced here; a Lupe cameo can be tried later.

**Copy:** button "…yeah, that's me"; privacy line "No sign-up. Your screen time stays on your phone." The privacy line must be updated when AI roasts arrive in v2, since those send aggregated stats to the server (make AI roasts opt-in).

**Build notes:** the peek and slide are Reanimated animations on the transparent WebP, not AI video. Needs one new clip: disappointed sigh (4s, body still). Check that the red earbud tips still read against the red background.

**Marketing:** the sneak-in plus typing line is the opener for Reels and Shorts, and a candidate for Play Store screenshot #1 ("The screen-time app that roasts you"). The privacy line builds trust right before the permission screens.

**Track:** the percentage who tap the button; target above 90%.

#### Screen 2: Usage Access (locked)

Its job: get the one permission Endloop can't work without. Android requires a trip into Settings, so this is the biggest drop-off risk. White background from here on; red is kept for Welcome and roast moments.

**How it works**

1. Loop squints suspiciously. Title types in: "Let me see how bad it is."
2. One honest line: "I need Usage Access to count your screen time. I only see how long you use each app. Never your messages, photos or what you watch."
3. A short looping animation shows the Settings list with Endloop highlighted and the switch turning on.
4. Red button "Show me the damage" opens the Usage Access settings page; a toast there says "Find Endloop and switch it on."
5. On return, granted: Loop says "…oh no." and the app auto-advances to Screen 3, where hours count up like a scoreboard. Not granted: the screen shows "Didn't find it? It's under Endloop → Permit usage access" and the button again.
6. Small "Not now" link skips to Screen 3 without hours.

**Build notes:** check the permission every time the app resumes and advance automatically. Test the steps on Xiaomi, Realme and Vivo, whose Settings screens differ. Never force the permission.

**Mockup changes (approved):** Loop is a plain cut-out on white with his chest fading out (no circle behind him). Three static stills: the ask shows him peering over his glasses; back without granting shows arms crossed with a new title in his voice, "Nice try. Still can't see anything."; granted shows his hand over his mouth next to "…oh no.". The Settings preview is a small card with Endloop highlighted and its switch on. A Lupe cameo here (holding a magnifying glass) stays optional.

**Marketing:** stating what Endloop can't see removes the "spy app" fear; "Show me the damage" turns a system step into curiosity.

**Track:** grant rate (target above 70%) and how many need a second try.

#### Screen 3: The damage / pick apps (locked)

Its job: shock the user with real numbers, get them to choose apps to watch, and introduce the 3-app free limit softly.

**How it works**

1. Title types in: "Okay. Here's the damage." Subtitle: "Pick up to 3. I'll keep an eye on them." Loop sits small in a top corner, unimpressed.
2. List of the user's apps sorted by last week's usage, worst first: icon, name, hours.
3. Top 3 are pre-selected with a red ring and checkmark; the user can change them.
4. Loop reacts to each tap in a speech line at the bottom: Instagram "Classic.", YouTube "'Just one video.' Sure.", Snapchat "Streaks don't count as a personality.", others "Interesting choice."
5. Counter shows "2 of 3 free".
6. Tapping a 4th app slides up a sheet: "Watching more than 3? That's Premium." with "See Premium" and "Maybe later".
7. Button "Watch these" is disabled until at least 1 app is selected.

**If Usage Access was denied:** same screen without hours; title becomes "Which apps are ruining your life?" and common doomscroll apps are pinned at the top.

**Build notes:** declare a launcher-app query in the manifest to list installed apps; never request all-packages access. Hide system apps and Endloop itself. Search bar at the top for long lists.

**Mockup changes (approved):** Loop stands at the top presenting the list with both palms up (the deadpan "it's that simple" gesture), about 290 px wide, with the title centred under him; this replaces the small top-corner Loop. Selected apps get a red ring, pink fill and red check; Loop's reactions sit in a dark speech bubble above the button. The Premium sheet adds one line: "Free keeps an eye on 3 apps. Premium watches all of them." Mockups use lettered colour tiles instead of real app logos. Never name the creator of the gesture in the app or marketing.

**Marketing:** "Here's the damage" with real hours is the most shareable screen ("this app exposed me" Reels). Blur or replace other apps' icons in marketing images.

**Track:** average apps chosen; percentage who tap a 4th app (Premium demand).

#### Screen 4: Roast intensity (locked)

Its job: let users choose how harsh the roasts are, which doubles as consent, and deliver the first real roast using their own numbers.

**How it works**

1. Title types in: "How mean should I be?"
2. Loop large in the centre; below him a slider with snap points Polite · Honest · Savage, plus a locked fourth point "Unhinged" (Premium). Default: Honest.
3. Sliding changes Loop's face (soft half-smile, deadpan, raised-eyebrow smirk) and a live preview roast built from the user's top app and hours:
  - Polite: "14 hours on Instagram last week. Maybe a little less this week?"
  - Honest: "14 hours on Instagram. That's two workdays of other people's lives."
  - Savage: "14 hours on Instagram. Your thumb gets more exercise than you do."

4. Haptic tick at each snap; Savage adds a stronger buzz and a tiny screen shake. Tapping Unhinged opens the Premium sheet.
5. Note: "You can change this anytime in Settings."
6. Button: "Roast me like that".

**Roaster picker:** at the top of this screen, "Choose your roaster" shows Loop and Lupe side by side; tapping one plays its idle blink and switches the preview roast to that character. No gender question. Default: Loop. Changeable anytime in Settings (Your roaster). Every screen after this uses the chosen character.

**Build notes:** three still expressions of Loop with a Reanimated bounce on change; no new video. If Usage Access was skipped, the preview uses "Imagine 14 hours on Instagram. Now imagine it's you." Savage still follows the tone rules.

**Mockup changes (approved):** the slider is replaced by a chilli heat meter: four buttons, Polite (1 chilli), Honest (2), Savage (3) and Unhinged (locked). The screen heats up with the level: Polite is white, Honest fades to blush, Savage turns the whole screen deep red with white text and a white button; Unhinged opens a dark Premium sheet with four chillies. Each level has its own prop pose instead of a small face change. Loop: Polite is a palms-up shrug, Honest holds up his phone and points at it, Savage wears pixel "deal with it" sunglasses with arms crossed. Lupe: Polite sips tea, Honest taps her phone, Savage wears the pixel sunglasses and flicks her hair. On both Honest poses the phone screen shows the user's real top stat ("14h INSTA"). The roaster picker shows both real faces as pill chips. In these stills Lupe wears the same cap and black tee as Loop.

**Roast language (added):** under the roaster picker, a "Roast in" toggle: English | Tanglish. It changes only the roasts, notifications and overlay lines; buttons, settings and permission text stay English. Switching changes the preview roast instantly (Honest in Tanglish: "14 hours Instagram-la. Adhu rendu full working days, boss."). Default: Tanglish if the phone's language is Tamil, otherwise English. Changeable later in Settings under Roast language.

**Marketing:** first personal roast is the "this app is funny" moment; "Savage mode" is a hook for Reels and store screenshots; the slider with Loop's changing face makes a strong screen recording.

**Track:** share of users choosing each level; taps on Unhinged (Premium interest).

#### Screen 5: Set limits (locked)

Its job: set a realistic daily limit per chosen app. Harsh limits cause constant roasts, annoyance and uninstalls, so defaults matter.

**How it works**

1. Title: "How much is too much?"
2. One card per chosen app (up to 3): icon, name, "You average 2h 03m a day", a big time value, a slider (5-minute steps to 1 hour, then 15-minute steps to 4 hours), and chips Suggested · Half · 30 min.
3. Smart default: about 30% below the user's daily average, rounded (2h 03m → 1h 25m).
4. Loop reacts live: very low "Ambitious. I respect it. I don't believe it, but I respect it."; near the suggestion "Reasonable. Suspiciously reasonable."; equal to habit "So… exactly what you already do."; above habit "Why did you even install me?"
5. Running summary: "This saves you about 4 hours a week" (real averages minus new limits).
6. Note: "Limits reset every day at midnight."
7. Button: "Lock it in".

**Build notes:** save limits to the storage shared with Kotlin so the service enforces them with the app closed. Minimum 5 minutes; days follow the phone's time zone. Without Usage Access: default 1 hour per app, hide the savings line.

**Mockup changes (approved):** each card shows the app, "You average … a day", the limit in big Clash Display, a slider with a faint tick at the user's average, and Suggested · Half · 30 min chips. A limit above the average turns the card amber with "Above your average". The weekly savings line shows the hours in red ("about 13 hours a week"; "This saves you nothing. Zero. Nada." when nothing is saved). Loop's face in the reaction bubble changes with the reaction: arms crossed for reasonable, over the glasses for very low, hand over mouth for above habit.

**Later:** nudge lower after a good week ("You stayed under all week. Cut another 10 minutes?"). Separate weekday and weekend limits become a Premium feature after v1.

**Marketing:** "Endloop gave me back 4 hours a week" is personal, real ad copy; realistic defaults reduce early uninstalls and protect the rating.

**Track:** average limit vs average real usage; later, share of days users stay within limits (the core success metric).

#### Screen 6: Final permissions (locked)

Its job: get the permissions that let Endloop interrupt, warn and stay alive. One checklist screen, easiest step first.

| Card | Loop's line | Button | How it's granted |
|---|---|---|---|
| Notifications | "So I can warn you before I get mean." | Allow | Standard Android popup |
| Display over apps | "So I can interrupt you mid-scroll. Rudely." | Turn on | Opens directly on Endloop's switch |
| Battery | "So your phone doesn't put me to sleep on the job." | Fix it | Battery settings page plus brand-specific steps (Xiaomi Autostart etc.) |

**How it works:** title "3 quick things and I'm ready." Loop gets more "ready" with each tick (stretching, earbuds in). Each card turns into a green tick on return and the next card lights up. Button "I'm ready" at the bottom. Skipping Display over apps shows "Without this, I can only send notifications. Be honest, you'll ignore them." but still allows continuing.

**Build notes:** avoid the direct ignore-battery-optimisation popup (restricted by Play); open the battery settings page with per-brand instructions (see dontkillmyapp.com). The foreground service shows a permanent notification and needs a Play declaration explaining background use.

**Mockup changes (approved):** Loop sits beside the title with an "x of 3 done" counter. Cards have four states: faded (waiting), lit with a red border and red button (current), green tick and "Done", and amber (skipped, button kept so they can go back). The skip warning sits under the cards. The battery card expands with the phone-brand steps inside it (for example Xiaomi: Battery saver → No restrictions; Autostart → Endloop on). Loop's poses progress arms crossed → over the glasses → pixel sunglasses when all three are done; stretching and earbud-in stills can replace them later.

**Marketing:** prevents the "stopped working" 1-star reviews that hit screen-time apps on Xiaomi, Realme and Vivo.

**Track:** grant rate per permission (especially Display over apps); service kills per phone brand.

#### Screen 7: Home (locked)

Its job: answer "how am I doing today?" at a glance, keep Loop present, and on the first visit explain what happens next.

**First visit:** Loop in celebration mode ("Setup done. Go live your life. I'll be watching."), a dismissible "Here's how it works" card (75% heads up → 90% last call → 100% I take over), and a "Test the roast" button that shows the full roast overlay as a demo.

**Every day, top to bottom**

1. Header: wordmark left, streak chip right ("3-day streak").
2. Loop's card: mood follows the day (happy under limits, suspicious when close, disgusted when over) with a changing line.
3. Today's total, big ("2h 14m"), with a rotating comparison: "a whole movie you didn't watch", "5 episodes of a series", "a Chennai to Bangalore train ride". Local references for India; English-market versions later.
4. App cards: used out of limit, coloured bar and label (Chill green, Heads up amber, Roasted red); tap opens app detail.
5. Free tier line: "3 of 3 free apps used · Go unlimited".
6. Bottom navigation: Today · Stats · Settings.

**Permission lost:** red banner "I can't see anything. Did you turn me off?" with a Fix it button.

**Mockup changes (approved):** Loop's card is a tinted card with his cut-out on the left, a mood label and his line; the tint follows the mood (blush normally, amber when suspicious). First visit uses the pixel-sunglasses pose and puts "Here's how it works" (75% · 90% · 100%) and an outlined "Test the roast" button in one card. The streak chip turns red with "Streak at risk" on an over-limit day. App cards show a Chill / Heads up / Roasted pill plus a coloured bar. A happy, under-limits Loop still is still needed.

**Marketing:** Test the roast is an instant demo for day one and for Reels; Loop's mood and comparisons make the dashboard shareable; the streak drives daily return.

**Track:** Test the roast taps, daily Endloop opens, streaks past 7 days.

#### Screen 8: Notifications (locked)

Its job: warn before the roast with rich, brand-coloured notifications, without becoming spam.

| Type | When | Banner | Example |
|---|---|---|---|
| Heads up | 75% of limit | Amber gradient, suspicious Loop | "Instagram: 15 min left" · "Pace yourself, legend." |
| Last call | 90% of limit | Amber-to-red gradient, Loop stretching | "5 minutes. I'm warming up." · "Close it now and nobody gets hurt." |
| Late night | Tracked app opened after bedtime (default 11:30 pm) | Indigo gradient, yawning Loop | "It's 12:40 am." · "The feed will still be there tomorrow. Your sleep won't." |
| Weekly roast | Sunday evening | Roast Red gradient, smug Loop | "Your weekly roast is ready." · "Brace yourself." |
| Background service | Always while running | None | "Loop is watching" · live status, e.g. "Instagram 45/60 min · YouTube over · Snapchat 12/30 min" |

At 100% there is no notification: the roast overlay takes over.

**Look:** collapsed shows Loop's face, short title, one roast line, red Endloop icon; expanded shows the full-width gradient banner. Tapping opens Home. At most one emoji per title, none in roast lines. Lines follow the chosen roast intensity.

**Rules:** max 2 warnings per app per day; late night once per night; one notification channel per type so users mute a type instead of uninstalling.

**Background notification:** required by Android for the always-running service. Lowest priority: silent, no status bar icon, collapsed at the bottom of the shade; updates quietly with live status. Users can swipe it away (Android 13+) or turn off its channel, and the service keeps running. Explain once when the service starts: "Android makes me show one quiet notification so I can keep watching. Swipe it away if it bugs you. I'll still be here."

**Build notes:** Notifee big-picture style for v1 with pre-made banners per type and dynamic text; warnings are sent by the Kotlin service, since the RN app is usually asleep.

**Marketing:** banners are the brand on the lock screen; good lines get screenshotted like Zomato and Swiggy notifications.

**Track:** tap rate per type; share of users who close the app within 5 minutes of a warning.

#### Screen 9: Roast overlay (locked)

Its job: interrupt at the limit, land a roast that makes people laugh, and make closing the app the easiest choice. This is the product.

**How it works**

1. Trigger: a tracked app is in front and today's time reaches its limit; the overlay appears within about a second.
2. Entrance: slides up in the Roast Red gradient with one heavy haptic thud; Loop does a slow eye roll and sigh.
3. Roast appears word by word in big white Clash Display (about half a second total).
4. Stat line: "Instagram · 1h 10m today · opened 14 times".
5. Big white button "Fine. Close it." sends the user to the home screen; Loop nods; counts toward the closed-on-first-roast streak. Small link "I need 5 more minutes" opens snooze friction.
6. Back gesture acts as Close it; the roast can't be swiped away.

**Reopening after closing:** the roast returns immediately and escalates: "Back already? It's been 40 seconds." → "I'm not tired. Are you?" → "We can do this all day. I literally can."

**Share this roast:** small icon in the top corner creates an image card (roast, Loop, Endloop logo) for Instagram Stories or WhatsApp.

**Roast selection:** "limit hit" category at the chosen intensity, filled with real app, time and opens; never the same line within 7 days.

**Build notes:** built natively in Kotlin so it appears instantly with the RN app asleep; needs native copies of fonts, the Loop clip and the roast library. Re-shown whenever the tracked app returns to the front. Sound off by default; optional roast sound in Settings.

**Marketing:** the screen people record and share; Share this roast puts the brand on Stories; Play Store screenshot #2 ("Hit your limit? Get roasted.").

**Track:** close rate on first roast (the #1 metric), snooze rate, reopen rate, roasts shared.

#### Screen 10: Snooze friction (locked)

Its job: a real way out when someone genuinely needs time, made annoying and a little embarrassing so most people give up and close the app.

**How it works**

1. Loop pulls out one earbud: "Oh? Convince me."
2. The user types a shown sentence exactly, e.g. "I am choosing reels over my dreams." Paste is blocked; letters turn green when correct, red on a typo. Sentences rotate and match app and intensity (YouTube: "One more video will definitely fix my life.").
3. A 10-second countdown ring while Loop stares.
4. At zero, "Give me 5 minutes" activates and returns the user to the app.
5. "Never mind, close it" link at every step; counts as a win, and Loop nods.

**After 5 minutes:** the overlay returns with a roast that references the snooze ("Second chance used. The typing didn't shame you? Impressive, honestly.").

**Second snooze:** longer sentence ("I, a fully grown adult, cannot stop watching strangers dance.") and a 20-second wait.

**Limit:** 2 snoozes per app per day. After that Loop shakes his head ("No. We're done here.") and only Close it remains until midnight. Extra snoozes are never sold in Premium.

**Emergency:** "Pause Endloop for today" lives only in Settings, with "Taking the day off? I'll remember this."

**Build notes:** part of the native Kotlin overlay; the overlay window must be allowed to take keyboard focus. Sentences live in the roast library under "snooze sentences".

**Marketing:** the embarrassing sentence is a Reel on its own; the sentence library can later take user suggestions.

**Track:** snoozes started then abandoned (high is good), snoozes completed, users using both snoozes.

#### Screen 11: App detail (locked)

Its job: a closer look at one app (how much, when, improving or not) and the place to change or remove a limit, protected by an anti-cheat rule.

**Top to bottom**

1. Header: back arrow, app icon and name, status chip.
2. Today: circular ring of time used vs limit (red when over), "Opened 14 times", "Longest session: 42 min".
3. This week: 7-day bar chart with the limit as a line, over-limit days in red; "Average 1h 12m a day · 4 of 7 days over."
4. When you scroll the most: Morning · Afternoon · Evening · Late night strip, heaviest highlighted; Loop: "11 pm to 1 am. Every night. We need to talk."
5. Limit with Edit (same slider as Screen 5).
6. Hall of shame: recent roasts for this app; tap to share.
7. "Stop tracking this app" at the bottom.

**Anti-cheat rule:** lowering a limit takes effect immediately ("Look at you."); raising a limit or removing an app takes effect from tomorrow ("Raising it? Fine. Starting tomorrow.").

**Build notes:** opens and session lengths from Android usage events; save a small daily summary on the phone each night because Android keeps limited detailed history; chart in Skia or a light RN chart library.

**Marketing:** the late-night insight surprises and gets shared; Hall of shame is a second share source; the anti-cheat rule earns "it actually works" reviews.

**Track:** limit raises vs lowers, removal attempts, Hall of shame shares.

#### Screen 12: Stats tab (locked)

Its job: answer "is Endloop actually helping me?" across all tracked apps over time. The screen that keeps people and converts them to Premium.

**Top to bottom**

1. Week / Month switch.
2. Hero: "Time won back this week: 4h 20m", vs the user's before-Endloop daily average.
3. Daily chart: total time on tracked apps per day, with a dashed "before Endloop" line.
4. Scoreboard tiles: days under all limits (5 of 7), closed on first roast (9), snoozes used (3), roasts received (14).
5. Per app: weekly total and change vs last week ("↓ 22%" green; "↑ 10%" red with a Loop jab).
6. 21-day challenge card: "The studies ran for 3 weeks. You're on day 12." Progress bar to 21 days under limits; wording describes the studies, never promises results.
7. "Past weekly roasts →" archive link.

**Free vs Premium:** free shows this week and last week; Premium adds Month view, full history and the weekly roast archive.

**Build notes:** the before-Endloop baseline is saved once from the 7 days of history read in onboarding; if Usage Access was skipped, the first week of use becomes the baseline ("Baseline builds after your first week"). All data comes from the nightly on-phone summary.

**Marketing:** "Endloop users win back X hours a week" (use the real average once known); "Take the 21-day Endloop challenge" campaign; the chart dipping below the baseline is a proud screenshot.

**Track:** average time won back per user (candidate main success metric); 21-day challenge completions.

#### Screen 13: Weekly roast report (locked)

Its job: sum up the week in one funny card people want on their Stories. The main organic growth engine.

**How it works**

1. Sunday 7 pm notification: "Your weekly roast is ready. Brace yourself."
2. Wrapped-style reveal, three tap-through screens: A "This week you scrolled…" with the total counting up; B "Worst offender…" with the app and hours as Loop shakes his head; C "But also…" with the wins (time won back, days under limits, closed on first roast), so it ends positive.
3. Share card: Roast Red gradient, wordmark, big total, worst offender, one win, the weekly roast line ("19 hours on YouTube. That's a part-time job with no salary."), Loop in the corner, and "Get roasted too → endloop app" at the bottom.
4. Buttons: "Share to Stories" (main) and "Save image"; a "Hide app names" toggle swaps names for "App #1" etc.

**Week types:** good week, Loop grudgingly proud ("Fine. You did well. Don't let it go to your head."); bad week, full roast ("You scrolled more than before you installed me. Impressive, in the worst way."); first week, "Week 1. The baseline is set. Now we see what you're made of."

**Build notes:** card at Stories size (1080×1920), built as an RN view and captured as an image; needs Loop's head shake and grudging nod; roast line from the "weekly report" category, chosen by week type.

**Marketing:** Wrapped-style sharing is proven; "Get roasted too" makes every share an invite; weekly cadence keeps Endloop visible.

**Track:** report opens, share rate (key growth number), installs from shared cards.

#### Screen 14: Settings (locked)

Its job: quick, plain adjustments, plus trust (permission health, privacy) and growth (share, rate, suggest a roast). Loop stays mostly quiet here.

**Sections**

1. Premium banner (free users): "Watching more than 3 apps? Go Premium."
2. Roasting: intensity (Polite · Honest · Savage · Unhinged locked), your roaster (Loop or Lupe; more "Coming soon"), roast sound (off by default), roast language (English or Tanglish).
3. Limits: apps and limits (anti-cheat rule applies), bedtime (11:30 pm), weekly roast (Sunday 7 pm), Pause Endloop for today ("Taking the day off? I'll remember this." with Confirm / Cancel; a paused day shows as "1 day off" in the weekly report).
4. Notifications: on/off per type (Heads up, Last call, Late night, Weekly roast).
5. Permission health: status of Usage Access, Display over apps, Battery, Notifications, with Fix it on anything off.
6. Privacy: "What Endloop can see" plain-language page; "Delete all my data" with confirmation.
7. About: Share Endloop, Rate us on Play Store, Suggest a roast, privacy policy, terms, version, and the credit line "from Super Spider".

**Ratings:** use Google Play's in-app review popup at happy moments (first good weekly report, or 3 days in a row closing on the first roast); Android limits how often it appears.

**Build notes:** plain RN; changes save immediately to the storage shared with the Kotlin service. The snooze count (2) is not editable.

**Marketing:** permission health prevents "doesn't work" reviews; Suggest a roast builds community and social content; timed review prompts lift the rating.

#### Screen 15: Premium paywall (locked)

Its job: turn interest into subscriptions honestly. Appears only in context: tapping a 4th app, Unhinged mode, Month view or history, or the Settings banner. The headline matches the entry point ("Watching more than 3 apps? Go unlimited." / "You want it meaner? Respect.").

**Top to bottom**

1. Clearly visible close button.
2. Smug Loop and the contextual headline.
3. What you get: unlimited apps; Unhinged mode; Month view, full history and weekly roast archive; coming soon (labelled): AI roasts, more roasters, weekday/weekend limits.
4. Plans: Yearly (Best value, 7-day free trial), Monthly, Lifetime (about 2–2.5× the yearly price).
5. Button: "Start 7-day free trial".
6. Plain terms under the button: "Free for 7 days, then [PRICE]/year. Cancel anytime in Play Store before day 7 and you won't be charged."
7. Restore purchase · Terms · Privacy.
8. Loop: "Paying to scroll less. Honestly? That's growth."

**Never:** fake countdowns, hidden close buttons, a paywall before the user has seen value, or selling snoozes.

**Build notes:** RevenueCat on Google Play Billing (supports UPI); Premium status also saved to the storage shared with Kotlin so the service knows the app count; RevenueCat can test headlines and prices without an app update.

**Marketing:** contextual paywalls convert better; honest terms prevent "charged without asking" reviews; the trial lets people get attached first.

**Track:** paywall views by entry point, trial starts, trial-to-paid, best-converting entry point.

#### Screen 16: Empty states and edge cases (locked)

Its job: never look broken or blank; every unusual moment gets a clear message in Loop's voice.

| Situation | What the user sees | Action |
|---|---|---|
| Day 1, no data yet | "Day one. I'm taking notes." No zeros or empty charts | None |
| No apps tracked | Bored Loop: "Nothing to watch. Suspicious." | Pick apps |
| Permission turned off | Red banner on Home; permanent notification becomes "I've been turned off. Tap to fix." | Fix it, straight to the setting |
| Phone killed Endloop | "Your phone put me to sleep. Let's stop that from happening again." | Brand-specific battery steps |
| Paused for today | Grey Home: "Day off. I'm judging silently." | Resume now |
| Every limit hit | Disgusted Loop: "Roasted on every app. Go outside. Seriously." | None |
| Perfect day | Next morning: "Yesterday: all under limits. I'm… proud? Weird feeling." | Share |
| Tracked app uninstalled | Removed quietly, slot freed: "Instagram's gone. Bold move." | None |
| Premium expired | "Premium ended. Pick 3 apps to keep watching." History kept, locked | User picks their 3 apps |
| Phone restarted | Service restarts automatically | None |
| Time zone change | Limits follow the local day | None |

**Build notes:** start the service on boot; the service writes an "I'm alive" timestamp every few minutes, and a large gap on next open triggers the battery message; v1 works fully offline, and v2 AI roasts fall back to the built-in library when offline.

**Marketing:** the perfect-day card is another positive share moment; handling permission loss and background kills well earns "it actually works" reviews.

**All 16 screens are now defined. Next phase: assets and branding.**

## Roast content

Target about 200 English and about 100 Tanglish roasts for launch, stored as JSON keyed by category, intensity and variables like {app}, {time} and {opens}, so new lines ship without an app update.

**Tone rules**

- Roast the scrolling, never the person: no looks, weight, family, caste, religion, gender, money or mental health.
- Dry beats loud. Short sentences. The stat is often the punchline.
- No swearing in Polite and Honest; mild at most in Savage.
- Never repeat the same line to one user within 7 days.

**Categories and counts**

| Category | Trigger | Lines per intensity | Total |
|---|---|---|---|
| Heads up | 75% of limit | 10 | 30 |
| Last call | 90% of limit | 10 | 30 |
| Limit hit | 100%, overlay | 20 | 60 |
| Snooze asked | Taps "5 more minutes" | 8 | 24 |
| Snooze sentences | Text the user must type | 8 | 24 |
| Late night | After bedtime | 6 | 18 |
| Wins | Closed on first roast, streaks | 5 | 15 |
| Weekly report | Sunday summary | 3 | 9 |

**Samples: limit hit**

- Polite: "That's your {app} time for today. The reels will survive without you."
- Honest: "{time} of other people's vacations. Your own life is on airplane mode."
- Savage: "{opens} opens today. At this point {app} should be paying you rent."
- Savage: "You didn't lose track of time. You handed it over."

**Samples: other moments**

- Heads up: "15 minutes left on {app}. Pace yourself, legend."
- Last call: "5 minutes. I'm stretching. Getting ready."
- Snooze asked: "Oh? Convince me."
- Snooze sentence to type: "I am choosing reels over my dreams."
- Second snooze: "The typing didn't shame you? Honestly, impressive."
- Snoozes gone: "No. We're done here."
- Late night: "It's midnight. The feed will still be there tomorrow. Your sleep won't."
- Win: "You closed it. I'm not proud. I'm just... not disappointed."
- Weekly: "19 hours on YouTube this week. That's a part-time job with no salary."

**Later:** Tanglish library written by native speakers, not translated. AI roasts generated daily from aggregated stats, checked by a safety filter, cached offline.

### Roast library structure

Each roast is one JSON entry:

- **apps:** null for general lines, or a list such as ["youtube"] for app-specific lines.
- **roaster:** null for both, or "loop" / "lupe" for signature lines.
- **Placeholders:** {app}, {time}, {limit}, {opens}, {over}, {streak}.
- **Languages:** en (English, global humour), ta-Latn (Tanglish, local meme humour), ta (Tamil script, later). Roast language is its own setting, separate from app language.
- **Selection:** match category and intensity → prefer an app-specific line → about 1 in 10 a signature line for the chosen roaster → never repeat a line within 7 days → seasonal packs boosted inside their dates.
- **Intensities:** Polite (kind nudge), Honest (dry truth, the stat is the punchline), Savage (sharper burn, mild words at most), Unhinged (Premium: absurd and chaotic, not meaner).

**Tanglish rules**

- Echo Tamil meme and movie-dialogue style with original lines; everyday slang is fine ("mudiyala", "vera level"). Never use actors' names, photos, voice clips, meme screenshots or long verbatim dialogues (personality rights).
- Use gender-neutral address ("Boss", "Bro", "Nanba", or none); never "dei"/"di", since Endloop doesn't know the user's gender.
- Claude drafts, Vignesh edits every line for natural tone.

### Roast library delivery (cloud)

Roasts are data, not code, so new lines and seasonal packs ship without an app update and a bad line can be pulled in minutes.

1. A base library is bundled in the app so it works offline from day one.
2. On app open and once a day in the background, the app checks a small manifest and downloads only changed packs.
3. Packs are saved on the phone; RN screens and the Kotlin overlay always read the local copy, never the network at roast time.
4. A failed or malformed download keeps the last good copy.

**Hosting:** Firebase Hosting or Storage for v1 (free at this size, Firebase already in the stack), with Firebase Remote Config for switches (enable a pack early, disable a single line). Move to the Fastify API in v2.

**Seasonal pack ideas:** IPL season, board exam season, Pongal, Diwali, New Year resolutions, monsoon. The joke is always about the scrolling, never the festival or religion.

**Rules:** downloads send no user data, so the privacy promise holds (mention roast downloads in the privacy policy); every new line is reviewed before publishing; library size is tiny (200+ roasts is about 30–60 KB).

## Research facts library

The research says two things: heavy scrolling is linked to worse sleep, focus and mood, and cutting back for even one to three weeks measurably helps. Endloop uses the second half most, because hope motivates better than fear.

**The problem**

| Fact | Detail | Source |
|---|---|---|
| Indians average about 5 hours a day on their phones | 1.1 trillion hours in 2024; nearly 70% on social media, gaming and video |  |
| Attention on one screen fell from about 2.5 minutes (2004) to about 47 seconds | Returning to an interrupted task takes about 25 minutes |  |
| Each extra hour of daily screen time is linked to 3–5 minutes less sleep and about 13 minutes later bedtime | Meta-analysis of 21 cohort studies, 548,338 people; also higher insomnia risk |  |
| Doomscrolling is linked to anxiety, depression, stress and lower wellbeing | Review of 50 studies; mostly correlational, so "linked to", not "causes" |  |

**The good news: cutting back helps**

| Study | What people did | What changed | Source |
|---|---|---|---|
| University of Pennsylvania, 2018 (143 students) | About 10 minutes per app, roughly 30 minutes a day, for 3 weeks | Significant drops in loneliness and depression vs the control group |  |
| BMC Medicine, 2025 (111 students) | Screen time at or under 2 hours a day for 3 weeks | Depressive symptoms down 27%, stress down 16%, sleep quality up 18%, wellbeing up 14%; gains faded when screen time went back up |  |
| Harvard / JAMA Network Open, 2025 (373 young adults) | One week, social media cut from about 1.9 hours to about 30 minutes a day | Anxiety down 16.1%, depression down 24.8%, insomnia down 14.5%; results varied by person |  |

The BMC finding that benefits faded when usage rebounded is Endloop's strongest pitch: the gains come from keeping limits, not from a one-off detox.

**Where facts appear in the app**

| Place | Fact | Example line |
|---|---|---|
| Screen 3, The damage | India's 5-hour average | "You: 3h 10m a day. India's average: 5 hours. Congrats? No." |
| Screen 5, Set limits | 30-minutes-a-day and 3-week studies | "People who cut to about 30 minutes a day for 3 weeks felt less lonely and less low." |
| Late-night notification | Sleep meta-analysis | "Every extra hour on your phone is linked to a later bedtime. Just saying." |
| Home, weekly fact card | Rotating fact, dismissible | "Your attention on one screen now lasts about 47 seconds. This card took 5." |
| Weekly report | 1-week and 3-week studies | "Week 1 done. In one study, a week like this cut anxiety by 16%." |
| Play Store listing and marketing | Good-news studies | "Backed by research: less scrolling, better sleep and mood." |

**Rules for using facts**

- Say "linked to" for correlational findings; never "causes" unless it was a trial.
- Every in-app fact has a small "Source" link. It builds trust and costs nothing.
- No medical claims: Endloop never says it treats depression, anxiety or insomnia. Add "Not medical advice" in the facts area; Play Store also restricts health claims.
- Facts are the calm voice; roasts stay the funny one. Never roast someone with a mental-health fact.
- Re-check numbers and links before launch and once a year.

## Later: personalised roasts and tips (phase 2 or 3)

Idea from Vignesh, parked for after launch: learn a little about each user (profession, what they want their time for, how they think about their phone) and use it to personalise roasts, facts and time-management tips.

| Input | How we get it | Example of what it changes |
|---|---|---|
| Profession or student | Optional one-tap question after the first week | A developer gets "That PR won't review itself"; a student gets exam-season lines |
| What they want time for | Optional pick: gym, study, family, side project, sleep | Tips and roasts point at their own goal: "That's your gym hour, on reels" |
| Mindset / motivation style | Optional short quiz, or learned from which roasts make them close the app | More tough love or more encouragement per person |
| Snooze reasons and patterns | Already collected (Convince me, time of day, opens) | "Third 'for work' this week on Instagram" |

- Everything is optional and editable in Settings; the app works fully without it.
- Only aggregated, non-sensitive answers go to the AI backend (v2). No health, religion or other sensitive categories are asked.
- Builds on the v2 AI-roast backend; ships after launch data shows which roasts actually get people to close the app.

## Open decisions

- [x] Character name: Loop stays the deadpan and brand mascot; new roasters get their own names
- [x] Colour theme: Roast Red and White; font: Clash Display + Satoshi (both locked)
- [x] Official Clash Display and Satoshi (OTF, ITF Free Font License v2.0) added on 25 Sep 2026; the licence allows embedding in apps but forbids format conversion and public redistribution, so keep the repo private
- [x] Free tier: 3 tracked apps free, unlimited apps with Premium from launch
- [x] Snooze limit: 2 per app per day (locked in Screen 10)
- [x] Default bedtime for the late-night nudge (suggested 11:30 pm)
- [x] Framework: Expo with prebuild and a development build (decided); can switch to bare later by committing android/
- [x] Flow clips: fine to use in the app under Google's terms (see Using the Flow clips)
- [x] Research Premium pricing in India (monthly, yearly, lifetime) before launch
