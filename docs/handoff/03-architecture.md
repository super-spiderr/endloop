# Architecture

## Big picture

```
React Native (Expo Router screens, zustand store)
   │  buildConfig() → JSON                         ▲ usage, history, logs
   ▼                                               │
EndloopCore (Kotlin Expo module) ── setConfig ──► Store.kt (SharedPreferences "endloop_core")
                                                    │
                                   EnforcerService (foreground service, 4 s tick)
                                     ├─ UsageReader: which app is in front, minutes today
                                     ├─ Alerts/Notifier/Banner: 75%, 90%, late night, weekly
                                     └─ RoastOverlay: full-screen roast + snooze friction
```

The JS side owns settings and copy. The native side only reads the config JSON and enforces it, so it keeps working when the app is closed.

## JS side (`src/`)

- `store/settings.ts`: the zustand store persisted to MMKV. Tracked apps (with `nextLimitMin`, `nextFrom`, `removeFrom` for anti-cheat), roaster (`loop`/`lupe`), intensity, `roastLang` (`en` / `ta-Latn` = Tanglish), bedtime (default 23:30), `notify` toggles, pause state, streak, `startedAt`, baseline, `roastSound`, `perfectSeen`. Actions include `changeLimit`, `scheduleRemove`, `cancelRemove`, `applyScheduled` (runs on app start).
- `lib/watcher.ts`: `buildConfig()` turns the store into the native config (friction copy, notification copy, roast text, facts, per-app lines, bedtime, notify, pausedUntil) in English and Tanglish; `syncWatcher()` pushes it.
- `roasts/`: `core.en.json`, `core.ta-Latn.json` (line packs with placeholders), `index.ts` (`pickRoast`, `linesFor`, `NATIVE_VARS = app,time,limit,left,over,clock,opens`: lines with any other `{placeholder}` are filtered out), `facts.ts` (12 sourced facts × 3 tones + Tanglish).
  - **Roasts fit the app (6 Oct):** each line has `kinds` (feed, video, chat, browser, games, shopping, work; null = any app). `kinds.ts` maps a package to a kind (known list → package/label keywords → `other`, which gets only universal lines). `pickRoast` and `linesFor` only offer universal lines plus the app's kind, so Messages never gets "feed" or "reels". Edit lines in `design/tools/roasts/build.py` (tag anything mentioning feeds, reels, videos, posts or scrolling in `KIND_TAGS`), run it, copy `out/*.json` into `src/roasts/`. Never edit the JSON directly.
- `characters.ts`: every pose name → image for Loop and Lupe (see 04).
- `lib/app-icon.tsx`, `lib/plans.ts`, `lib/weekly.ts`, `lib/permissions.ts` (brand-specific battery steps), `data/usage.ts` (native with mock fallback for Expo Go/web).
- `app/_layout.tsx`: Stack with `app/[pkg]`, `privacy`, `weekly` (fullScreenModal), `paywall` (modal); fonts are the official OTFs.

## Native module (`modules/endloop-core/android/src/main/java/expo/modules/endloopcore/`)

| File | Job |
|---|---|
| `EndloopCoreModule.kt` | JS API: hasUsageAccess, canDrawOverlays, isIgnoringBatteryOptimizations, areNotificationsEnabled, open*Settings, listApps, todayMinutes, appDetail, history, roastLog, snoozeLog, shareRoast, weeklyCard, clearData, installed, setConfig, start/stopWatcher, lastHeartbeat, testNotification, appIconSupported/appIcon/setAppIcon. Settings pages open from `currentActivity` on the main queue. |
| `EnforcerService.kt` | Foreground service, 4 s tick. Detects the foreground app, warns at 75/90%, roasts at 100%, late-night nudge (bedtime → 5 am, once a night), weekly roast (Sunday 19:00+), live status line, daily summary save, pause support. Keeps or drops the overlay (`keepOrDropRoast`: drops at once for protected apps/home, otherwise after 2 ticks; stays while the user is mid-snooze). Reopen within 10 min escalates. 90 s grace after sharing. |
| `RoastOverlay.kt` | `TYPE_APPLICATION_OVERLAY`, edge-to-edge (covers status bar), focusable (back key = close, keyboard for typing step), Clash Display font, slide-up + word-by-word reveal, convince → type → wait (custom `Ring` view with the character's face) → ready. `onHiddenBySystem` callback when an app hides overlays. |
| `Alerts.kt` | Builds every Screen 8 notification (shared by the watcher and `testNotification`). |
| `Notifier.kt` | Channels: watching (min), heads_up, last_call, late_night, weekly; `rich()` with BigPicture banners; deep links. |
| `Banner.kt` | Draws 1024×512 banners and face crops at runtime. |
| `ShareCard.kt` | 1080×1920 roast/weekly cards, `ShareProvider` (own FileProvider), MediaStore save. |
| `Store.kt` | Config parse (data classes), logs (roasts capped at 500, snooze reasons), daily summaries, wins, once-per-day flags, `fillRoast`, `hasPlaceholder`. |
| `UsageReader.kt` | Foreground time, sessions, opens from UsageStatsManager events. |
| `Protected.kt` | Apps never blocked: Settings, permission controller, package installer, dialer/phone, Play Store, system UI, home launchers, Endloop itself. |
| `AppIcon.kt` | Enables one of the `.IconDefault/.IconLoop/.IconLupe` aliases; pending choice applied on `OnActivityEntersBackground`. |
| `BootReceiver.kt` | Restarts the watcher after reboot / app update. |

Resources: `res/drawable-nodpi` has the native character stills (`endloop_{loop,lupe}_*`, 600×600 with a baked bottom fade), icon foregrounds; `res/font/clash_display_bold.otf`; `res/xml/endloop_share_paths.xml`; icon adaptive XML in `mipmap-anydpi-v26`.

`plugins/with-app-icons.js` (config plugin, registered in `app.json`) moves the launcher entry from MainActivity to three activity-aliases. Expo CLI still finds the launch activity through the alias.

## Behaviours worth knowing

- **Anti-cheat:** lowering a limit applies now; raising it or removing an app waits until tomorrow.
- **Snooze:** 2 per app per day; typing step blocks paste/multi-character inserts, suggestions and the text-selection menu; case-insensitive match.
- **Overlay hidden by other apps** (Files and similar call "hide overlay windows"): the service sends the user to the home screen so the roast is visible there; skipped when locked/screen off. Awaiting device test.
- **Placeholders:** any line with an unknown `{placeholder}` is filtered in JS and in Kotlin.
- **App icon:** switching can remove the home-screen shortcut on some launchers; the UI warns about it.

## Build and debug

```bash
npx expo run:android                        # JS or Kotlin changes
npx expo prebuild --clean && npx expo run:android   # after manifest/resources/plugin changes
npx tsc --noEmit && npx expo lint           # before calling anything done
adb logcat -s Endloop AndroidRuntime        # watcher/overlay logs
```

Gotchas hit so far:
- Expo module `Function<T>("name") { arg: X -> }` does not compile; with arguments use `Function("name") { arg: X -> }` (type args only on zero-arg lambdas).
- Kotlin can't be compiled in Claude's cloud container; only Vignesh's local build verifies it. On the Mac, a quick compile check without a phone: `cd android && ANDROID_HOME=~/Library/Android/sdk ./gradlew :endloop-core:compileDebugKotlin -q`.
- `android/` is generated (CNG); never hand-edit it.
