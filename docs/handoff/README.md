# Endloop handoff

Everything decided and built for Endloop, collected so Claude Code (or anyone new) can pick up without the original chats. Snapshot: 28 Sep 2026.

Read in this order:

| File | What's in it |
|---|---|
| [01-master-plan.md](01-master-plan.md) | The product plan: positioning, v1 scope, pricing, roadmap, brand, characters, every screen spec, roast and fact libraries, open decisions. Exported from the living "Endloop Master Plan" doc. |
| [02-build-status.md](02-build-status.md) | What exists in code, screen by screen (S01–S17), and what's still missing or untested. |
| [03-architecture.md](03-architecture.md) | How the app works: Expo app, the Kotlin module, config flow, overlay, notifications, anti-cheat, app icon, test hooks, gotchas. |
| [04-characters-and-poses.md](04-characters-and-poses.md) | Loop and Lupe, the one-pose-per-moment library, image prompts, the green-screen pipeline, animation plan. |
| [05-decisions-and-constraints.md](05-decisions-and-constraints.md) | Decisions log and hard rules (licences, identity, privacy, tone). Read before changing anything user-facing. |
| [06-next-steps.md](06-next-steps.md) | Prioritised to-do list and the on-device test checklist. |

Design assets live in [`/design`](../../design/README.md) (mockup generators, pose pipeline, raw pose sources).

## Links (private to Vignesh's claude.ai account)

- Design canvas, all 17 screens: https://claude.ai/artifact/CRJ4a1sUUDktx9zDk26baG
- Master plan doc (living): https://claude.ai/code/artifact/30a79644-77d3-4506-8105-1c3a6efb5f5e
- claude.ai Project "Endloop" holds `claude/pose-library.md` (same content as 04, kept up to date there)

## Working agreement (how Vignesh likes to work)

- Screen by screen: mockup on the canvas → he approves or changes → build in code → he tests on his phone and sends logcat.
- Direct, honest answers; no padding. Name problems plainly, alongside what's working.
- Commit only when asked. Keep the Super Spider GitHub identity for this repo (not the office one).
- Kotlin can't be compiled in the cloud container; the real test is `npx expo run:android` on his Mac. After native resource or manifest changes, use `npx expo prebuild --clean` first.
- Debug with `adb logcat -s Endloop AndroidRuntime`.
