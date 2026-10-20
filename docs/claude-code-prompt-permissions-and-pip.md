# Prompt for Claude Code (run from ~/superspider/endloop)

Paste everything below the line into Claude Code.

---

Read CLAUDE.md and docs/handoff/03-architecture.md first. Fix these two problems in the Endloop app (Expo SDK 57 + the local Kotlin module `endloop-core`). Keep the existing code style, and don't commit.

## Problem A: the roast screen's close leaves the video playing in picture-in-picture

**How it happens now.** `RoastOverlay.kt` is a `TYPE_APPLICATION_OVERLAY` window drawn over the tracked app, and that app stays resumed underneath it. When the user closes the roast, we send them to the home screen. Apps with auto picture-in-picture (YouTube, Chrome video, Instagram/Facebook video and others) treat that home trip as "the user left", so they shrink into a PiP window and keep playing. The roast is effectively undone. The audio also keeps playing behind the roast while it is showing.

**What to change:**

1. **Pause the media as soon as the roast appears.**
   - When `RoastOverlay` shows, request audio focus with `AudioFocusRequest` (`AUDIOFOCUS_GAIN`, usage `USAGE_ASSISTANCE_SONIFICATION` or similar). Well-behaved players pause on a permanent focus loss and don't resume by themselves.
   - Release the focus when the overlay goes away.
   - Don't play any sound ourselves.
2. **Leave without triggering PiP.**
   - Replace "send the user home" on close with a two-step exit.
   - Step one: start a tiny transparent, no-history activity of ours, `ExitActivity`. Use `excludeFromRecents`, `noHistory`, `taskAffinity=""` and a transparent theme. We hold "Display over other apps", so starting an activity from the background is allowed. Starting our activity puts the tracked app into the background without the "user leave" signal that triggers auto-PiP.
   - Step two: in `ExitActivity.onCreate`, start the launcher (`ACTION_MAIN` + `CATEGORY_HOME`, `FLAG_ACTIVITY_NEW_TASK`), then call `finish()` without an animation.
   - Use the same exit path everywhere we currently go home from the roast or overlay flow, including the `onHiddenBySystem` path, and keep the existing "skip when locked or screen off" rule.
3. **Safety net.**
   - After the exit, if within the next 2 ticks the service still sees the tracked app in the foreground and the limit is still hit, show the roast again as it does today.
   - Make sure a PiP window of a tracked app doesn't count as "the user left" for streak or anti-cheat logic.
4. **Test on an emulator or phone.** YouTube playing a video → limit hit → roast → close: no PiP window and no audio. Also check that the back key on the roast still works the same way.

## Problem B: the permission setup is a long trip on Android 11–15

**How it happens now.** On Android 11+ the Display over other apps page ignores our `package:` URI and opens the full app list. Many phones do the same for Usage access, so users have to find Endloop themselves. On Android 13+, and strictly on 15, sideloaded installs also hit "Restricted settings" for Usage access and Display over other apps: the switch is greyed out until the user goes to App info → ⋮ → Allow restricted settings. Play Store installs don't get this.

**What to change:**

1. **Auto-return.**
   - When we open Usage access or Display over other apps settings from onboarding or Settings, start watching for the grant with `AppOpsManager.startWatchingMode` for `OPSTR_GET_USAGE_STATS` / `OPSTR_SYSTEM_ALERT_WINDOW` on our package.
   - As soon as it flips to allowed, bring Endloop back to the front with our launch intent (`FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_SINGLE_TOP`, or `REORDER_TO_FRONT`) and stop watching.
   - Also stop watching after 3 minutes, or when our app becomes active again.
   - The existing JS checks on `AppState` `active` stay as they are.
2. **Hint while in Settings.**
   - Right after opening the page, show a short `Toast` saying `Find Endloop and switch it on`, or `Find Endloop, tap it, then switch it on` on brands where the list opens a sub-page.
   - Keep it plain. No overlay window for this.
3. **Install-source check.**
   - Add `EndloopCore.installSource(): String | null`, using `packageManager.getInstallSourceInfo(packageName).installingPackageName` on API 30+ and `getInstallerPackageName` below.
   - Also add `EndloopCore.isRestrictedSettingsLikely(): Boolean`, which returns true when the SDK is 33+ and the installer isn't `com.android.vending`.
   - Expose both in the JS bindings and the types.
4. **Onboarding (`src/app/onboarding/usage-access.tsx` and `permissions.tsx`).**
   - When `isRestrictedSettingsLikely()` is true, show the existing 3 restricted-settings steps (`NotFoundNudge`) **before** the user's first trip to Settings, not only after they fail.
   - Add a line such as: "Installed outside the Play Store, so Android asks for one extra step."
   - The "Open App info" button keeps opening our App info page.
   - Keep the copy short and in the app's voice. No raw `{placeholders}`.

## Checks before you finish

- Run `npx tsc --noEmit` and `npx expo lint`, then `npx expo run:android` on an emulator with API 34 or 35.
- Fresh install with `adb install` (sideload) → confirm the restricted-settings steps show up front, and the auto-return works after enabling each permission.
- YouTube PiP test from Problem A.
- No new data leaves the phone and no new permissions are added, so the privacy policy doesn't change. If you do add a manifest permission, stop and tell me.
- At the end, list the files you changed.
