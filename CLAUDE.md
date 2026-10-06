@AGENTS.md

# Endloop

Android-first screen-time limiter that roasts you at your limit, fronted by two characters (Loop and Lupe). Published by Super Spider. Expo SDK 57 + a local Kotlin Expo module (`modules/endloop-core`).

Before working on anything, read `docs/handoff/README.md`. It links the full master plan, build status per screen, architecture, character/pose library and the decisions log.

Must-follow rules (details in `docs/handoff/05-decisions-and-constraints.md`):
- Commit only when Vignesh asks; use the Super Spider GitHub identity, never the office one.
- Fonts are licensed for embedding only: don't convert them, keep the repo private.
- Never block protected apps (Settings, permissions, dialer, Play Store, launcher, Endloop).
- Roasts target habits only; never looks, family or identity. No raw `{placeholders}` shown to users.
- Never name the real inspiration for the characters' gestures, or film references, in the app or marketing.
- `android/` is generated; change native behaviour through the module, `app.json` or `plugins/`.
- Kotlin changes are verified only by `npx expo run:android` on a device; after resource/manifest/plugin changes run `npx expo prebuild --clean` first. Logs: `adb logcat -s Endloop AndroidRuntime`.
- **Privacy policy stays true:** any change that touches permissions, stored data, sharing, network calls, SDKs, payments or accounts must update `site/privacy.html` (and its date) in the same change, plus the in-app "What Endloop can see" page if needed. Checklist in `site/README.md`.
- Run `npx tsc --noEmit` and `npx expo lint` before calling anything done.
