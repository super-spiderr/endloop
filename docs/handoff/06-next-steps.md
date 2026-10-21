# Next steps

## Priority order

1. **Test the whole app on a real phone** (checklist below) and fix what breaks. Most of S08–S17 has never run on a device, and onboarding v2 (21 Oct) has only run on the emulator.
2. ~~Poses for S08 → S17~~ Done 6 Oct for both roasters and wired in (bow and goodbye wait for payments).
3. **Payments:** RevenueCat + Play Console products (₹39 / ₹199 with 7-day trial / ₹499 lifetime, founding ₹299 lifetime for the first 500 or 30 days), real Premium state, restore, then build "Premium ended → pick 3 apps to keep" (S16-H).
4. **Publish the privacy policy, terms and support pages** (`site/`, written 29 Sep): fill the support email with `sh site/set-email.sh`, host on a public Super Spider GitHub Pages repo, then set `src/lib/links.ts` so the Settings rows go live. Required for the Play Store.
5. **Play Store listing:** screenshots, feature graphic, descriptions, data-safety form (usage data stays on device, no account).
6. **After release:** animated clips ship as updates, one at a time (decided 6 Oct), starting with the S09 eye-roll. Not needed for v1; the stills are the release art.
7. Later: AI roasts, personalisation (profession/mindset), more languages, more characters, iOS lite.

## Device test checklist

Build: `npx expo prebuild --clean && npx expo run:android`. Logs: `adb logcat -s Endloop AndroidRuntime`.

Onboarding (v2, see 09-onboarding-v2.md)
- [ ] Welcome → roaster → … → welcome bonus → Today on a fresh install (Settings → Replay onboarding in dev builds), both roasters, English and Tanglish
- [ ] Welcome marquee moves smoothly; still with Reduce motion on
- [ ] Reveal numbers match the phone's own Digital Wellbeing roughly; Endloop itself never listed
- [ ] Battery card shows on the Vivo (and never names the brand)
- [ ] Test Premium (dev): paywall button → 6 apps, weekend tabs, Unhinged gold screen; button again turns it off
- [ ] Weekend limits (Premium): set a lower weekend limit; on Saturday the roast comes at the weekend limit and Today shows it; Monday back to the weekday one

Home and watcher
- [ ] Mood card poses: first visit, chill, close, over, Usage Access off
- [ ] Set a 5-minute limit; 75% and 90% notifications arrive with banners
- [ ] Roast at 100% covers the whole screen including the status bar
- [ ] Roast inside **Files** now sends you home and shows there (`overlay window hidden by system` then `sent home to show it`)
- [ ] Settings/permission screens are never roasted
- [ ] Reopen within 10 min escalates; after 2 snoozes the snooze option is gone

Snooze
- [ ] Convince step can't be dismissed by switching apps; typing blocks paste; 10 s wait shows a fact; 2nd snooze waits 20 s
- [ ] "Never mind" shows the proud screen and counts as a win

Notifications
- [ ] Settings → Test notifications (dev): heads up, last call, late night, weekly (opens the weekly report), explainer
- [ ] Toggles in Settings turn real notifications off

Other screens
- [ ] App detail: lower limit applies now, raise shows "from tomorrow", stop tracking from tomorrow
- [ ] Stats week view; month opens the paywall for free users
- [ ] Weekly report pages, share to Stories, save to Pictures/Endloop
- [ ] Settings: pause for today, bedtime, delete all data (returns to onboarding, icon resets to red)
- [ ] Edge cases: uninstall a tracked app, force-stop Endloop (killed card), day one, perfect day

Known risks
- Some launchers remove the home-screen shortcut when the icon changes (expected; the UI warns).
- Xiaomi/Oppo/Vivo battery managers can kill the watcher; the battery steps and "killed" card cover it.
