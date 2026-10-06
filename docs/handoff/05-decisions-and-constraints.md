# Decisions and constraints

## Hard rules

- **Identity:** the app is published by **Super Spider** (in-app credit "from Super Spider"). Code goes to the Super Spider GitHub account; Vignesh's office GitHub identity is separate and must not be used here.
- **Commits:** only when Vignesh asks.
- **Fonts:** official Clash Display + Satoshi OTFs under the ITF Free Font License v2.0 (`assets/fonts/LICENSE-ITF-FFL.txt`). Embedding in the app is allowed; **format conversion and public redistribution are not**. Keep the repo private; don't convert the files (the design canvas uses the official WOFF2s).
- **Characters:** Lupe is modelled on Vignesh's girlfriend; check her consent is current before any public/marketing use. Never name the real inspiration for the characters' gestures or any film references in the app or marketing.
- **Roast tone:** roasts go after the habit, never looks, family, identity or anything sensitive. Unhinged is the meanest level and still follows this.
- **Protected apps:** never block Settings, permission screens, installer, phone/dialer, Play Store, system UI, home launchers or Endloop itself.
- **No placeholders shown:** a line that would show a raw `{placeholder}` must never reach the user.
- **Privacy policy stays true:** every change that affects data or permissions updates `site/privacy.html` in the same change (checklist in `site/README.md`).
- **No accounts in v1.** Data stays on the phone ("no sign-up, your data never leaves your phone" is a selling point).

## Decisions log

| Date | Decision |
|---|---|
| Sep 2026 | Expo (not bare RN CLI) with prebuild + development build; local Kotlin Expo module for the Android core. |
| Sep 2026 | Android first. English and Tanglish (Tamil in Latin script) roasts at launch; Tamil script and other languages later. |
| Sep 2026 | Brand: Roast Red and white; fonts Clash Display (display) + Satoshi (UI). Wordmark "endloop" with the loop in the "oo". |
| Sep 2026 | Two roasters: Loop (default, mascot) and Lupe. More characters later, each with its own name. |
| Sep 2026 | Free tier tracks 3 apps; Premium unlocks unlimited apps, Unhinged level, month view/full history, weekly archive. |
| 25 Sep 2026 | Prices: Monthly ₹99, Yearly ₹699 (7-day free trial, default), Lifetime ₹1,499. Billing through Google Play via RevenueCat (anonymous app user IDs; purchases tied to the Google account; "Restore purchase" on the paywall; set RevenueCat restore behaviour so both devices keep Premium). |
| Sep 2026 | Snooze: 2 per app per day, with friction (reason → type a sentence → 10 s wait, 20 s for the 2nd); backing out counts as a win. |
| Sep 2026 | Anti-cheat: lower limit = now; raise limit / stop tracking = tomorrow. |
| Sep 2026 | Roast overlay is full screen and covers the status bar; "5 more minutes" first asks the user to convince. |
| Sep 2026 | Facts during the wait step, in the chosen tone, including time-use and time-management tips. |
| 25 Sep 2026 | Weekly share card tagline stays plain text "endloop app" for now. |
| 25 Sep 2026 | App icon can match the roaster (Loop/Lupe/red), opt-in at the end of onboarding and in Settings, never automatic. |
| 25 Sep 2026 | One pose per moment across all screens (no reusing poses for different moments). |
| 25 Sep 2026 | Animated clips are done last; only the big moments get animation (see 04). |
| 25 Sep 2026 | iOS assessed: possible later as a lighter version (Apple's Screen Time shield instead of the full-screen roast, snooze friction moves into the app, no app names or exportable usage numbers, needs the Family Controls entitlement). Android ships first. |
| Phase 2/3 | After AI roasts: ask for profession and mindset to personalise roasts and tips. |

## Open / not decided

- Support email and the public URL for `site/` (GitHub Pages). Terms use Indian law with Chennai courts.
- Whether any icon moods or extra characters become Premium perks.
- Tagline on the weekly card (currently plain "endloop app").
