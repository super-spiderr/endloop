# Endloop Product Book (spec for building)

> Source of truth for what to build: every screen and system, what's decided, Free vs Premium, and what's still open.
> Exported from the Endloop Product Book artifact on 21 Oct 2026. If this file and the code disagree, this file wins; ask before changing a decision.
> Screen designs: `design/screens/new/` for the screens added after 13 Oct (Attendance, Leave Letter, Report Card, Paywall v2, square share cards), `design/screens/out/project/` and `design/screens/s*.py` for the rest. All are copies of the "Endloop Screens" design canvas. Character images in those files point to the canvas and won't load locally; use `assets/characters/<roaster>/<pose>.webp`.
> Always: Premium is never more lenient than Free · never show raw {placeholders} · roasts target habits only · update `site/privacy.html` when data, permissions or network use change · don't commit unless asked.


Every screen and feature, what it does today, what we've decided, how Free and Premium differ, and what's still open. The working document for the v1 roadmap.

v1 planningUpdated 21 Oct 2026Owner: Vignesh · Super SpiderInternal track: Nov 2026, week 2

Start here

## At a glance

**The promise**

"The screen-time app that roasts you." The limit itself is the experience.

**Who it's for**

Anyone with high daily screen time who wants to cut it, across Reels, YouTube, games and chat. India first, Tamil Nadu first, Tanglish built in.

**Roasters**

Loop and Lupe. Polite, Honest, Savage, and Unhinged for Premium.

**Next milestone**

Build sprint from Mon 19 Oct, then the Play Console internal track in the second week of November (9–15 Nov). Not a public release.

**The Premium rule**

Premium buys stronger help, never weaker limits.

Premium can be stricter, smarter, more personal or more fun. It never gets longer snoozes, extra leaves or faster Loops. Whatever is free at launch stays free forever.

Live now Changing New, decided Planned Draft split Gold columns are Premium.

| Feature                             | Free                                                  | Premium                                              | Status  |
|-------------------------------------|-------------------------------------------------------|------------------------------------------------------|---------|
| Apps tracked                        | 3                                                     | 6                                                    | Decided |
| Roast screen, warnings, snooze game | ✅                                                    | ✅                                                   | Decided |
| Roasters                            | Loop and Lupe                                         | \+ Roaster packs                                     | Decided |
| Roast levels                        | Polite, Honest, Savage                                | \+ Unhinged                                          | Draft   |
| Languages                           | English, Tanglish                                     | Same                                                 | Decided |
| Streaks                             | Per app + all apps                                    | Same                                                 | Decided |
| Loops & Leaves                      | 2 leaves a month, earn more                           | Same amount; half-day and app-only leaves            | Decided |
| Snooze                              | 5-step ladder, 5 min, 4 games, cool-off or Bunk today | 2 min option, all games, hard mode, Strict mode      | Decided |
| Report Card                         | Today + 7 days, time won back, top excuse             | Month view, 30-day trend, weakest hour               | Decided |
| Schedules                           | One limit per app                                     | Weekday/weekend, bedtime lock, Exam mode, app groups | Draft   |
| Share cards                         | ✅ with watermark                                     | Extra styles                                         | Draft   |
| Fresh roasts and festival drops     | ✅                                                    | ✅ + early access                                    | Draft   |
| AI-personalised roasts              | —                                                     | Headline feature (v2)                                | Planned |

Launch prices: ₹39 a month, ₹199 a year (7-day trial), ₹499 lifetime; founding lifetime ₹299 for the first 500 buyers or 30 days. Internal testing uses licence testers (free test purchases) and a hidden Free/Premium switch.

Part A

## Screen by screen

In the order a new user meets them.

A1

### Onboarding

The most important 2 minutes. Shock them with their own numbers, ask for permissions only when the reason is visible, and reach the first roast fast.

Redesigned 15 Oct

| \#  | Screen                            | What happens                                                                                                                                                                                                                                                                                                     |
|-----|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1   | Welcome                           | Pick **Loop or Lupe** and **English or Tanglish**. Optional **nickname** ("What should Loop call you?"). Optional **"Which one are you?"**: 🎒 School student · 🎓 College student · 💼 Working · 🙂 Other.                                                                                                      |
| 2   | Usage Access                      | "Let me see how bad it is." Auto-return after the switch, a hint toast, and the restricted-settings steps up front for sideloaded installs.                                                                                                                                                                      |
| 3   | 💥 The reveal                     | Their real 7-day numbers: "You spent **4 h 12 m** a day. **Instagram 2 h 05 m**. That's 1 month a year." The roaster reacts. Saves the **baseline** for Loops.                                                                                                                                                   |
| 4   | Pick apps                         | Top 3 time-sinks pre-selected. A 4th tap shows a soft Premium nudge with "Maybe later".                                                                                                                                                                                                                          |
| 5   | Limits                            | Suggested limit **30% below their own average** (**20%** if the average is over 4 h a day, so heavy users can actually win week 1), rounded to 5 minutes, adjustable. Note: "Below your normal = you earn Loops."                                                                                                |
| 6   | Roast level + your goal           | Polite / Honest / Savage (Unhinged shown as Premium; **locked for school students**). Then **"Why are you here?"**: pick 📚 Exams / studies, 😴 Better sleep, 🎯 Focus at work, 👨‍👩‍👧 Family time or 🤷 Just checking how bad it is, or type your own. The goal steers some roasts (study burns, late-night lines). |
| 7   | Display over apps + notifications | Asked just before they're needed: "So I can roast you on top of Instagram." **Battery** only on Xiaomi/Redmi/POCO, Oppo/Realme, Vivo/iQOO, OnePlus, Samsung.                                                                                                                                                     |
| 8   | 🔥 Test the roast                 | A live demo roast, then "🎁 Welcome bonus: 100 Loops + 2 leaves. Day 1 starts now." → Today.                                                                                                                                                                                                                     |

#### What the profile answers drive

- **Nickname:** Leave Letters ("Yours obediently, Arun"), personal roasts and share cards.
- **"Which one are you?":** roast flavour (exams and assignments vs office and meetings), the goal options in step 6, and when to suggest Exam mode.
- **School students:** Unhinged stays locked and the default level is Honest.
- **No exact age or date of birth** is collected. Under India's DPDP Act 2023 anyone under 18 is a child, and their data needs verifiable parental consent; a group answer avoids that and is less intrusive.

#### Other changes

- The **app icon** choice moves out of onboarding into Settings.
- **"Your goal" is asked of everyone.** Free users see it on Today; Premium users also get it shown during the snooze ("Your own words").
- Nickname, group and goal are stored **on the phone only**. **Privacy policy:** add them to "What Endloop reads/stores" before this build ships.

##### Free

- The full flow
- Up to 3 apps
- Polite, Honest, Savage

##### ★ Premium

- Soft nudges only (4th app, Unhinged), never a hard paywall mid-setup
- Up to 6 apps
- Your goal shown during the snooze

#### Open points

1.  None. Onboarding closed 15 Oct. Exact goal wording is finalised in the content session (D-O).

A2

### Today (home)

The roaster is the star: mood, a roast line, today's total, and each app's state.

Live New cards

#### What it does today

- **Moods:** Chill, Suspicious (near a limit), Disgusted (one app over), Fuming (all over), Day one, Blind (Usage Access off), Bored (no apps), Day off.
- **Hero:** today's total with a comparison ("That's 3 movies.") or how far over you are.
- **App cards** with Chill / Heads up / Roasted pills and bars.
- **Streak chip** turns red ("Streak at risk") on an over-limit day.
- **Event cards:** perfect day (shareable), the watcher was killed, a tracked app was uninstalled, "How it works" (75% · 90% · 100%), "Test the roast".

#### New and changing

- **Fresh roasts card:** a one-time message when a new roast version arrives (e.g. "Diwali specials are in."). Built, needs a rebuild.
- **Battery card:** "Your phone put me to sleep at 2:14 pm. That's how Instagram got a free pass. Fix it in 2 taps."
- **Loops balance and leaves** (Part B), plus an "On leave 🏖️" mood.
- **The old free "Day off" button is removed**, replaced by Leave Letters.
- Per-app streaks on each app card.

#### Decided 15 Oct: one card at a time

Today shows **at most one event card**, chosen by priority. The next one appears once it is dismissed or dealt with:

1.  😴 Watcher killed or Usage Access off
2.  ➖ Pay it back or ❌ Strike today ("−15 min on Instagram today. You chose this yesterday.")
3.  🏖️ On leave today, or leave booked tomorrow
4.  🍿 Fresh roasts
5.  ⭐ Perfect day yesterday (shareable)
6.  Tips: How it works, Test the roast (first week only)

#### Decided 15 Oct: hero and top bar

- **"Next roast in…" line** on the hero for the app closest to its limit: "Instagram: 12 min till I show up 👀". Same number as the status notification.
- **Goal line** under the hero, small: "📚 You're here for: Exams". Over a limit it becomes "Exams, remember?"
- **Top-bar chips:** 🔥 streak · 🪙 Loops · 🎒 leaves left. Any tap opens Attendance. Replaces the separate Loops chip.

##### Free

- Everything on Today
- "Watch more than 3 apps" upsell

##### ★ Premium

- Same screen with up to 6 app cards
- Roaster-pack character in the hero

#### Open points

1.  ✅ Loops and leaves live in the **Attendance tab** (A2b). Today shows the top-bar chips that open it.
2.  Art to-do: a happy, under-limits Loop and Lupe for the Chill mood.

A2b

### 📋 Attendance tab (streaks)

A new bottom tab, the home for streaks, Loops and leaves. Tabs become **Today · Attendance · Report Card · Settings** (Stats is renamed Report Card).

Decided 15 Oct

#### What's on it (top to bottom)

- **Header:** 🔄 Loops balance this week, leaves left this month, and a countdown to Sunday midnight ("Loops clear in 2 days").
- **All-apps streak**, big, with the next milestone ("3 more days to 🔥 7").
- **Per-app streak cards:** each app's streak, today's status (clean / at risk / broken), and whether it earns Loops (limit below baseline).
- **📝 Write a Leave Letter:** active on Saturday and Sunday; greyed out on weekdays with "Opens Saturday".
- **Leave Letter flow (decided 20 Oct), full-screen in the red gradient, like Welcome:** ① pick a day (at least one day ahead) and an excuse chip → "Write my letter" · ② the letter **types itself** word by word with a cursor ("Respected Loop, I am suffering from…") while Loop reads it over his glasses · ③ a white **APPROVED** stamp lands with a thud and haptic, Loop slow-claps, "Share my letter" + Done. Designs: Screen 18 B–D in the Endloop Screens canvas.
- **Booked leaves:** upcoming leave days, with cancel and refund.
- **🛟 Streak savers** available.
- **Milestones and badges:** 3, 7, 14, 30 and 100 days, each with a share card.

#### Why its own tab

- Loops & Leaves is a full system. Squeezed into Today, it would bury the roaster.
- A dedicated place to check progress gives a daily reason to open the app.
- The weekend Leave Letter notifications have a clear place to land.

##### Free

- Everything above, for up to 3 apps
- Full-day leaves, book up to 7 days ahead
- This week's Loops

##### ★ Premium

- Up to 6 app streak cards
- Half-day and app-only leaves, book up to 30 days ahead
- 1 Streak saver every month
- Full Loops and streak history

#### ✅ School words inside the tab

- Streaks are shown as **attendance**: "Instagram: 12 days present 🔥".
- Leaves, Leave Letters, bunks, Streak savers, Pay it back and Strikes all live here.

#### ✅ First visit: a 15–20 s demo

- A pretend week plays: Mon–Fri ticks fill in while Loops count up 0 → 180; the Saturday notification drops in; the Leave Letter writes itself; the roaster stamps it APPROVED.
- A quick flash of a red "Bunked" day and a reset streak: "Don't be this guy."
- Ends with "Your turn. Day 1 starts today." and the first goal: 3 days present → first badge.
- Skippable; "How it works ▶" replays it. Built from the app's own screens with fake data, in English and Tanglish.

#### ✅ 🎁 Welcome bonus

- **100 Loops on install**, once, so the first weekend can already have a Leave Letter.
- **Week 1 exception:** if the user hasn't reached 200 Loops by their first Sunday, their Loops (bonus included) are **not cleared** but carried into week 2, with a line saying so: "Not enough for a leave yet. Your Loops carry over to next week, this once." From week 2, the normal Sunday clear applies.
- Apps with no usage history show "Learning your habits: 4 more days before this app earns Loops".

A3

### The roast screen

At 100% of a limit, a full-screen roast covers the app. This is the product.

Live Changing

#### What it does today

- Slides up over the app with a word-by-word roast from the right slot: app kind, roast level, roaster and language.
- **"Fine. Close it."** sends you home and counts as listening to the roaster. **"I need 5 more minutes"** opens the snooze.
- Reopen within 10 minutes and the roast gets harsher.
- Share the roast as an image (90 s grace after sharing).
- Never blocks Settings, the phone app, Play Store or system screens.

#### What's changing

- **Media pauses** the moment the roast appears.
- **No picture-in-picture on close:** we leave through our own invisible screen, so YouTube and similar apps can't shrink into a corner and keep playing.
- **Landscape layout:** character on the left, text and buttons on the right. Never scrolls, handles rotation, never forces orientation.
- **Snooze:** a 5-step ladder with games and cool-offs, never a hard wall (A4).
- **Personal numbers, escalation through the day and a clearer share button** (decided 15 Oct, below).

#### ✅ Personal numbers in every roast

- Roasts use the user's real numbers: {opens}, {time}, {limit}, {over}, {streak}.
- The roast screen fills all of them, and new lines are written to use them.

"4th time opening Instagram today. 1 h 12 m gone. Again?"

"Limit was 45 min. You're at 58. Maths isn't your strong subject either."

#### ✅ Share, without becoming an escape

- A visible **"📸 Share this roast"** button, smaller than "Fine. Close it.".
- The card shows the roast, the roaster, the user's numbers, and "Get roasted too → Endloop" with the Play link.
- After sharing: *"Posted your shame. Respect."* The app still closes as normal.
- The share grace period is given **once a day** only, so sharing can never work as a free snooze.

#### ✅ The roast escalates through the day

| Roast today | Line                                                               | Pose         | Look and feel                                              |
|-------------|--------------------------------------------------------------------|--------------|------------------------------------------------------------|
| 1st         | Light, teasing                                                     | Arms crossed | Normal Endloop red                                         |
| 2nd         | Sharper, refers to the 1st ("Back already? It's been 40 minutes.") | Disgusted    | Darker red                                                 |
| 3rd+        | Savage, with numbers and the streak at risk                        | Fuming       | Deepest red, a small shake, a heavier sound if sound is on |

This extends today's "reopen within 10 minutes is harsher" rule to the whole day. The count resets at midnight. The roast library gets lines tagged by roast number.

##### Free

- Full roast screen, with personal numbers and escalation
- Loop and Lupe, 3 levels, both languages
- Share card with watermark

##### ★ Premium

- Unhinged level
- Roaster-pack characters and lines
- Extra share-card styles

#### ✅ Holes to fix (all approved 15 Oct)

| \#  | Hole                                                          | Fix                                                                                                                                                             |
|-----|---------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| H1  | Roast covers a WhatsApp or other call                         | If a call is active, wait until it ends, then roast. Never pause media during a call.                                                                           |
| H2  | Instagram opened in Chrome instead                            | Allow tracking the browser too. Roast line: "Switched to Chrome? Cute. I'm watching Chrome too now." (Websites themselves can't be seen without Accessibility.) |
| H3  | Dual / clone apps (Xiaomi Dual apps, Samsung Dual Messenger)  | Detect the second copy and track it together with the original.                                                                                                 |
| H4  | Split-screen and pop-up windows                               | Test on Samsung and Xiaomi. Time always counts; roast at the next full open if it was missed.                                                                   |
| H5  | Back key on the roast                                         | Back always acts as "Fine. Close it." and goes home, never back into the app.                                                                                   |
| H6  | Changing the phone's date or time                             | Count by Android's internal clock, and ignore large jumps for days, snoozes and Loops.                                                                          |
| H7  | Turning Endloop off (force stop, Usage Access or overlay off) | Already detected on Today. Add to the weekly roast: "You switched me off for 3 hours on Tuesday. I noticed."                                                    |
| H8  | A snooze running past midnight                                | It counts to the day it started; the ladder and roast count reset at midnight.                                                                                  |

#### ✅ Share card: one square format

- **1080 × 1080 square**, the same card for Instagram (feed and Stories) and WhatsApp Status.
- On Instagram Stories, the square sits on an Endloop-red background so it still fills the screen.

#### ✅ 3rd-roast sound: a "faah"

- A "faah"-style reaction plays when the 3rd roast of the day appears.
- **Our own recording**, in the roaster's voice, not the viral clip, which belongs to its creator. Our version becomes a brand sound we own.
- **Off by default** (class, meetings, buses); users turn it on in Settings.

A4

### Snooze: the ladder

"I need 5 more minutes" is always possible, but every ask costs more than the last. No typing, no hard wall, and no reason to uninstall.

Decided 15 Oct

**Principle**

Never block completely. Always leave a way through, and make each one cost more.

A trapped user uninstalls. A user who stays, even after giving up for a day, still gets roasted tomorrow. The only full block is Premium Strict mode, which the user turns on for themselves.

| Snooze today | Challenge                                                                                           | Time it costs | Then                              |
|--------------|-----------------------------------------------------------------------------------------------------|---------------|-----------------------------------|
| 1st          | **Convince:** pick a reason; the roaster roasts it back; a 5-second countdown that can't be skipped | ~10 s         | +5 min                            |
| 2nd          | **Reflex game**, one picked at random                                                               | up to ~20 s   | +5 min                            |
| 3rd          | **Harder game**, one picked at random                                                               | up to ~45 s   | +5 min                            |
| 4th          | ⏳ **2-minute cool-off** (watch the roast, can't skip) **or** 🏃 **Bunk today**                     | 2 min         | +5 min, or that app is free today |
| 5th+         | ⏳ **5-minute cool-off** **or** 🏃 **Bunk today**                                                   | 5 min         | +5 min, or that app is free today |

#### Rules for every step

- **Every game has a fallback timer.** Win → in early. Don't win → in when the timer ends. Nobody gets stuck.
- **Random rotation** at steps 2 and 3, so nobody learns one game by heart.
- The ladder **counts snoozes across all apps**, per day, and resets at midnight.
- The roaster heckles throughout. All lines live in the board, in English and Tanglish.
- One thumb, no keyboard, works in portrait and landscape.
- **TalkBack users** get a plain countdown of the same length instead of a game.

#### What a snooze costs (shown on screen)

- A snooze means going past the limit, so **that app isn't clean today**: its streak breaks and it earns no Loops today.
- The snooze screen says so before you choose:

"Snoozing breaks your 🔥 12-day Instagram streak and today's Loops for Instagram."

People hate losing a streak more than they like gaining one. This line stops more snoozes than any game.

#### Step 1 · Convince

- Pick a reason: "Just one reel" · "Waiting for a reply" · "I'm bored" · "It's for work" · …
- The roaster answers that reason: *"Just one reel. Like the last 47."*
- A 5-second countdown follows, which can't be skipped.
- Every reason is logged on the phone for the weekly roast ("You said 'just one reel' 9 times this week") and, later, AI roasts.

#### Step 4+ · Cool-off or give up

- **⏳ Cool-off:** the roast stays on screen with a countdown ring and the roaster keeps going: *"Still here? Your friends finished a movie in this time."* Most people give up partway, which is the point.
- **🏃 Bunk today** (themed name for "give up today"): no more roasts for **that app** until midnight.
- If the user has a leave, the bunk uses it: *"Bunk approved, using your Sunday leave. Retroactive leave letter filed. Don't make it a habit."*
- With no leave left, the user **chooses their punishment**: ⏳ **1-min timeout** (wait 1 minute now, then bunk) or ➖ **Pay it back** (bunk now; tomorrow that app gets 15 minutes less, for one day).
- Always: ❌ a **Strike** ("Bunked") on that app's card in the Attendance tab for the rest of the week, the streak breaks, no Loops for that app today, and a weekly-roast mention: *"Wednesday: you bunked Instagram at 4:12 pm."*
- Other apps keep their limits as normal.

#### The games

| Game                     | Step       | How you win                                                                                                                | Fallback | v1?                          |
|--------------------------|------------|----------------------------------------------------------------------------------------------------------------------------|----------|------------------------------|
| 🎯 Catch Loop            | 2 · reflex | Tap the hopping roaster 5 times; he speeds up                                                                              | 20 s     | ✅ Free                      |
| 🚦 Reaction test         | 2 · reflex | Tap the moment it turns green, 3 times; an early tap resets                                                                | 20 s     | ✅ Free                      |
| ✊ Stone paper scissors  | 3 · harder | Win 2 in a row against the roaster, who openly cheats sometimes                                                            | 45 s     | ✅ Free                      |
| 👋 Swipe him away        | 2 · reflex | Swipe the roaster off 6 times as he pops back in                                                                           | 20 s     | ✅ Free (moved 16 Oct)       |
| 🧠 Remember the apps     | 3 · harder | Repeat a sequence of 4 app icons                                                                                           | 45 s     | Later · Premium              |
| 📱 Count the Reels       | 3 · harder | Icons flash fast; say how many Instagram icons you saw                                                                     | 45 s     | Later · Premium              |
| 🔔 Pop the notifications | 2 · reflex | Pop only the red Instagram bubbles as they float up; a wrong pop ("You popped Mom. Wow.") costs a point                    | 20 s     | Later · Premium (new 16 Oct) |
| 📵 Put it down           | 3 · harder | Leave the phone flat and untouched for 15 s (motion sensor); picking it up resets. "The only game you win by not playing." | 45 s     | Later · Premium (new 16 Oct) |

Each game is a small native view inside the roast screen (shapes plus the roaster's face, no game engine), about 1–2 days each. New games ship as "drops", a marketing beat like festival roasts: "New snooze game: Count the Reels. Good luck."

##### Free

- The full ladder, with a way through at every step
- Snooze length: 5 min
- 4 games: Catch Loop, Reaction test, Swipe him away (reflex) and Stone paper scissors (harder; the only harder game in Free for v1)
- Cool-off and Bunk today
- Top snooze reason in Report Card

##### ★ Premium

- Choose a shorter snooze: 5 or 2 min
- **All games:** the 4 Free games plus Remember the apps, Count the Reels, Pop the notifications and Put it down, released as drops after launch
- **Hard mode:** faster games and more rounds (fallback timers never get shorter)
- **Strict mode:** after the 3rd snooze, only "Fine. Close it." No cool-off, no bunking. The user turns it on; it can only be turned off from the next day.
- **"Your own words"**: your own goal shown back to you when you try to snooze
- Full snooze history: which reason, which app, what time
- Roaster pack characters heckle during games

#### Open points

1.  ✅ **"Your own words"** (Premium, decided): the user writes why they want to cut down ("I want to clear my CA exam"), shown during the convince step and the cool-off.
2.  ✅ Reason list for step 1: **by app category** (Social, Video, Chat, Games, Shopping, Browser) plus 4 always-shown reasons (Bored, Work/study, Something else, Can't sleep at night). Replies are general roasts, not app-specific. Drafted in English and Tanglish; stored in the board, 2–3 replies per reason. Final wording in the content session (D-O).
3.  ✅ "Give up today" and the leave cap (decided): it **uses a leave if the user has one** ("You just burned your Sunday leave on Instagram"). With no leaves left it's still allowed, but costs the streak, the day's Loops and a weekly-roast mention, so nobody is ever trapped.
4.  Watch the testers' snooze rate. Target: under 0.5 snoozes per roast.

A5

### Apps & limits

Each tracked app has its own page: limit, today's use, and changes that can't be gamed.

Live

#### What it does today

- One daily limit per app, with warnings at 75% and 90% and the roast at 100%.
- **Anti-cheat:** raising a limit or removing an app takes effect tomorrow, not now.
- An uninstalled tracked app is dropped quietly and its slot freed.

#### Linked to Loops

- An app only earns Loops if its limit is **below its baseline** (its normal daily use).
- **Decided:** each app page shows "Your normal" (baseline) next to "Your limit" with a live pill: 🪙 **Earning Loops** or ⛔ **Not earning** ("3 h limit? That's not a limit, that's a lifestyle."). The pill updates as the slider moves.

#### Decided 16 Oct: limit below today's use

- If the new limit is **below what's already used today**, confirm first: "You've already used **52 min** today. A 45 min limit means I roast you **right now**."
- **\[Apply from tomorrow\]**: today keeps the old limit. **\[Roast me now 🔥\]**: roast fires at once with a special line ("Bold. Respect. Now close it.").
- Lowering to a value still above today's use applies instantly with no popup. Raising still waits for tomorrow.

##### Free

- 3 apps
- One daily limit per app

##### ★ Premium

- 6 apps
- Weekday / weekend limits (v1)
- v1.1, or v1 if time allows: Bedtime lock, App groups ("All social: 2 h"), Exam mode

#### Open points

1.  ✅ 3 apps Free, 6 apps Premium (decided 16 Oct).
2.  ✅ Limit below today's use: confirm first (decided 16 Oct).
3.  ✅ Baseline + earning pill on each app page (decided 16 Oct).
4.  App groups: how streaks and Loops count for a group (only when groups are built).

A6

### 📒 Report Card (formerly Stats)

Where the time went: daily totals, per-app history, roasts, snooze reasons and wins. Renamed to fit the school theme; streaks moved to the Attendance tab.

Live Draft split

#### What it does today

- Daily totals and per-app history, kept on the phone.
- Roast history (the most recent 500) and the snooze reasons picked.
- Wins: closed on first roast, perfect days, streaks.

#### Decided 16 Oct

- **Split:** Attendance = streaks, Loops, leaves. Report Card = where the time went. Nothing shown twice.
- **Per-app rows:** this week vs your normal ("Instagram 9 h 40 m ↓ 32% 🟢"). No grades.
- **One roaster line** for the week at the top, in the roaster's own voice (no teacher act).
- **Time won back** (free): "6 h 20 m back this week = 3 movies 🍿".
- **Top snooze reason:** "Most used excuse: *Just one message* (9 times)."
- Leave days still count in the numbers, so the week stays honest.

##### Free

- Today + last 7 days
- Per-app vs normal, time won back, top excuse

##### ★ Premium

- Month view and full history
- 30-day trend line
- Worst-hour strip ("You're weakest at 11 pm–1 am")

#### Open points

1.  ✅ Time won back stays free; the worst-hour strip is the Premium hook.

A7

### Weekly roast

Sunday evening: total, worst app, best streak and one roast, as a shareable card.

Live

#### What it does

- Arrives on Sunday from 19:00 as a notification and a full-screen card.
- One tap to share to Instagram Stories or WhatsApp Status, or save.
- Different lines for a good, bad, mixed or first week.

#### Fits with Loops

- **Decided 16 Oct: one Sunday 7 pm moment.** A single notification: "Your week is in. Instagram ↓ 32%, YouTube ↑ 12%. And 240 Loops expire at midnight 👀"
- Tap → full-screen weekly card (shareable), with **📝 Write a Leave Letter** under it if they have 200+ Loops, or "Loops reset tonight" if not.
- The Saturday 10:00 Loops reminder stays separate (plan your weekend).

##### Free

- Weekly roast and share card with watermark

##### ★ Premium

- Extra card styles
- Roaster-pack voice

#### Open points

1.  ✅ Merged into one Sunday 7 pm notification (decided 16 Oct).

A8

### Notifications

Warnings before the roast, nudges at the right moment, and one quiet status line.

Live Changing

| Notification                                      | When                           | Status   |
|---------------------------------------------------|--------------------------------|----------|
| Heads-up                                          | 75% of a limit                 | Live     |
| Last call                                         | 90% of a limit                 | Live     |
| Late night                                        | Bedtime → 5 am, once a night   | Live     |
| Weekly roast + Loops last call (one notification) | Sunday 7:00 pm                 | Changing |
| Status ("Loop is watching")                       | Always, while the watcher runs | Changing |
| Loops: write a Leave Letter                       | Saturday 10:00 am              | New      |
| Streak at risk                                    | Evening, if a limit is close   | Planned  |

#### The status notification

- It can't be removed: Android requires it for the background watcher. Digital Wellbeing avoids it only because it's a built-in system app.
- Becomes a silent, minimum-priority channel with a live counter: Instagram 42/60 min · Loop is watching 👀
- Users can swipe it away on Android 13+ and the watcher keeps going.

#### Free vs Premium

- All notifications are free.
- Status notification: Live counter or Minimal, for everyone.

A9

### Settings, privacy & about

Roaster, level, language, notifications, limits, permissions, data and the roast library version.

Live

#### What it does

- Change roaster, roast level and language (English / Tanglish).
- **What Endloop can see** and **Delete all my data**.
- **About → Roast lines** shows the roast version; tap to check for new lines.
- Premium banner: "Watch more than 3 apps with Premium".

#### Adding

- Status notification: Live counter / Minimal.
- Battery row uses the new 2-tap flow.
- Premium: lock settings until tomorrow, snooze length choice.

##### Free

- All settings and privacy controls

##### ★ Premium

- Unhinged level
- Strict mode and settings lock
- Roaster packs, extra app icons

Part B

## The systems behind the screens

How streaks, Loops, the roast library and reliability work, with the calculations.

B1

### Streaks

Per-app streaks plus one all-apps streak, so a bad YouTube day doesn't wipe out your Instagram progress.

Decided

#### Today in the app

- The streak is set to 1 when onboarding finishes and shown as a chip on Today.
- **No code we can find increases or resets it** (the Kotlin side is unchecked). Ask testers if theirs ever passed Day 1.

#### How it will work

- **App streak +1** for each day that app stays under its limit.
- **All-apps streak +1** when every tracked app stays under its limit.
- Over the limit → that app's streak resets to 0.
- **Leave day** → streaks paused, not broken.
- Calculated in the background from each day's summary, so it works without opening the app.

#### Milestones

3 days7 days · rare smile14 days30 days · Streak saver100 days

"Naama jeichitom machan! 🔥 7 days streak."

#### 🛟 Streak saver (streak freeze)

- Saves a broken streak once. Earned, never sold.

##### Free

- Per-app + all-apps streaks
- Earn 1 Streak saver per 30-day all-apps streak

##### ★ Premium

- Same streaks
- 1 Streak saver every month, plus the same earning

#### Open points

1.  Does an app with a limit above its baseline still get a streak, or only no Loops? (Proposed: streak yes, Loops no.)
2.  Milestone share card design.

B2

### Loops & Leaves

Break the loop, earn Loops. Spend them on a Leave Letter at the weekend. Daily, weekly and monthly reasons to come back.

Decided

| Thing         | Name            | What it is                              |
|---------------|-----------------|-----------------------------------------|
| Currency      | 🔄 Loops        | Earned daily for staying under limits   |
| Day off       | 📝 Leave Letter | A full day with no roasts, booked ahead |
| Streak freeze | 🛟 Streak saver | Saves a broken streak once              |
| +10 min break | 🚔 Bail         | Not in v1                               |

#### 1 · Baseline (actual usage)

- At setup, Android already holds the last ~7 days of usage per app. Baseline = **7-day daily average**, saved once and kept fixed.
- Apps with no history get a baseline from their first 7 tracked days, and earn nothing until then.
- **Earning rule:** an app earns Loops only if its limit is below its baseline.

#### 2 · Earning every day

Daily Loops = *30* × (apps under limit ÷ apps tracked)  
           + *10* if every app is under  
Cap: *40* a day · credited at midnight

Sharing by proportion means 3 apps (Free) and 6 apps (Premium) earn at the same pace.

**20**Free · 2 of 3 apps clean

**20**Premium · 4 of 6 apps clean

**40**Anyone · every app clean

**0**A 6 h limit on a 3 h habit

#### 3 · The weekly loop

- The week runs Monday to Sunday.
- **Saturday 10:00 am:** "You've got 180 Loops. Write a Leave Letter!"
- Write a letter: **200 Loops → 1 Leave**.
- **Sunday 7:00 pm:** part of the weekly roast notification: "…and 240 Loops expire at midnight 👀"
- **Loops clear Sunday at midnight**: use them or lose them. That urgency brings people back every weekend.

#### 4 · Using a leave

- **2 free leaves** on the 1st of each month (and on install). They expire at month end.
- Pick the day **at least 1 day ahead**. Cancel before the day for a refund.
- **Max 1 a week, 4 a month** (free plus earned).
- On the day: no roasts, the roaster is "On leave 🏖️", streaks paused, usage still counted.

#### The Leave Letter

Respected Loop,  
I am suffering from **India match. Non-negotiable.** Kindly grant me leave on Sunday.  

Yours obediently,  
Arun

"Leave approved. But I'm watching you Monday."

🏏 India match💍 Cousin's wedding🎬 FDFS ticket booked📚 Exam over, brain reboot🌧️ Rainy day, Netflix🤒 Fever (fake, we both know)

The reasons live in the board like roast lines (English and Tanglish), so festival reasons can be added without an app update.

[TABLE]

#### Open points

1.  Where a user can see their Loops balance (Today chip, a Loops screen, or both).
2.  Should the Leave Letter itself be shareable as a card? (Strong marketing moment.)
3.  Clock tampering: changing the phone's date to clear or book leaves. Low priority for v1.

B3

### Roast library & cloud packs

Every roast line, managed from the board and updated without an app release.

Live

#### How it works

- One id per **slot** (moment × level × app kind × roaster), one file per language. The Tanglish line can be a different joke.
- v1 live: **223 English + 180 Tanglish** lines.
- Every language × level × app kind has at least 1 line, or publishing is blocked.
- The app checks every 6 hours and on open, downloads only what changed, and keeps working offline.
- Lines can carry from/to dates for festivals.

#### The Roast admin (board)

- Edit one line or many, import files, check coverage, see exactly what changes, publish a version, roll back.
- Optional "Message for users" per version → the Fresh roasts card on Today.

#### Writing rules

- Roast the habit, never the person.
- Never show a raw {placeholder}.
- Everyday Tamil slang is welcome ("aahaan", "semma", "naama jeichitom"). Famous film dialogues get reworded.

#### Coming

- New slots: stone paper scissors (rps\_\*), Leave Letter reasons.
- Draft lines from 13 Oct to add for polishing.
- Daily background check (so festival lines arrive without opening the app) and a native festival-date check.

B4

### Roaster packs

New characters with their own art and lines. Premium, collectible, and each one a reason to post.

Decided Planned

#### Candidates

- **Strict Amma:** "Saapadu aaridichu. Nee innum YouTube la iruka."
- **Comedy Uncle:** "Naan un vayasula 10 km nadandhu school ponen."
- **Mass Hero:** "Scroll pannradhu un hobby. Unna stop pannradhu en duty."
- **Hostel Senior** and **Kollywood Villain**.
- Creator packs with Tamil meme pages, with their consent.

#### The rule

- No real actors, named or unnamed: no faces, look-alikes, voices or signature dialogues. Personality rights and Play policy both apply.
- Tamil comedy styles and everyday slang are fine.
- Official celebrity packs only with a signed licence.

##### Free

- Loop and Lupe, forever

##### ★ Premium

- Roaster packs included
- Pack voice for Leave Letters and share cards

#### Open points

1.  First two packs: Strict Amma and Comedy Uncle?
2.  Sell single packs (₹49–99) to free users too?
3.  Art direction for the new characters.

B5

### Background reliability

The watcher has to stay alive on every phone, or nothing else matters.

Prompt ready

| Problem                           | Fix                                                                                                                                        |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Long permission setup             | Return to Endloop automatically once a permission is switched on; a hint toast; restricted-settings steps up front for sideloaded installs |
| "Restricted settings" for testers | Move testers to Play internal testing. Play installs don't get it.                                                                         |
| Battery "Optimized"               | Only on aggressive brands, or once the watcher has been killed. Endloop's own App info, 2 taps. No restricted one-tap dialog.              |
| Picture-in-picture after close    | Pause media and exit through our own invisible screen                                                                                      |
| Always-on notification            | Quiet channel, live counter, swipeable on Android 13+                                                                                      |
| Roast screen in landscape         | Two-column layout, no scrolling                                                                                                            |

B6

### Premium & the paywall

How the line is drawn, and how it sells.

Draft split

| Bucket                     | Rule                                               | Examples                                                                  |
|----------------------------|----------------------------------------------------|---------------------------------------------------------------------------|
| Free forever               | The core promise and anything that spreads the app | Roast screen, Loop and Lupe, Tanglish, sharing, fresh roasts, privacy     |
| Limit → Premium lifts it   | Same feature, more of it                           | 3 → 6 apps, 7 days → full stats                                           |
| Default → Premium controls | Same feature, more control, never more lenient     | Shorter snooze, strict mode, half-day and app-only leaves, weekday limits |
| Premium only               | New value                                          | Roaster packs, Unhinged, app groups, Exam mode, AI roasts (v2)            |

#### The upgrade moment

"Three apps? You've got at least six problems. Premium."

The 4th app is the natural upgrade moment for a heavy user on day one.

#### Pricing

₹39 / month₹199 / year₹499 lifetimeFounding lifetime ₹299 (first 500 or 30 days)7-day trial on yearly

Lowered 16 Oct after people said ₹99 was too much for screen-time restriction. Shown as **"Launch price"**, so later increases for new users are expected; existing subscribers keep their price.

Billing through Google Play and RevenueCat. Not in the internal test.

#### Open points

1.  ✅ Sell Premium from day 1 of public launch (no "Coming soon"), with a founding-member lifetime offer (decided 16 Oct).
2.  ✅ Launch prices ₹39 / ₹199 / ₹499, founding lifetime ₹299, 7-day trial on yearly (decided 16 Oct).
3.  ✅ Paywall shows at: 4th app, Unhinged, a Premium game, half-day leave, blurred worst-hour strip. **Never on the roast screen.** Max one full-screen paywall a day; the rest are inline nudges. Paywall copy in the roaster's voice, fun first.
4.  ✅ Tester builds get a hidden Free/Premium switch (Settings → About); licence testers also make free test purchases.
5.  Payments setup: Google Play Billing + RevenueCat; licence testers can make free test purchases in the internal track.
6.  Final split after feedback: what testers actually used and wished for.

Part D

## Before code: images, UI and content

Decided 16 Oct: coding starts only after these three are done. Content goes first because the words decide the layouts and the poses.

D1

### Content (roasts and every line)

English and Tanglish, Polite / Honest / Savage, plus Unhinged where it applies. Drafted by Claude, locked in the content session.

To do

| \#  | Area              | What's needed                                                                                                                                                                                   |
|-----|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| C1  | **Roast screen**  | Tag existing lines 1st / 2nd / 3rd; personal-number versions                                                                                                                                    |
| C2  | **Snooze**        | Convince lines; reasons by category (social, video, games, chat, shopping, other) + replies; game intro/win/lose/tie; cool-off; Bunk, timeout, Pay it back, Strike; Strict mode; Your own words |
| C3  | **Today**         | Mood lines, "Next roast in…", goal lines for 5 goals, every event card                                                                                                                          |
| C4  | **Onboarding**    | Reveal reactions by usage band, group-based flavour, Welcome bonus, test roast                                                                                                                  |
| C5  | **Attendance**    | Loops and leaves, Leave Letter reasons + approvals, milestones, Streak saver, week-1 carry-over, demo script                                                                                    |
| C6  | **Report Card**   | Week lines (good / bad / mixed / first), time-won-back comparisons, top excuse                                                                                                                  |
| C7  | **Apps & limits** | Earning / Not earning, below-today confirm, "Bold. Respect."                                                                                                                                    |
| C8  | **Notifications** | 75%, 90%, late night, Saturday Loops, Sunday merged, status line, battery card                                                                                                                  |
| C9  | **★ Paywall**     | Headline per entry point (4th app, Unhinged, game, half-day, worst hour), founding, trial, Launch price, welcome, Premium ended                                                                 |
| C10 | **Share cards**   | Captions for each card                                                                                                                                                                          |

D2

### UI designs

New screens and updates to existing ones, in portrait and landscape where it matters.

To do

| \#  | Screen                      | What's new or changing                                                                                                |
|-----|-----------------------------|-----------------------------------------------------------------------------------------------------------------------|
| U1  | **Onboarding**              | Welcome with nickname + "Which one are you?", the reveal, goal step, limits at 30%/20%, Welcome bonus                 |
| U2  | **Today**                   | Top chips (streak · Loops · leaves), "Next roast in…" line, goal line, one event card and all its states              |
| U3  | **📋 Attendance (new tab)** | Header, all-apps streak, per-app cards, Leave Letter write → approved, booked leaves, Streak savers, first-visit demo |
| U4  | **Roast screen**            | 1st / 2nd / 3rd escalation, share button and square 1080 card, landscape                                              |
| U5  | **Snooze ladder**           | 5 steps, 4 games, cool-off, Bunk choice (timeout / Pay it back), Strict mode, Your own words, landscape               |
| U6  | **Apps & limits**           | Weekday/weekend limits, baseline + Earning pill, below-today confirm                                                  |
| U7  | **📒 Report Card**          | Per-app vs normal, roaster line, time won back, top excuse, locked worst-hour strip, Premium month view               |
| U8  | **Weekly roast**            | Sunday card with Loops expiring and Write a Leave Letter                                                              |
| U9  | **Settings**                | Status notification, app icon (moved here), Strict mode, tester Free/Premium switch                                   |
| U10 | **★ Paywall**               | Plans with Launch price, founding ₹299, yearly trial; full screen vs inline nudge; every entry point                  |
| U11 | **Share cards**             | Roast, milestone, Leave Letter, weekly: 1080 square                                                                   |

D3

### New poses

30 new poses, each for Loop and Lupe (about 60 images). Same pipeline: flat \#00FF00 green in ChatGPT, reference still attached, process.py. Existing paywall poses stay: savage (4th app), evil grin (Unhinged), chess (lifetime), bow (welcome), goodbye (Premium ended).

To do

| Screen                | \#  | Pose                               | Used for                                                   | Priority                 |
|-----------------------|-----|------------------------------------|------------------------------------------------------------|--------------------------|
| Onboarding            | P1  | **Drumroll**                       | Step 3: the 7-day reveal                                   | A                        |
| Onboarding            | P2  | **Chin on hand, curious**          | Step 1 "Which one are you?" and step 6 "Why are you here?" | A                        |
| Onboarding            | P3  | **Holding a gift box**             | Step 8: 🎁 Welcome bonus                                   | A                        |
| Today                 | P4  | **Happy chill (under all limits)** | Chill mood, the long-pending art to-do                     | A                        |
| Today                 | P5  | **Writing an ✗ in a notebook**     | Pay it back / Strike card                                  | A                        |
| Attendance            | P6  | **Proud, arms folded**             | All-apps streak header                                     | B (can reuse flex)       |
| Attendance            | P7  | **Rare smile**                     | 7-day milestone                                            | A                        |
| Attendance            | P8  | **Reading a letter with glasses**  | Leave Letter being read                                    | A                        |
| Attendance            | P9  | **Stamping APPROVED**              | Leave Letter approved                                      | A                        |
| Attendance            | P10 | **Throwing a lifebuoy**            | 🛟 Streak saver used                                       | A                        |
| Snooze                | P11 | **Game face (headband)**           | Game step starts                                           | A                        |
| Snooze                | P12 | **Smug**                           | Roaster wins a game round                                  | A                        |
| Snooze                | P13 | **Sore loser**                     | User wins the game                                         | A                        |
| Snooze                | P14 | **Stone / paper / scissors hands** | RPS throws                                                 | B (emoji in code for v1) |
| Snooze                | P15 | **Tiny running roaster sprite**    | Catch Loop game target                                     | A                        |
| Snooze                | P16 | **Finger on a buzzer**             | Reaction test                                              | A                        |
| Snooze                | P17 | **Pointing at the door**           | 🏃 Bunk today                                              | A                        |
| Snooze                | P18 | **Foot tapping, arms crossed**     | ⏳ 1-min timeout                                           | A                        |
| Snooze                | P19 | **Scissors cutting a clock**       | ➖ Pay it back (−15 min tomorrow)                          | A                        |
| Snooze / Settings     | P20 | **Padlock**                        | Strict mode (Premium)                                      | A                        |
| Snooze                | P21 | **Holding up a note**              | Your own words (Premium)                                   | A                        |
| Roast screen          | P22 | **Meltdown (beyond fuming)**       | 3rd+ roast of the day, with the shake and faah             | A                        |
| Report Card           | P23 | **Popcorn**                        | Time won back                                              | A                        |
| Report Card           | P24 | **Air quotes**                     | Top excuse                                                 | A                        |
| Report Card / Paywall | P25 | **Magnifying glass**               | Worst-hour strip (Premium)                                 | A                        |
| Apps & limits         | P26 | **Salute**                         | "Bold. Respect." limit below today's use                   | B (can reuse slow clap)  |
| Paywall               | P27 | **Wearing a crown**                | Founding lifetime offer                                    | A                        |
| Paywall               | P28 | **Handing over a key**             | 7-day free trial                                           | A                        |
| Paywall               | P29 | **Holding a game controller**      | Paywall from a Premium game                                | A                        |
| Paywall               | P30 | **Holding half a calendar page**   | Paywall from half-day leave                                | B (can reuse vip)        |

Priority A = needed for v1. B = can reuse an existing pose or be drawn in code if time is short.

Part C

## To discuss, one by one

Ideas on the table and empty slots for new ones. Each gets a decision, then a place in Parts A and B.

D-A

#### Smart onboarding from real usage

Suggest the user's own worst apps and limits from their last 7 days.

D-B

#### Share cards for Stories and Status

Roast of the day, weekly roast, Leave Letters, milestones. Watermark plus Play link.

D-C

#### Challenge a friend

Whoever breaks their limit first gets roasted in the other's app.

D-D

#### Exam mode

Stricter limits and exam-season roasts during boards and semesters.

D-E

#### Festival drops

Diwali, Pongal, IPL and results day as marketing beats with new lines.

D-F

#### Tamil creator launch

Meme pages and comedians with their own lines and packs.

D-G

#### Play Store listing

Keywords and screenshots. "Digital Wellbeing pauses your app. Endloop roasts you."

D-H

#### Referral

Invite 3 friends → a week of Premium or a roaster unlock.

D-I

#### AI-personalised roasts

Roasts built from real habits. The v2 Premium headline.

D-J

#### Privacy-safe analytics

Anonymous counts to measure what works. Needs a privacy policy update.

D-K

#### Tester feedback round

Bugs, quick fixes, Free features and Premium candidates from the test APK.

D-O

#### Content finalisation session

Go through every roast line, snooze reason and reply, Leave Letter reason, notification and in-app message, in English and Tanglish, and lock the final wording before the internal build.

D-L

#### Your next idea

D-M

#### Your next idea

D-N

#### Your next idea

Record

## Decision log

12 Oct 2026

- One id per roast slot, one file per language.
- Roast packs hosted in the cloud, updated without an app release; downloads automatic and silent.

13 Oct 2026

- Target: high-screen-time users across all apps, not gamers specifically. Landscape must still work.
- Stone paper scissors replaces typing for snooze, with escalation.
- First build on the Play internal track in Nov week 1; testers move there.
- Battery: no restricted dialog; aggressive brands or just-in-time only.
- Status notification stays: quiet, useful, swipeable.
- No developing on the go: feedback first, then the v1 roadmap.
- Premium buys stronger help, never weaker limits. 3 apps free, 10 Premium.
- Roaster packs: original characters only.
- Streaks per app plus all apps.

15 Oct 2026

- Loops & Leaves: 2 free leaves a month, cap 40 Loops a day, Loops clear every Sunday at midnight.
- Max 1 leave a week and 4 a month, booked a day ahead.
- The free Day off button is replaced. Bail is not in v1.
- Notifications on Saturday 10 am and Sunday 7 pm. Leave reasons live in the board. A half-day counts as ½ and is Premium only.
- **Snooze ladder:** convince + 5 s → reflex game → harder game → 2-min cool-off or give up today → 5-min cool-off or give up. Typing dropped. Never a hard wall in Free.
- A snooze breaks that app's streak and Loops for the day, shown on screen. The ladder counts across all apps.
- v1 games: Catch Loop, Reaction test, Stone paper scissors. Premium: all games, hard mode, 2-min snooze, Strict mode (off only from the next day).
- **Bunk today** (renamed from Give up today) uses a leave if one is available; otherwise the user chooses a 1-min timeout or Pay it back (−15 min tomorrow), plus a Strike, streak break and no Loops. **New Streaks tab** for streaks, Loops and leaves.
- **Onboarding redesigned** (8 steps): the 7-day numbers reveal sets the baseline, top apps pre-selected, limits suggested, goal asked of everyone, optional nickname and "Which one are you?" (no exact age), Unhinged locked for school students, app icon moved to Settings. Suggested limit 30% below average (20% above 4 h a day), rounded to 5 min. Goals: Exams, Sleep, Focus at work, Family time, Just checking.
- **Today:** one event card at a time by priority (watcher/Usage Access → Pay it back/Strike → leave → Fresh roasts → Perfect day → tips); "Next roast in…" hero line; goal line; top-bar chips (streak, Loops, leaves) open Attendance.
- **Apps:** 3 Free, **6 Premium** (was 10). Premium in v1 on Apps & limits = 6 apps + weekday/weekend limits; Bedtime lock, App groups and Exam mode in v1.1 unless time allows. Limit below today's use asks first (Apply from tomorrow / Roast me now). Each app page shows baseline + Earning / Not earning pill.
- **Report Card:** time only (streaks/Loops in Attendance); per-app week vs normal, one roaster line, time won back (free), top snooze reason; Premium = month, 30-day trend, worst hour. **Theme rule:** school theme only in a few names; everything users read is in the roaster's voice.
- **Renamed (16 Oct, less school):** Admission bonus → 🎁 Welcome bonus; Stand outside → ⏳ 1-min timeout; Detention → ➖ Pay it back; Red remark → ❌ Strike; Medical Certificate → 🛟 Streak saver; Principal's office dropped. Kept: Attendance, Report Card, Leave Letter, Bunk today.
- **Sunday 7 pm:** weekly roast and Loops last call merged into one notification; tap opens the weekly card with Write a Leave Letter (200+ Loops) under it. Saturday 10:00 reminder stays.
- **Premium:** sell from day 1; launch prices ₹39/month, ₹199/year (7-day trial), ₹499 lifetime, founding lifetime ₹299 for the first 500 or 30 days, labelled "Launch price". Paywall never on the roast screen, max one full-screen a day. Payments via Play Billing + RevenueCat.
- **Leave Letter:** animated red-gradient flow: pick day + excuse → letter types itself → APPROVED stamp → share.
- **Games:** Swipe him away moved to Free v1 (Free = Catch Loop, Reaction test, Swipe him away, Stone paper scissors). Premium adds Remember the apps, Count the Reels, Pop the notifications and Put it down, as post-launch drops. Typing stays dropped; only "Your own words" is typed, once, outside the snooze.
- Tabs: **Today · Attendance · Report Card · Settings**. First-visit demo on Attendance. 🎁 Welcome bonus of 100 Loops; week-1 Loops carry over if no leave was earned.
- **Internal track moved to Nov week 2**, so Loops & Leaves fits into the first internal build. Build sprint starts Mon 19 Oct.
- **Roast screen:** personal numbers in every roast; it escalates through the day (1st light, 2nd sharper, 3rd+ savage, with pose and colour changing); a visible share button, with the share grace once a day only.

Endloop · from Super Spider · Working document, not for public release.
