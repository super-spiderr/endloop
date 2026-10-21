# C4 · Onboarding content (draft 2, 21 Oct 2026)

Every line for the new 8-step onboarding (Product Book A1), in English and Tanglish. Claude drafted it; Vignesh edits every line, then the wording is locked in the content session (D-O).

**How to read this**

- **Roaster line** = said by Loop or Lupe, shown in the chosen roast language (English or Tanglish). All lines work for both roasters unless marked.
- **UI** = buttons, labels, helper text and permission text. English only (master plan: the language switch changes only what the roaster says).
- Before step 6 the roast level isn't chosen yet, so steps 1–5 use one voice, roughly Honest.
- Address the user as "Boss", "Bro", "Nanba" or nothing. Never "dei"/"di".
- Every `{placeholder}` has a fallback (below). A line whose placeholder can't be filled is never shown; the fallback line is used instead.

## Placeholders

| Placeholder | Example | Source | If missing |
|---|---|---|---|
| `{roaster}` | Loop | Step 1 pick | Loop (default) |
| `{name}` | Arun / Doomscroller | Step 3b: own name or an earned title. Used from Step 7 on (all-done title, test roast, welcome bonus) | Never missing: if the user skips, the roaster picks one of their earned titles (ob_n_skip). No Usage Access (no titles): a neutral one from "Mystery Scroller" / "Unknown Thumb". |
| `{total}` | 4 h 12 m | 7-day daily average, all apps (step 3) | Use the "no history" reveal |
| `{top_app}` | Instagram | Biggest app in the 7 days | Use the "no history" reveal |
| `{top_time}` | 2 h 05 m | That app's daily average | as above |
| `{week_time}` | 14 h 35 m | That app's total for the 7 days | as above |
| `{week_hours}` | 29 | `{total}` × 7, whole hours | as above |
| `{year}` | 1 month / 21 days | `{top_time}` × 365, as days; 30+ days shown as months (1 decimal max, e.g. "1.5 months") | Drop the year line |
| `{limit}` | 45 min | Suggested or chosen limit | — |

Tanglish units for `{year}`: "{n} naal" / "{n} maasam".

---

## Step 1 · Welcome

Loop sneaks in (existing animation). The roast language isn't picked yet, so these first two lines use the default: Tanglish if the phone is set to Tamil, otherwise English.

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_w_hello | Sneak-in line (changed 21 Oct) | Here we go again. | *(Tanglish to write)* |
| ob_w_guess | Under it (changed 21 Oct) | Another patient. Let me guess: 'just five minutes' turned into three hours? | *(Tanglish to write)* |
| ob_w_button | Button | Okay doc. Roast me. | (UI, stays English) |
| ob_w_marquee | Background marquee, 4 rows (UI decoration, English) | JUST 5 MORE MINUTES · ONE LAST CHECK / I'LL SLEEP AFTER THIS · PHONE DOWN IN A SEC / ONLY CHECKING THE TIME · BACK IN A SEC / I'M NOT EVEN ON MY PHONE · LAST SCROLL, PROMISE | (stays English) |

Welcome copy is about phone habits in general, never one app (Vignesh, 21 Oct). Old lines, retired: "Oh. Another one." / "Let me guess. You "just checked Instagram" and lost 3 hours." The app shows the English lines for now (as before); the Tanglish versions are still to be written.

**Pick your roaster** (UI: "Pick your roaster"; cards: "Loop · Deadpan. Has heard every excuse." / "Lupe · Unimpressed. Sees right through you.")

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_w_pick_loop | After picking Loop | I don't do motivation quotes. I do roasts. | Motivation quotes-lam enkitta kedaiyaadhu. Roast-u mattum dhaan. |
| ob_w_pick_lupe | After picking Lupe | I don't do sympathy. Your battery will thank me. | Sympathy-lam illa. Unga battery-ku dhaan ini nalla kaalam. |

**Roast me in** (UI: "Roast me in" · English | Tanglish · helper "Only my lines change. Buttons stay English.")

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_w_lang_en | Picked English | English. Polite language, impolite truths. | — |
| ob_w_lang_ta | Picked Tanglish | — | Tanglish-ah? Seri, ini roast-um local, vali-um local. |

The nickname moved to step 3b (after the reveal), so it can suggest titles earned from usage.

**Which one are you?** (UI title: "Which one are you?" · helper "Optional. Only changes the kind of roasts you get." · options 🎒 School student · 🎓 College student · 💼 Working · 🙂 Other · "Skip")

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_w_school | School | School. So the "study group" is a reels group. | School-ah? "Group study"-nu sollitu reels group-dhaane? |
| ob_w_college | College | College. Attendance on proxy, Instagram on full attendance. | College-ah? Instagram-la than full attendance. |
| ob_w_working | Working | Working. Ah, the "just checking one mail" to YouTube pipeline. | Office-ah? "Oru mail check panren"-nu aarambichu YouTube-la mudiyum. |
| ob_w_other | Other | Other. Mysterious. Your screen time isn't. | Other-ah? Neenga mystery-ah irukkalaam. Unga screen time mystery illa. |
| ob_w_skipgroup | Skipped | Skipping? Fine. Your usage will snitch anyway. | Skip-ah? Paravaala. Unga usage-eh ellathaiyum solli kudukkum. |

UI button: "Let's go"

---

## Step 2 · Usage Access

The current English copy stays; the roaster lines get Tanglish versions. The screen shows the chosen roaster from here on.

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_u_ask | Title | Show me your screen time. I promise to judge. | Unga screen time-a kaatunga. Judge panna dhaan poren. |
| ob_u_back | Came back without granting | No permission? What am I, a fortune teller? | Permission illaama vandheengala? Naan enna jothidar-ah? |
| ob_u_granted | Granted | …oh no. | …aiyo. |
| ob_u_counting | While loading | Counting your hours. This might take a while. | Unga hours-a count panren. Konjam neram aagum. |

UI: "I need Usage Access to count it. I only see how long you use each app. Never your messages, photos or what you watch." · Settings preview (Endloop switched on) · button "Show me the damage" · "Not now" · back without granting: "Usage Access is still off, so I can't count anything yet.", help card ("Didn't find it?" path, "Switch greyed out?" restricted-settings help), button "Open Settings again" · granted: progress bar "Reading your last 7 days…", auto-advances.

---

## Step 3 · 💥 The reveal (new)

Drumroll pose (P1), then the numbers count up. Saves the baseline.

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_r_ready | Before the count-up | Your last 7 days. Brace yourself. | Last 7 days. Heart weak-ah irundha paakaadheenga. |
| ob_r_total | Big number | You spent **{total}** a day. | Daily **{total}** poguthu. |
| ob_r_top | Second line | **{top_app}**: {top_time} a day. | **{top_app}**: daily {top_time}. |
| ob_r_year | Third line | That's {year} a year. On {top_app} alone. | Varushathukku {year}. {top_app}-ku mattum. |

**Roaster reaction, by daily total**

| ID | Band | English | Tanglish |
|---|---|---|---|
| ob_r_b0 | under 1 h | Under an hour a day? Respect. You're basically a monk. | Oru hour kooda illaya? Neenga saamiyaar-ah? |
| ob_r_b1 | 1–2 h | Not bad. Not good. Very "just passed" energy. | Pass mark vaanguna maadhiri. Mosam illa, perusa illa. |
| ob_r_b2 | 2–4 h | That's a part-time job. It pays you in reels. | Idhu part-time job. Sambalam reels-la dhaan. |
| ob_r_b3 | 4–6 h | {week_hours} hours a week. Full-time job. Zero salary. Lots of overtime. | Vaarathukku {week_hours} hours. Full-time job, salary zero, overtime full. |
| ob_r_b4 | 6 h+ | I need to sit down. Actually, so do you. Oh wait, you already are. | Un phone-ku daily charging podra… un life-ku mattum eppo bro recharge poda pora? |
| ob_r_new | Under a day of history (new phone) | Brand-new phone? Clean record. Enjoy it while it lasts. | Pudhu phone-ah? Record clean. Evlo naal-nu paapom. |

UI: eyebrow "Your last 7 days" · "a day, on average" under the total · helper "This is your normal. Stay under it and you earn Loops." · button "Okay, that's bad" (opens the 3b sheet)

If Usage Access was denied, step 3 is skipped and step 4 shows the blindfold state.

---

## Step 3b · What should I call you? (moved here from step 1)

Right after the reveal, the roaster offers **titles earned from the last 7 days** next to a field for the user's own name. Whatever they pick becomes `{name}` everywhere: roasts, Leave Letters ("Yours obediently, Doomscroller"), share cards.

UI (bottom sheet over the reveal): label "Earned titles" · 3 title chips · "Or your own name" field (placeholder "First name or nickname") · helper "Optional. Stays on this phone. Change it in Settings." · button "That's me" · link "Skip. You pick one for me."

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_n_title | Title | So. What should I call you? | Seri. Ungala enna-nu koopidanum? |
| ob_n_earned | Above the chips | After those numbers, you've earned a title. | Indha numbers-ku, ungalukku oru title kudukalaam. |
| ob_n_pick | A title picked | {name}. It suits you. That's the sad part. | {name}. Correct-aa set aagudhu. Adhu dhaan sogam. |
| ob_n_own | Own name typed | {name}. Nice name. Shame about the screen time. | {name}. Nalla peru. Screen time dhaan konjam problem. |
| ob_n_skip | Skipped: the roaster picks one of the earned titles (the first chip) | No name? Fine, I'll pick: {name}. Change it in Settings if it hurts. | Peru sollala-na? Seri, naane vechiduren: {name}. Vali-na Settings-la maathikonga. |

**The titles**

Rules: they name the habit, never the person (no looks, identity or gender; so no Raja/Rani, King/Queen or Lord). The same title works in both languages unless a Tanglish one is listed.

| Earned by | English titles | Tanglish-only extras |
|---|---|---|
| Top app is a feed (Instagram, Snapchat, X, Reddit, Facebook) | Doomscroller · Professional Scroller · Reel Researcher · Thumb Athlete | Reels Expert-u |
| Top app is video (YouTube, Netflix, Hotstar, Prime) | Binge Boss · Autoplay Survivor · Next Episode Expert | — |
| Top app is chat (WhatsApp, Telegram) | Last Seen Legend · Blue Tick Bandit · Typing… Forever | Forward Message Specialist · Status Watcher |
| Top app is a game | Just One More Match · Respawn Regular | — |
| Top app is shopping | Cart Collector · Wishlist Warrior | — |
| Top app is a browser | Tab Hoarder · Rabbit Hole Ranger | — |
| Most use after 11 pm | Night Owl · 1 AM Scroller | Thoongaadha Scroller |
| 80+ phone pickups/opens a day | Unlock Expert · Phone Checker | — |
| 6 h+ a day | Screen Time Champion · Battery Drainer | — |
| Under 1 h a day | Suspiciously Fine · The Rare One | — |

**Which 3 chips show:** one from the top app's kind, one from the strongest "special" match (late night → 6 h+ → pickups → under 1 h), and one more from the top app's kind or the second app's kind. Shuffled per install, so two friends don't always get the same three. No Usage Access or no history → only the name field, no chips.

---

## Step 4 · Pick apps

Top 3 time-sinks are pre-selected.

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_p_title | Title | These three ate your week. Agree? | Indha moonu dhaan unga week-a saapdichu. Correct-ah? |
| ob_p_blind | No Usage Access | I'm flying blind here. Pick the apps you feel guilty about. | Enakku kann theriyala. Guilty-aa feel panra apps-a neengale pick pannunga. |
| ob_p_4th | 4th app tapped (soft Premium nudge): title | Three apps? 😏 | Moonu app podhuma? 😏 |
| ob_p_4th_body | Premium nudge: body | Get Premium, I watch up to 6 apps! Add the ones you like… or fine, we can just be friends! 😂 | Premium vaangunga, enga kitta 6 apps irukku! Pudichadha add pannikkonga… illa paravaala, friends-ahve iruppom! 😂 |

UI: helper "Your top 3 are picked. Swap any. Free watches 3 apps." · list label "Your top apps · last 7 days" with "3 of 3" · each row shows the daily average · Premium sheet: roaster title + body (ob_p_4th, ob_p_4th_body), buttons "See Premium" / "Maybe later" · no Usage Access: "No Usage Access, so I can't see your numbers. Pick up to 3.", a search field, "Installed apps" list, link "Let me see my numbers instead" · button "These ones"

The existing per-app reactions ("'Just one video.' Sure.", "Streaks don't count as a personality.", "Interesting choice.") stay; Tanglish:

| ID | English (existing) | Tanglish |
|---|---|---|
| ob_p_video | "Just one video." Sure. | "Oru video mattum." Seri seri. |
| ob_p_snap | Streaks don't count as a personality. | Streak-lam personality kanakku illa. |
| ob_p_other | Interesting choice. | Interesting choice-u. |

---

## Step 5 · Limits

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_l_title | Title | How much is too much? Be honest. I'll know. | Evlo podhum? Unmaiya sollunga. Enakku theriyum. |

UI: "Suggested: 30% under your normal. Drag to change." · over 4 h a day: "Suggested: 20% under your normal. You're over 4 h a day, so we start gentle." · each app card: "Your normal {time} a day", the limit, a slider with a mark at "normal" · note "Below your normal = you earn Loops." · pill "🪙 Earning Loops" / "⛔ Not earning" · "Limits reset every day at midnight." · button "Set my limits"

**Reactions as the slider moves** (existing English, new Tanglish, plus one new line)

| ID | When | English | Tanglish |
|---|---|---|---|
| ob_l_reasonable | 10–40% under normal | Reasonable. Suspiciously reasonable. | Ivlo reasonable-ah? Yaaru solli kuduthaanga? |
| ob_l_low | More than 40% under | Ambitious. I respect it. I don't believe it, but I respect it. | Periya plan. Respect. Nambikkai illa, aanaalum respect. |
| ob_l_same | Within 10% of normal | So… exactly what you already do. Revolutionary. | Adhaavadhu… ippo panradhaiye pannuveenga. Semma plan. |
| ob_l_above | Above normal | Above your normal? Why did you even install me? | Normal-a vida jaasthi-ah? Apram yen ennai install panneenga? |
| ob_l_lifestyle | Above normal, 3 h+ (new, from A5) | {limit}? That's not a limit, that's a lifestyle. | {limit}-ah? Adhu limit illa, lifestyle. |
| ob_l_barely | App barely used this week | You barely use this one. Bold pick. | Idha neenga use-ae panradhu illa. Bold pick. |

**"What are Loops?" sheet** (ⓘ link next to "Limits reset at midnight.")

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_l_loops_line | Roaster line under the title | Basically a salary for not scrolling. | Scroll pannaama irundha kidaikkira salary. |

UI: title "What are Loops?" · "Set a limit below your normal and stay under it: you earn Loops every day, up to 40." · three tiles "20 · 2 of 3 apps under", "40 · Every app under", "200 · = 1 Leave Letter" · "A Leave Letter buys a whole day with no roasts. Loops clear every Sunday at midnight, so use them." · button "Got it"

**Weekend limits (★ Premium)**: a locked row "Different limits on weekends" under the app cards opens a Premium sheet.

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_l_prem_title | Premium sheet title | Weekends need their own rules? 😏 | Weekend-ku thani rules venuma? 😏 |
| ob_l_prem_body | Premium sheet body | Premium lets you set different limits for weekdays and weekends. Saturday you deserves a little mercy… or not. 😂 | Premium-la weekday, weekend-ku thani limits vekkalaam. Saturday-la konjam mercy… illa adhuvum illa! 😂 |

Buttons: "See Premium" / "Maybe later".

**Premium user** (6 apps): a "★ Premium" badge above the title, the weekend row becomes a switch, and with it on, "Weekdays | Weekends" tabs sit above the 6 app cards.

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_l_title_premium | Title for Premium users | Six apps. Bold. I've cleared my schedule. | Aaru app-ah? Bold-u. Unga-kaaga full day free pannitten. |

---

## Step 6 · Roast level + your goal

**Roast level** (UI cards: Polite · Honest · Savage · Unhinged ★ Premium · helper "Change it any time in Settings.")

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_i_title | Title | How mean should I be? Choose wisely. | Evlo kaaram venum? Yosichu sollunga. |
| ob_i_polite | Preview, Polite | {week_time} on {top_app} last week. Maybe a little less this week? Only if you want. 🙂 | Pona vaaram {top_app}-la {week_time}. Indha vaaram konjam kammi pannalaamaa? Ungalukku ok-na mattum. |
| ob_i_honest | Preview, Honest | {week_time} on {top_app} last week. That's not a break, that's a shift. | {top_app}-la {week_time}. Idhu break illa boss, full shift. |
| ob_i_savage | Preview, Savage | {week_time} on {top_app}. The algorithm knows you better than your best friend does. | {top_app}-la {week_time}. Unga best friend-a vida algorithm-ku dhaan unga mela knowledge jaasthi. |
| ob_i_unhinged | Preview, Unhinged (Premium only) | {week_time} on {top_app}. At this point {top_app} should be paying you rent. | {top_app}-la {week_time}. Ivlo neram irundha, {top_app} unakku rent kudukkanum bro. |
| ob_i_title_premium | Title for Premium users | How mean should I be? You can afford the worst. | Evlo kaaram venum? Premium vaangiteenga, full kaaram tharalaam. |
| ob_i_noaccess | Preview with no Usage Access (any level) | Imagine 14 hours on Instagram. Now imagine it's you. | 14 hours Instagram-la. Adhu rendu full working days, boss. |
| ob_i_school | Unhinged tapped by a school student (inline note, no Premium nudge) | Unhinged stays locked for school. Rules are rules. Finish your homework first. | School-ku Unhinged illa. Rules-na rules. Mudhalla homework mudinga. |
| ob_i_unhinged_title | Unhinged tapped: Premium sheet title | Unhinged? You sure? 😈 | Unhinged-ah? Sure-ah? 😈 |
| ob_i_unhinged_body | Premium sheet body | Premium unlocks Unhinged. No filter, no mercy. Your feelings have been warned. 😂 | Premium-la Unhinged unlock aagum. Filter illa, mercy illa. Feelings-ku naan responsible illa! 😂 |

School students: Unhinged shows a lock with no Premium nudge, and the default level is Honest.

**Why are you here?** (UI helper: "Pick one. I'll bring it up when it matters." · options 📚 Exams / studies · 😴 Better sleep · 🎯 Focus at work · 👨‍👩‍👧 Family time · 🤷 Just checking how bad it is · ✏️ In my own words · button "That's why")

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_g_title | Title | Why are you here? Be honest. | Yen inga vandheenga? Unmaiya sollunga. |
| ob_g_exams | Exams / studies | Exams. So every reel is a chapter you didn't read. | Exam-ah? Ovvoru reel-um padikkaadha oru chapter. |
| ob_g_sleep | Better sleep | Sleep. Bold, from someone who scrolls at 1 am. | Thookam venuma? Mudhalla raathiri 1 mani scroll-a niruthunga. |
| ob_g_focus | Focus at work | Focus. I'll be the coworker who catches you. | Focus-ah? Naan dhaan unga office spy. |
| ob_g_family | Family time | Family time. They're in the next room, by the way. | Family time-ah? Avanga pakkathu room-la dhaan irukkaanga. |
| ob_g_checking | Just checking | Just checking. Sure. That's what they all say. | Summa check panna vandheengala? Ellarum adhe dhaan solluvaanga. |
| ob_g_own | Own words entered | Your words. I'll quote them back to you. Often. | Unga words. Adikkadi ungalukke thiruppi solluven. |
| ob_g_own_premium | Own words, Premium user | "{goal}" Noted. You'll hear it at the worst possible moment. | "{goal}" Note panniten. Correct-aana bad timing-la ungalukke thiruppi solluven. |

Own-words field (UI): placeholder "e.g. Clear my CA exam" · max 60 characters · helper "Stays on this phone." · note above the button, Free: "★ Premium: I'll throw this back at you when you try to snooze." · Premium: "★ ON · I'll show this to you every time you try to snooze." · button "That's why"

**Goal options by group (proposal):** everyone sees all six, ordered by group.
- School: Exams first. "Focus at work" hidden.
- College: Exams first. "Focus at work" reads "Focus on studies/projects".
- Working: "Focus at work" first.
- Other or skipped: the order above.

---

## Step 7 · Display over apps + notifications (+ battery)

Permission text stays English (UI). Battery shows only on Xiaomi/Redmi/POCO, Oppo/Realme, Vivo/iQOO, OnePlus and Samsung.

| ID | Where | English (UI) |
|---|---|---|
| ob_perm_title | Title | Two more things, then I'm in. |
| ob_perm_overlay | Display over apps | So I can roast you right on top of {top_app}. |
| ob_perm_notif | Notifications | So I can warn you before I get mean. |
| ob_perm_battery | Battery (listed brands only) | Your phone puts apps to sleep to save battery. I don't nap. 2 taps. |
| ob_perm_skipped | Overlay skipped | Without this, I can only send notifications. Be honest, you'll ignore them. |
| ob_perm_done | All done | All set, {name}. Let's test it. |
| ob_perm_sub | Subtitle | Each one has a reason. Nothing else gets asked. |
| ob_perm_sub_brand | Subtitle on listed brands (never name the brand) | Your phone needs one more. Sorry, not my rule. |
| ob_perm_skip_title | Overlay skipped: title | You skipped the main one? |
| ob_perm_skip_sub | Overlay skipped: subtitle | The roast can't show up without it. That's kind of my whole thing. |
| ob_perm_done_sub | All done: subtitle | Everything's on. Next: your first roast, on purpose. |
| ob_perm_done_line | All done: roaster line | Knuckles cracked. Let's see if you can take it. |

`{top_app}` missing → "So I can roast you right on top of your apps." · Buttons: per-row "Allow" (the next one highlighted), main button "Allow both to continue" (disabled) → "Fine, allow it" after a skip, link "Continue with notifications only" → "Roast me now" when all done.

---

## Step 8 · 🔥 Test the roast + 🎁 Welcome bonus (new)

**Test roast**: the real roast screen, with the user's real top app and limit.

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_t_ready | Before | Let's try it once. Ready? | Oru thadava try pannalaama? Ready-ah? |
| ob_t_polite | Demo, Polite | This is what {top_app} looks like when time's up. Gentle, right? Enjoy it. | {top_app} time mudinja ippadi dhaan varuven. Gentle-ah irukken, enjoy pannunga. |
| ob_t_honest | Demo, Honest | Time's up on {top_app}, {name}. This is how it'll look. Every. Single. Time. | {top_app} time mudinjiduchu. Ippadi dhaan varum. Ovvoru. Thadavaiyum. |
| ob_t_savage | Demo, Savage | {name}, this is me at your {top_app} limit. Practise your "just one more" face now. | {top_app} limit mudinjiduchu boss! 😂 Inime "innoru reel mattum" nu kenja pora face-a ippave practice pannunga. |
| ob_t_after | After closing the demo | That's the deal. You hit your limit, I show up. | Idhu dhaan deal. Limit thaandina, naan varuven. |

UI: reached from Step 7's "Roast me now" · chip "Test roast · this one's free" · eyebrow "Time's up" · stat "{top_app} · limit {limit} · test run" · button "Fine. Close it." · note "The real one also lets you snooze. It'll cost you." · `{top_app}` missing → "your apps".

**Welcome bonus** (gift box pose, P3)

| ID | Where | English | Tanglish |
|---|---|---|---|
| ob_b_line | Roaster line (merges the old "after the demo" line) | That's the deal, {name}: you hit your limit, I show up. Now, a gift. Don't get used to it. | Idhu dhaan deal, {name}: limit thaandina, naan varuven. Ippo oru gift. Pazhagidaadheenga. |

UI (red background): eyebrow "Welcome bonus" · two tiles "100 Loops" and "2 Leaves" · body "Stay under your limits to earn more Loops. 200 Loops = a Leave Letter: a whole day with no roasts. Short of 200 by your first Sunday? Your Loops carry over, this once." · button "Day 1 starts now". Same bonus for Free and Premium (Premium is never more lenient).

---

## Open points for Vignesh

1. **Goal options by group:** OK with the ordering and hiding above, or should everyone see the same list?
2. ~~"Boss" when there's no name~~ Decided 21 Oct: no name means the roaster picks an earned title.
3. **Reveal year line:** days under 30, months from 30 (e.g. "1.5 months")? The Product Book example ("That's 1 month a year") matches Instagram's 2 h 05 m, not the 4 h 12 m total, so the line names the top app.
4. **One voice for Loop and Lupe:** every line here works for both. Want any Lupe-only lines?
5. **School lines:** "School. So the homework is 'in progress'." Gentle enough for the youngest users?
6. **Privacy:** the nickname, group and goal must be added to `site/privacy.html` and "What Endloop can see" in the same build as this onboarding.
7. **Nickname moved to step 3b** (after the reveal) so it can suggest earned titles. This changes the A1 order decided on 15 Oct; the Product Book needs updating once you agree.
8. **Night Owl / pickups titles** need two numbers onboarding doesn't compute yet (use after 11 pm, opens per day). Both come from the same usage data; cheap to add.
9. **Title shown on share cards:** a share card would say "Doomscroller" instead of a real name. Intended (it's funnier), but say if you'd rather share cards always use the real name.
