# Endloop

The screen-time limiter that roasts you. Android first. Built by Super Spider.

Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · development build (not Expo Go).

## Run it

```bash
npm install
npx expo run:android      # builds the dev client and installs it on a connected phone or emulator
# later sessions, once the dev client is installed:
npm start
```

Or build the dev client in the cloud: `npx eas-cli@latest build --profile development --platform android`.

Checks: `npm run typecheck` and `npm run lint`.

## What's built

Onboarding screens 1–6 and Home (screen 7), matching the approved mockups:

| Route | Screen |
| --- | --- |
| `onboarding/welcome` | 1 · Welcome (red gradient, Loop sneak-in clip, typed lines) |
| `onboarding/usage-access` | 2 · Usage Access (ask, not found, granted) |
| `onboarding/pick-apps` | 3 · The damage / pick apps (3 free, Premium sheet on the 4th) |
| `onboarding/intensity` | 4 · Roaster, roast language (English / Tanglish), chilli heat meter |
| `onboarding/limits` | 5 · Set limits (sliders, chips, weekly savings, Loop reactions) |
| `onboarding/permissions` | 6 · Notifications, display over apps, battery (with phone-brand steps) |
| `(tabs)/today` | 7 · Home (Loop's mood, today's total, app cards, Test the roast) |

Stats and Settings tabs are placeholders; Settings has a dev-only "Replay onboarding".

## Native core (`modules/endloop-core`, Kotlin)

A local Expo module, autolinked into the Android build:

- **Usage data**: screen time per app from UsageStatsManager events (resumed → paused, screen-off closes sessions). Launcher apps only, via a `<queries>` entry (no QUERY_ALL_PACKAGES). Real app icons, cached as PNGs.
- **Permission checks and shortcuts**: usage access, display over other apps, battery optimisation, notifications. Settings pages open straight on Endloop where the phone allows it.
- **The watcher** (`EnforcerService`): a foreground service (specialUse) on its own thread. Every 4 s it checks the app in front; at 75% and 90% it sends a warning notification (once per app per day), at 100% it shows the roast over the app.
- **Roast overlay** (`RoastOverlay`): full-screen roast gradient, the roast line, "Close it" (goes to the home screen) and "5 more minutes" (2 per app per day).
- **Boot receiver**: restarts the watcher after a reboot or app update. A heartbeat lets Home restart it if the phone killed it.
- JS pushes limits and the chosen roast lines (language, heat, roaster, per app) with `setConfig`; see `src/lib/watcher.ts`.

Without the native build (Expo Go, web) the app falls back to demo numbers.

### Test the watcher quickly

1. Onboard and pick an app you can open on the emulator (e.g. Chrome), then set its limit to 5 min.
2. Use that app: warnings arrive at about 4 and 5 minutes, the roast covers the app at 5.
3. `adb shell dumpsys activity services expo.modules.endloopcore` shows whether the watcher is running.

## Still to come

- Styled notification banners (big picture, gradients), Loop's clip and share on the roast, snooze friction (typing the sentence), app detail, stats, weekly report, settings, paywall (screens 8–16).

## Where things live

- `src/theme/tokens.ts` brand colours, gradients, fonts, usage states
- `src/brand/` the locked logo as SVG (Satoshi Bold outlines + broken loop)
- `src/characters.ts` one slot per character pose; swap art here only
- `src/roasts/` bundled roast library (English 170 lines, Tanglish 100 lines)
- `src/store/settings.ts` persisted settings (MMKV, shared with the Kotlin service later)
- `assets/fonts` Clash Display + Satoshi. Replace with the official Fontshare files before release and keep their licence.
