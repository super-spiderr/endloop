# Endloop public site (privacy, terms, support)

Plain static pages for the Play Store listing and the in-app links:
`index.html` (support/FAQ), `privacy.html`, `terms.html`, shared `style.css`, `wordmark.svg`.
System fonts only: the licensed Clash Display / Satoshi files must never be published here.

## Before publishing
1. `sh site/set-email.sh <support email>` (replaces every `{{SUPPORT_EMAIL}}`).
2. Host it. GitHub Pages is free for **public** repos only, and this app repo is private (font licence), so copy
   this folder into a separate public repo under the Super Spider account (e.g. `superspider/endloop-site`),
   enable Pages, and you get `https://<account>.github.io/endloop-site/`.
3. Put the URLs in `src/lib/links.ts` and in Play Console (Privacy policy URL, support email, website).

## Keep the privacy policy true (rule)
Any change that affects data must update `privacy.html` (and its date) in the same change. Check this list whenever
a feature is added or changed during testing:
- A new permission in `app.json` or `modules/endloop-core/android/src/main/AndroidManifest.xml`
- Anything that sends data off the phone: network calls, analytics, crash reporting, ads, RevenueCat, cloud roast updates, AI roasts
- New data stored on the phone (new logs, typed text kept, profession/mindset for personalisation)
- Changes to sharing or saving images, retention (e.g. the 500-roast cap), or delete-all-data
- Accounts/sign-in, iOS, or new third-party SDKs
Then also update the Play Console data-safety form to match, and `docs/handoff/05-decisions-and-constraints.md`.

Current facts the policy relies on (29 Sep 2026): no network calls in the app; no analytics/ads/crash SDKs;
all data in on-device storage; share/save only when the user taps; RevenueCat + Google Play for purchases (billing not wired yet).
