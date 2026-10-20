"""Endloop roast library -> src/roasts/core.<lang>.json (+ out/manifest.json).

How it is organised
- Every roast has a SLOT id (e.g. "lh_s03"): category, level, apps, kinds, roaster, extras.
  English (EN) is the master list of slots; EXTRA_SLOTS holds slots that only have a Tanglish line so far.
- Each language fills slots with its own line (TA is just id -> text). Same id = same slot in every
  language, so switching language swaps the text. The joke itself can be different per language.
- A slot can be empty in a language; the app only ever shows lines that exist in the user's language,
  and falls back to English only when a whole category is empty.

Adding a line
- New idea in both languages: add R(...) to EN and the same id to TA.
- Tanglish-only idea: add the slot to EXTRA_SLOTS (text None) and the line to TA.
- Run: python3 design/tools/roasts/build.py, then copy out/core.*.json to src/roasts/.
  The build fails if a user could end up with no line for their level, language and kind of app,
  and warns where there is only one line (it would repeat every time).
"""
import json, re, os
OUT = os.path.dirname(os.path.abspath(__file__)) + "/out"  # copy core.*.json to src/roasts/ after building
os.makedirs(OUT, exist_ok=True)

# id, category, intensity (None = any), text, apps (None = any), roaster (None = both), extra
def R(id, cat, lvl, text, apps=None, roaster=None, kinds=None, **extra):
    d = {"id": id, "category": cat, "intensity": lvl, "text": text, "apps": apps, "roaster": roaster, "kinds": kinds}
    d.update(extra)
    return d

P, H, S, U = "polite", "honest", "savage", "unhinged"


# English is the master list of slots. Ids carry no language prefix.
EN = [
# ---- limit hit
R("lh_p01","limit_hit",P,"That's your {app} time for today. The feed will survive without you."),
R("lh_p02","limit_hit",P,"{time} today. Your eyes would like a word."),
R("lh_p03","limit_hit",P,"{time} on {app} today. Let's call it a day, yeah?"),
R("lh_p04","limit_hit",P,"Limit reached. Your eyes have earned a break."),
R("lh_p05","limit_hit",P,"{app} will still be here tomorrow. Promise."),
R("lh_p06","limit_hit",P,"Time's up. Go look at something that doesn't refresh."),
R("lh_p07","limit_hit",P,"The reels will still be there tomorrow. This evening won't."),
R("lh_p08","limit_hit",P,"Enough scrolling for today. Your thumb has clocked out."),
R("lh_p09","limit_hit",P,"Close it now and today counts as a win."),
R("lh_p10","limit_hit",P,"{time} is plenty. The rest of your day is waiting."),
R("lh_h01","limit_hit",H,"{time} of other people's vacations. Your own life is on airplane mode."),
R("lh_h02","limit_hit",H,"You didn't lose track of time. You handed it over."),
R("lh_h03","limit_hit",H,"{opens} opens today. That's not a habit, that's a relationship."),
R("lh_h04","limit_hit",H,"{time} on {app}, and you couldn't name three things you saw."),
R("lh_h05","limit_hit",H,"Your limit was {limit}. You're at {time}. Math is not on your side."),
R("lh_h06","limit_hit",H,"You've watched strangers live for {time}. Want to try it yourself?"),
R("lh_h07","limit_hit",H,"{opens} opens. Your phone sees you more than your friends do."),
R("lh_h08","limit_hit",H,"{time} of content. None of it was about you."),
R("lh_h09","limit_hit",H,"{time} gone. That was a movie, a nap or a walk. You picked scrolling."),
R("lh_h10","limit_hit",H,"{over} over your limit. Your thumb didn't even hesitate."),
R("lh_s01","limit_hit",S,"{opens} opens today. At this point {app} should be paying you rent."),
R("lh_s02","limit_hit",S,"{time} on {app}. Your thumb gets more exercise than you do."),
R("lh_s03","limit_hit",S,"Another {time} donated to a billion-dollar company. Generous."),
R("lh_s04","limit_hit",S,"You're not \"just checking.\" You're moving in."),
R("lh_s05","limit_hit",S,"The feed has no ending. You were supposed to be the ending."),
R("lh_s06","limit_hit",S,"Your thumb ran a marathon today. The rest of you watched."),
R("lh_s07","limit_hit",S,"{over} over the limit. You and self-control are clearly on a break."),
R("lh_s08","limit_hit",S,"You've watched so much today your brain has started buffering."),
R("lh_s09","limit_hit",S,"Your hand opened {app} {opens} times today. Your brain agreed to none of them."),
R("lh_s10","limit_hit",S,"Still looking for something good in there? It left an hour ago."),
R("lh_u01","limit_hit",U,"Your phone has started calling you \"roommate.\""),
R("lh_u02","limit_hit",U,"At this rate, archaeologists will find you mid-scroll."),
R("lh_u03","limit_hit",U,"Breaking news: local human discovers {app} has no bottom. Keeps looking anyway."),
R("lh_u04","limit_hit",U,"I'm not mad. I'm just going to stare at you until you close it."),
R("lh_u05","limit_hit",U,"Your screen has your thumbprint memorised. You two should really see other people."),
R("lh_u06","limit_hit",U,"{opens} opens. At this point {app} opens itself out of habit. Like you."),
R("lh_u07","limit_hit",U,"Your battery has a longer attention span than you do today."),
R("lh_u08","limit_hit",U,"Keep scrolling and you'll reach the ads from 2019."),
R("lh_a01","limit_hit",H,"Another reel won't fix it. Neither did the last forty.",["instagram"]),
R("lh_a02","limit_hit",S,"{time} of other people's best moments. Here's one of yours: closing this.",["instagram"]),
R("lh_a03","limit_hit",H,"\"Just one more video\" has now been said {opens} times.",["youtube"]),
R("lh_a04","limit_hit",S,"Shorts are short. Your session isn't.",["youtube"]),
R("lh_a05","limit_hit",H,"Your streak is alive. Your evening isn't.",["snapchat"]),
R("lh_a06","limit_hit",S,"{time} of strangers arguing. Who won? Nobody.",["x"]),
R("lh_a07","limit_hit",H,"{time} on Reddit. You're now an expert in things you'll never need.",["reddit"]),
R("lh_a08","limit_hit",H,"{opens} opens today. Nobody texts that much. You just keep checking.",["whatsapp"]),
R("lh_l01","limit_hit",None,"I counted all {opens} of your opens today. We both need a hobby.",roaster="loop"),
R("lh_l02","limit_hit",None,"I'd be impressed by the dedication if it were to literally anything else.",roaster="loop"),
R("lh_l03","limit_hit",None,"My eyelids are this heavy and I'm a cartoon. Imagine yours.",roaster="loop"),
R("lh_l04","limit_hit",None,"I'm not even surprised. I'm just here.",roaster="lupe"),
R("lh_l05","limit_hit",None,"I expected this. I'm still disappointed.",roaster="lupe"),
R("lh_l06","limit_hit",None,"Go on, tell me it was \"just five minutes.\"",roaster="lupe"),
# ---- heads up (75%)
R("hu_p01","heads_up",P,"{left} left on {app}. Plenty of time to finish up and head out."),
R("hu_p02","heads_up",P,"Three quarters of your {app} time is gone. Pace yourself."),
R("hu_p03","heads_up",P,"{left} to go. Maybe skip the next rabbit hole."),
R("hu_p04","heads_up",P,"{left} left. Good moment to wrap up the video you're on."),
R("hu_h01","heads_up",H,"{left} left. That's a lot of reels, or one good decision."),
R("hu_h02","heads_up",H,"{time} down, {left} to go. Your thumb is warming up. So am I."),
R("hu_h03","heads_up",H,"{left} left. The algorithm is saving its best stuff for right now. Suspicious."),
R("hu_h04","heads_up",H,"{opens} opens so far today. I'm keeping count in case you aren't."),
R("hu_s01","heads_up",S,"{left} left. I've started stretching."),
R("hu_s02","heads_up",S,"{left} to go. I'm already picking out your roast."),
R("hu_s03","heads_up",S,"Three quarters gone. Your self-control is on 25% battery."),
R("hu_s04","heads_up",S,"{left} left. Enjoy it. I'm taking notes."),
R("hu_u01","heads_up",U,"{left} left. I've told your thumb to start packing."),
R("hu_u02","heads_up",U,"Countdown started. I'm warming up my eye roll."),
R("hu_u03","heads_up",U,"{left} left. The reels can sense fear."),
# ---- last call (90%)
R("lc_p01","last_call",P,"{left} left on {app}. Finish this one and call it."),
R("lc_p02","last_call",P,"Last few minutes. Good time to put the phone down on your own terms."),
R("lc_p03","last_call",P,"{left} to go. Close it now and it's your idea, not mine."),
R("lc_p04","last_call",P,"Almost at your limit. The feed will keep."),
R("lc_h01","last_call",H,"{left} left. After that, it's my turn to talk."),
R("lc_h02","last_call",H,"{left}. That's one video. Choose wisely."),
R("lc_h03","last_call",H,"You're {left} away from meeting me properly."),
R("lc_h04","last_call",H,"{left} left, {opens} opens today. You can see where this is going."),
R("lc_s01","last_call",S,"{left}. Close it now and nobody gets hurt."),
R("lc_s02","last_call",S,"{left} left. My roast is loaded and it's about you."),
R("lc_s03","last_call",S,"Last call. After this, the roast writes itself."),
R("lc_s04","last_call",S,"{left} left. I'd start saying goodbye to the feed."),
R("lc_u01","last_call",U,"{left} left. I've cleared my whole schedule for this."),
R("lc_u02","last_call",U,"{left}. I'm cracking my knuckles. I don't have knuckles. That's how ready I am."),
R("lc_u03","last_call",U,"Final warning. The next face you see in this app will be mine."),
# ---- snooze
R("sa_p01","snooze_ask",P,"Need a bit more time? Okay, but you'll have to earn it."),
R("sa_p02","snooze_ask",P,"Five more minutes. Let's make it official."),
R("sa_p03","snooze_ask",P,"Sure. One small task first."),
R("sa_h01","snooze_ask",H,"Oh? Convince me."),
R("sa_h02","snooze_ask",H,"Five more minutes. You said that {opens} opens ago."),
R("sa_h03","snooze_ask",H,"Fine. Type this and we'll pretend it was your idea."),
R("sa_s01","snooze_ask",S,"Negotiating with me? Bold. Type your confession."),
R("sa_s02","snooze_ask",S,"Five more minutes of what, exactly? Go on, type it."),
R("sa_s03","snooze_ask",S,"The feed won't miss you. But fine, prove you mean it."),
R("sa_u01","snooze_ask",U,"I've prepared a small ritual for you."),
R("sa_u02","snooze_ask",U,"Every snooze costs one sentence of dignity. Pay up."),
R("st_p01","snooze_sentence_1",P,"Just five more minutes, I promise."),
R("st_p02","snooze_sentence_1",P,"I will close it right after this."),
R("st_p03","snooze_sentence_1",P,"This is my last scroll today."),
R("st_h01","snooze_sentence_1",H,"I am choosing reels over my dreams."),
R("st_h02","snooze_sentence_1",H,"My thumb makes my decisions now."),
R("st_h03","snooze_sentence_1",H,"I know this video will not help me."),
R("st_s01","snooze_sentence_1",S,"I am losing an argument to an app."),
R("st_s02","snooze_sentence_1",S,"The algorithm knows me better than I do."),
R("st_s03","snooze_sentence_1",S,"I have no idea what I am looking for."),
R("st_u01","snooze_sentence_1",U,"I pledge my entire evening to the scroll."),
R("st_u02","snooze_sentence_1",U,"Please sir, may I have more reels."),
R("st_a01","snooze_sentence_1",H,"One more video will definitely fix my life.",["youtube"]),
R("st_a02","snooze_sentence_1",H,"I need to see one more stranger's holiday.",["instagram"]),
R("st2_01","snooze_sentence_2",None,"I, a fully grown adult, cannot stop watching strangers dance."),
R("st2_02","snooze_sentence_2",None,"I already used one snooze and I have learned absolutely nothing."),
R("st2_03","snooze_sentence_2",None,"My thumb has more free will than I do today."),
R("st2_04","snooze_sentence_2",None,"I promise this is really the last time, just like the last time."),
R("st2_05","snooze_sentence_2",None,"I am asking a cartoon for permission to keep going."),
R("st2_06","snooze_sentence_2",None,"I typed this whole sentence instead of closing the app."),
R("as_01","after_snooze",None,"Five minutes are up. The typing didn't shame you? Impressive, honestly."),
R("as_02","after_snooze",None,"That was your snooze. I hope the extra reels were life-changing."),
R("as_03","after_snooze",None,"Snooze over. You're right back where you started, minus five minutes."),
R("as_04","after_snooze",None,"You typed a confession for five more minutes. Bold trade."),
R("as_05","after_snooze",None,"Five minutes later: same feed, less evening."),
R("as_06","after_snooze",None,"Welcome back. I kept your seat warm. It's the roast seat."),
R("su_01","snoozes_used_up",None,"No. We're done here."),
R("su_02","snoozes_used_up",None,"Snoozes: zero. Excuses: also zero. Close it."),
R("su_03","snoozes_used_up",None,"You've used both. The only button left is the good one."),
R("su_04","snoozes_used_up",None,"I'd give you more time, but you'd just spend it here."),
R("cm_01","snooze_backout",None,"Look at you. Choosing yourself."),
R("cm_02","snooze_backout",None,"Good call. That sentence was going to haunt you."),
R("cm_03","snooze_backout",None,"Closed without a fight. I'm almost proud."),
R("cm_04","snooze_backout",None,"That counts as a win. I'm writing it down."),
# ---- late night
R("ln_01","late_night",None,"The feed will still be there tomorrow. Your sleep won't."),
R("ln_02","late_night",None,"{clock}. Nothing good has ever been posted at this hour."),
R("ln_03","late_night",None,"Your screen is the brightest thing in the room. Fix that."),
R("ln_04","late_night",None,"Every extra hour on your phone is linked to a later bedtime. Just saying.",fact=True),
R("ln_05","late_night",None,"Tomorrow-you is already tired, and it's your fault."),
R("ln_06","late_night",None,"{clock} and still scrolling. Your pillow has filed a complaint."),
R("ln_07","late_night",None,"This is the hour where \"one more reel\" becomes a lifestyle."),
R("ln_08","late_night",None,"Sleep now and tomorrow's scrolling will at least be well rested."),
# ---- wins
R("w_01","win_first_roast",None,"Closed on the first roast. I didn't even get to finish my sentence."),
R("w_02","win_first_roast",None,"You closed it. I'm not proud. I'm just not disappointed."),
R("w_03","win_streak",None,"{streak} days in a row of closing on the first roast. Who are you?",minStreak=3),
R("w_04","win_streak",None,"{streak}-day streak. I'm running out of things to say. Good.",minStreak=3),
R("w_05","win_perfect_day",None,"Yesterday: all under limits. I'm… proud? Weird feeling."),
R("w_06","win_perfect_day",None,"A whole day under every limit. I've never been this bored. Well done."),
R("w_07","win_lowered_limit",None,"Look at you."),
R("w_08","win_streak_7",None,"Seven days. Fine. I'm smiling. Don't make it weird."),
R("w_09","win_streak",None,"Day {streak}. Your thumb is starting to forget the way.",minStreak=5),
# ---- weekly report
R("wr_g01","weekly_good",None,"Fine. You did well. Don't let it go to your head."),
R("wr_g02","weekly_good",None,"{won_back} won back this week. I hope you did something great with it."),
R("wr_g03","weekly_good",None,"Less scrolling than last week. I'm suspicious, but impressed."),
R("wr_b01","weekly_bad",None,"You scrolled more than before you installed me. Impressive, in the worst way."),
R("wr_b02","weekly_bad",None,"{worst_time} on {worst_app}. That's a part-time job with no salary."),
R("wr_b03","weekly_bad",None,"{week_total} this week. Your thumb needs a holiday. So do you."),
R("wr_f01","weekly_first",None,"Week 1. The baseline is set. Now we see what you're made of."),
R("wr_f02","weekly_first",None,"First week done. I have notes. Many notes."),
R("wr_m01","weekly_mixed",None,"Some days you won, some days {worst_app} won. Rematch next week."),
# ---- home
R("hm_01","home_day1",None,"Day one. I'm taking notes."),
R("hm_02","home_under",None,"So far, so good. Don't ruin it."),
R("hm_03","home_under",None,"Quiet day. I like quiet days."),
R("hm_04","home_under",None,"Under every limit. I'm almost worried."),
R("hm_05","home_close",None,"Careful. {left} left on {app}. I'm watching."),
R("hm_06","home_close",None,"{app} is almost done for today. I've started stretching."),
R("hm_07","home_close",None,"One more long scroll on {app} and we're talking."),
R("hm_08","home_over",None,"I've seen worse. Not much worse, though."),
R("hm_09","home_over",None,"{app} already got you today. Let's keep it to one."),
R("hm_10","home_over",None,"Roasted on {app} already, and the day isn't over."),
R("cp_01","comparison",None,"That's an episode of something you actually like.",minMinutes=30),
R("cp_02","comparison",None,"That's a long walk you didn't take.",minMinutes=45),
R("cp_03","comparison",None,"That's a full gym session. Just saying.",minMinutes=60),
R("cp_04","comparison",None,"That's a whole lunch with friends, minus the friends.",minMinutes=90),
R("cp_05","comparison",None,"That's a whole movie you didn't watch.",minMinutes=120),
R("cp_06","comparison",None,"That's a full IPL match, strategic timeouts included.",minMinutes=180),
R("cp_07","comparison",None,"That's a Chennai to Bangalore train ride.",minMinutes=300),
R("cp_08","comparison",None,"That's a full night's sleep, spent awake.",minMinutes=480),

# ---- app kinds (chat, browser, games, shopping, work, video): lines only those apps get
R("k_ch01","limit_hit",P,"{time} of chatting today. The conversation will keep till tomorrow.",kinds=["chat"]),
R("k_ch02","limit_hit",P,"Everyone you were talking to will still be there tomorrow. Promise.",kinds=["chat"]),
R("k_ch03","limit_hit",H,"You're not waiting for a reply. You're waiting for a reason.",kinds=["chat"]),
R("k_ch04","limit_hit",H,"{opens} opens today. Nobody texts that much. You just keep checking.",kinds=["chat"]),
R("k_ch05","limit_hit",S,"Group chats don't need a live commentator. Put it down.",kinds=["chat"]),
R("k_ch06","limit_hit",S,"Left on read by your own self-control.",kinds=["chat"]),
R("k_ch07","limit_hit",U,"Your \"typing…\" has been typing for {time}.",kinds=["chat"]),
R("k_ch08","heads_up",P,"{left} left on {app}. Good time to send the last reply.",kinds=["chat"]),
R("k_ch09","heads_up",H,"{left} left. Wrap up the chat before the chat wraps you up.",kinds=["chat"]),
R("k_ch10","heads_up",S,"{left} left. Say \"ttyl\" and mean it this time.",kinds=["chat"]),
R("k_ch11","last_call",P,"{left} left. Send that last message and log off.",kinds=["chat"]),
R("k_ch12","last_call",H,"{left}. One reply. Not a whole thread.",kinds=["chat"]),
R("k_ch13","last_call",S,"{left} left. Type \"bye\" like you mean it.",kinds=["chat"]),
R("k_ch14","late_night",None,"{clock}. Whoever you're texting should be asleep too.",kinds=["chat"]),
R("k_ch15","late_night",None,"Nothing typed after midnight needs sending right now. Go to sleep.",kinds=["chat"]),
R("k_br01","limit_hit",P,"{time} in {app}. Close a few tabs. Start with this one.",kinds=["browser"]),
R("k_br02","limit_hit",H,"{time} of \"just looking something up\". What was it again?",kinds=["browser"]),
R("k_br03","limit_hit",H,"You opened {app} to search one thing. That was {time} ago.",kinds=["browser"]),
R("k_br04","limit_hit",S,"You have more tabs open than plans for today.",kinds=["browser"]),
R("k_br05","limit_hit",U,"Somewhere in tab 47 is the thing you came for. Leave it there.",kinds=["browser"]),
R("k_br06","heads_up",P,"{left} left in {app}. Find what you came for and close it.",kinds=["browser"]),
R("k_br07","heads_up",H,"{left} left. You searched one thing. This is page nine.",kinds=["browser"]),
R("k_br08","last_call",H,"{left}. Bookmark it. Leave.",kinds=["browser"]),
R("k_br09","last_call",S,"{left} left. That rabbit hole has a floor. It's me.",kinds=["browser"]),
R("k_br10","late_night",None,"{clock}, and you're searching things you'll forget by morning.",kinds=["browser"]),
R("k_gm01","limit_hit",P,"Game over for today. Real life has a save point too.",kinds=["games"]),
R("k_gm02","limit_hit",H,"{time} of \"one more round\". The rounds won.",kinds=["games"]),
R("k_gm03","limit_hit",S,"You've grinded {time}. Your real-life level hasn't moved.",kinds=["games"]),
R("k_gm04","limit_hit",U,"Achievement unlocked: {time} gone. Reward: nothing.",kinds=["games"]),
R("k_gm05","heads_up",P,"{left} left. Finish this round and save.",kinds=["games"]),
R("k_gm06","heads_up",H,"{left} left. That's one more round. Exactly one.",kinds=["games"]),
R("k_gm07","last_call",S,"{left}. Last round. I'm the final boss.",kinds=["games"]),
R("k_gm08","late_night",None,"{clock}. One more match turns into a sunrise.",kinds=["games"]),
R("k_sh01","limit_hit",P,"{time} of browsing. Your cart can wait till tomorrow.",kinds=["shopping"]),
R("k_sh02","limit_hit",H,"{time} on {app}. You've window-shopped longer than most people shop.",kinds=["shopping"]),
R("k_sh03","limit_hit",S,"Adding to cart is not a hobby. Close it.",kinds=["shopping"]),
R("k_sh04","limit_hit",U,"Your wishlist has a wishlist.",kinds=["shopping"]),
R("k_sh05","heads_up",H,"{left} left. Decide, or close it. Both are fine.",kinds=["shopping"]),
R("k_sh06","last_call",S,"{left}. Check out, or check out.",kinds=["shopping"]),
R("k_sh07","late_night",None,"{clock}. Nothing you add to cart at this hour is a good idea.",kinds=["shopping"]),
R("k_wk01","limit_hit",P,"{time} in {app} today. The inbox will still be full tomorrow. That's how inboxes work.",kinds=["work"]),
R("k_wk02","limit_hit",H,"Refreshing {app} doesn't make anyone reply faster.",kinds=["work"]),
R("k_wk03","limit_hit",S,"{opens} checks of {app}. Your work isn't in there. It's on your desk.",kinds=["work"]),
R("k_wk04","heads_up",P,"{left} left on {app}. Reply to the important one and close it.",kinds=["work"]),
R("k_wk05","last_call",H,"{left}. Send it or save it as a draft. Then go.",kinds=["work"]),
R("k_wk06","late_night",None,"{clock}. Work can wait until people are awake. Including you.",kinds=["work"]),
R("k_vd01","limit_hit",H,"Autoplay is not a reason. Close it.",kinds=["video"]),
R("k_vd02","limit_hit",S,"{time} of \"one more episode\". The credits were your exit.",kinds=["video"]),
R("k_vd03","heads_up",P,"{left} left. Finish this episode, not the next one.",kinds=["video"]),
R("k_vd04","last_call",H,"{left}. Not enough for another episode. Don't start one.",kinds=["video"]),
R("k_un01","late_night",None,"{clock}. Put the phone on charge and yourself to bed."),
]

# Slots with no English line yet (Tanglish-only jokes). Text None = no line in that language.
EXTRA_SLOTS = [
R("lh_h11","limit_hit",H,None),   # "one more reel" count
R("lh_h12","limit_hit",H,None),   # the algorithm knows your weakness
R("lh_s11","limit_hit",S,None),   # vera level scrolling
R("lh_s12","limit_hit",S,None),   # idhellam oru polappa
R("lh_s13","limit_hit",S,None),   # mudiyala boss
R("lh_u09","limit_hit",U,None),   # statue for your thumb
]

# Slots added for both languages
EN += [
R("st_u03","snooze_sentence_1",U,"I am giving my whole evening to this app. No refunds."),
R("st_h04","snooze_sentence_1",H,"I opened this app and forgot why."),
]

TA = {  # slot id -> Tanglish line. Same id = same slot as English (category, level, app kinds, roaster).
        # The joke can differ from the English one; it just has to fit the slot.
  "as_01": "Anju nimisham mudinjiduchu. Type pannadhu kooda ungala shame pannala? Semma.",
  "as_03": "Snooze over. Aarambicha idathukke vandhuteenga, anju nimisham kammiya.",
  "as_04": "Anju nimishathukku oru confession type panneenga. Dhairiyamaana deal.",
  "as_05": "Snooze over. Adhe feed, konjam kammiyana saayangalam.",
  "as_06": "Back-ah? Roast ungalukkaga dhaan wait pannitu irundhuchu.",
  "cm_01": "Paarunga. Ungalukkaga neengale choose panneenga.",
  "cm_02": "Good call. Andha sentence ungala romba naal haunt pannirukkum.",
  "cm_03": "Fight illama close panneenga. Konjam proud-ah irukku.",
  "cm_04": "Idhu oru win. Naan ezhudhi vechukkaren.",
  "cp_02": "Oru long walk pogaama vittuteenga.",
  "cp_03": "Oru full gym session. Summa solren.",
  "cp_05": "Oru full padam paathirukalam.",
  "cp_06": "Oru full IPL match, strategic timeout-oda.",
  "cp_07": "Chennai to Bangalore train journey-ye mudinjirukum.",
  "hm_01": "Day one. Naan notes eduthuttu irukken.",
  "hm_02": "Ippo varaikum ok. Kedukkaadheenga.",
  "hm_03": "Quiet day. Enakku quiet days pidikkum.",
  "hm_04": "Ella limit-kum keezha. Enakke konjam bayama irukku.",
  "hm_05": "Careful. {app}-la {left} dhaan irukku. Naan paathuttu irukken.",
  "hm_06": "{app} innaiku kitta thatta mudinjiduchu. Naan stretching aarambichitten.",
  "hm_08": "Idhai vida mosamaana days paathirukken. Romba illa, aana paathirukken.",
  "hm_09": "{app} ungala already pudichiduchu. Innaiku adhu mattum podhum.",
  "hm_10": "{app}-la already roast vaangiyaachu. Naal innum mudiyala.",
  "hu_h01": "{left} irukku. Oru nalla decision edukka adhu podhum.",
  "hu_h02": "{time} aairuchu, {left} baaki. Unga thumb warm-up aagudhu. Naanum dhaan.",
  "hu_h04": "{opens} thadava open aachu. Neenga count pannala-na, naan pannren.",
  "hu_p01": "{left} dhaan irukku {app}-la. Mella wrap up pannunga.",
  "hu_p02": "Mukkaal quota mudinjiduchu. Konjam slow pannunga boss.",
  "hu_s01": "{left} baaki. Naan stretching aarambichitten.",
  "hu_s02": "{left} irukku. Unga roast-a ippove select panniten.",
  "hu_s03": "Mukkaal mudinjiduchu. Unga self-control 25% battery-la irukku.",
  "hu_s04": "{left} irukku. Enjoy pannunga. Naan notes eduthuttu irukken.",
  "hu_u01": "{left} baaki. Unga thumb-a luggage pack panna sollitten.",
  "hu_u02": "Countdown aarambichachu. Naan en eye roll-a warm-up panren.",
  "hu_u03": "{left} baaki. Reels-ku unga bayam theriyum.",
  "k_br01": "{time} {app}-la. Konjam tabs close pannunga. Idhula irundhu aarambinga.",
  "k_br03": "Oru vishayam search panna vandheenga. Adhu {time} munnadi.",
  "k_br04": "Innaiku plans-a vida adhigama tabs open-la irukku.",
  "k_br06": "{left} irukku. Thedi vandhadha kandupidichittu close pannunga.",
  "k_br08": "{left}. Bookmark pannunga. Kelambunga.",
  "k_br10": "{clock}. Kaalaila maranthu pora vishayatha ippo search panreenga.",
  "k_ch01": "{time} chat panniyaachu. Pesura vishayam naalaikum irukkum.",
  "k_ch04": "{opens} thadava open panneenga. Yaarum ivlo message anuppala. Neenga dhaan check pannittu irukeenga.",
  "k_ch05": "Group chat-ku live commentary thevai illa boss. Phone-a vainga.",
  "k_ch07": "Unga \"typing…\" {time}-a type pannittu irukku.",
  "k_ch08": "{left} dhaan irukku. Last reply-a anuppitu kelambunga.",
  "k_ch12": "{left}. Oru reply podhum. Full thread venaam.",
  "k_ch14": "{clock}. Neenga message panra aalum ippo thoonganum.",
  "k_gm01": "Innaiku game over. Real life-kum oru save point irukku.",
  "k_gm02": "\"Innum oru round\"-nu {time} aachu. Round dhaan jeyichuchu.",
  "k_gm03": "{time} grind panneenga. Real life level mattum ezhumbala.",
  "k_gm05": "{left} irukku. Indha round-a mudichu save pannunga.",
  "k_gm07": "{left}. Last round. Final boss naan dhaan.",
  "k_gm08": "{clock}. Innum oru match-na sunrise-e paathuduveenga.",
  "k_sh01": "{time} browsing aachu. Cart naalaikum wait pannum.",
  "k_sh02": "{time} {app}-la. Vaangradha vida paakradhu dhaan adhigam.",
  "k_sh03": "Add to cart oru hobby illa boss. Close pannunga.",
  "k_sh05": "{left} irukku. Decide pannunga, illa close pannunga.",
  "k_sh06": "{left}. Checkout pannunga, illa kelambunga.",
  "k_sh07": "{clock}. Indha neraththula cart-la podra edhuvum nalla idea illa.",
  "k_un01": "{clock} aachu. Phone-a charge-la pottu neenga thoonga ponga.",
  "k_vd01": "Autoplay oru reason illa. Close pannunga.",
  "k_vd02": "\"Innum oru episode\"-nu {time} aachu. Credits dhaan unga exit.",
  "k_vd03": "{left} irukku. Indha episode-a mudinga, next-a illa.",
  "k_vd04": "{left}. Innoru episode-ku time illa. Aarambikkaadheenga.",
  "k_wk01": "{time} {app}-la. Inbox naalaikum full-ah dhaan irukkum. Adhu dhaan inbox.",
  "k_wk02": "{app}-a refresh panna yaarum seekiram reply panna maattaanga.",
  "k_wk04": "{left} irukku. Important-a irukkradhukku reply panni close pannunga.",
  "k_wk06": "{clock}. Work message ellam kaalaila paathukalam. Ungalukkum dhaan.",
  "lc_h01": "{left} baaki. Adhukku apram en turn.",
  "lc_h02": "{left}. Oru video-ku dhaan time irukku. Yosichu choose pannunga.",
  "lc_h03": "Innum {left}-la ennai proper-ah meet pannuveenga.",
  "lc_h04": "{left} baaki, innaiku {opens} open. Enga pogudhu-nu theriyudhu-la.",
  "lc_p01": "{left} dhaan. Idha mudichittu close pannidunga.",
  "lc_p02": "Last few minutes. Unga terms-la phone-a keela vainga.",
  "lc_p03": "Ippo close panna adhu unga idea. Apram-na adhu en idea.",
  "lc_s01": "{left}. Ippo close panna yaarukkum damage illa.",
  "lc_s02": "{left} baaki. Roast ready aairuchu. Adhu unga-ah pathi dhaan.",
  "lc_u01": "{left} baaki. Naan popcorn ready pannitten. Show aarambikka pogudhu.",
  "lc_u02": "{left}. Naan knuckles crack panren. Enakku knuckles-e illa. Avlo ready.",
  "lc_u03": "Final warning. Indha app-la neenga adutha paakra mugam en mugam dhaan.",
  "lh_h01": "{time} full-ah matha vanga vacation paatheenga. Unga life airplane mode-la irukku.",
  "lh_h02": "Time pass-ku open panneenga. Time mothama pass aagiduchu.",
  "lh_h03": "{opens} thadava open panneenga. Idhu habit illa boss, love story.",
  "lh_h04": "{time} scroll panneenga, aana moonu video kooda nyabagam illa.",
  "lh_h05": "Unga limit {limit}. Ippo {time}. Kanakku unga side-la illa.",
  "lh_h07": "Unga phone unga friends-a vida ungala adhigama paakudhu.",
  "lh_h09": "{time}-la oru full padam paathu, interval-la popcorn-um saaptirukalam. Neenga reels paatheenga.",
  "lh_h10": "{over} limit-a thaandiyachu. Unga thumb yosikkave illa.",
  "lh_h11": "\"Innum oru reel dhaan\" nu {opens} thadava sollitteenga. Ippo naan solren: idhu dhaan last reel.",
  "lh_h12": "Algorithm-ku unga weakness theriyum. Enakkum theriyum. Adhu idhu dhaan.",
  "lh_l01": "{opens} thadava open panneenga. Naan ellathaiyum count panniten. Enakkum velai illa, ungalukkum velai illa.",
  "lh_l02": "Ivlo dedication vera edhula irundhaalum naan impress aagiruppen.",
  "lh_l03": "En kann imai ivlo heavy, naan oru cartoon. Unga kanna yosichu paarunga.",
  "lh_l04": "Surprise-um illa. Summa inga irukken.",
  "lh_l05": "Enakku shock-e illa. Expected dhaan.",
  "lh_l06": "Seri, \"just five minutes\" dhaan-nu sollunga. Kekaren.",
  "lh_p01": "Feed engayum oda poradhu illa. Neenga konjam rest edunga.",
  "lh_p02": "{time} podhum boss. Eyesku konjam rest kudunga.",
  "lh_p03": "Boss, {time} aachu {app} app-la. Konjam break edunga.",
  "lh_p04": "Limit reach aairuchu. Phone-a keela vechittu oru tea kudinga.",
  "lh_p05": "Innaiku {app} quota mudinjiduchu. Naalaiku paakalam.",
  "lh_p06": "Seri, podhum. Screen time illadha edhavadhu pannunga.",
  "lh_p07": "Reels naalaikum irukum. Indha saayangalam thirumba varadhu.",
  "lh_p09": "Ippo close panna kooda, streak-la neenga win pannalam.",
  "lh_s01": "{opens} thadava open pannirukeenga. {app}-ku rent kudukka aarambinga.",
  "lh_s02": "{time} {app}-la. Unga thumb-ku unga-vida adhiga exercise.",
  "lh_s04": "\"Just checking\" illa boss. Neenga anga kudi poiteenga.",
  "lh_s05": "Feed-ku end-e illa. Neenga dhaan end-a irukanum.",
  "lh_s06": "Unga thumb innaiku marathon odiduchu. Neenga ukkandhu vedikkai paatheenga.",
  "lh_s07": "{over} limit thaandiyachu. Self-control-um neengalum breakup-la irukeenga pola.",
  "lh_s10": "Nalla content innum varum-nu wait panreengala? Adhu oru mani neram munnadiye poiduchu.",
  "lh_s11": "Vera level scrolling. Aana life-la level onnum illa.",
  "lh_s12": "{time} {app}-la. Idhellam oru polappa?",
  "lh_s13": "Mudiyala boss. Neenga podhum-nu sollala-na, naan solren. Podhum.",
  "lh_u01": "Unga phone ungala \"roommate\"-nu kooppida aarambichuduchu.",
  "lh_u02": "Indha speed-la ponga, archaeologists ungala scroll panra posture-laye kandupidipaanga.",
  "lh_u03": "Breaking news: {app}-ku bottom-e illa-nu kandupidicha manushan, innum thedittu irukaar.",
  "lh_u04": "Naan kovapadala. Close panra varaikum ungala muraichu paathutte iruppen.",
  "lh_u05": "Unga screen-ku unga thumbprint manappaadam aairuchu. Rendu perum konjam break edunga.",
  "lh_u07": "Unga phone 20% battery-la warning kudukudhu. Neenga 0% attention-la kooda scroll pannureenga.",
  "lh_u08": "Innum scroll panna 1979 oda ads-e vandhudum.",
  "lh_u09": "Unga thumb-ku oru statue vechidalam pola.",
  "ln_01": "Feed naalaikum irukum. Unga thookam thirumba varadhu.",
  "ln_02": "{clock}. Indha neraththula yaarum nalla content post panradhilla.",
  "ln_03": "Room-la brightest thing unga screen dhaan. Adha maathunga.",
  "ln_05": "Naalaiku-unga kaalai ippove tired-ah irukku. Unga thappu dhaan.",
  "ln_06": "{clock} aairuchu, innum scroll-a? Unga pillow complaint kuduthirukku.",
  "ln_08": "Ippo thoongunga. Naalaiku scroll pannaalum fresh-ah pannalam.",
  "sa_h01": "Oh? Convince pannunga.",
  "sa_h02": "Anju nimisham-a? Adha {opens} open-ku munnadiye sonneenga.",
  "sa_p01": "Innum konjam time venuma? Seri, aana oru chinna velai irukku.",
  "sa_p02": "Innum anju nimisham. Official-ah pannalaam.",
  "sa_p03": "Okay. Aana free-ah illa.",
  "sa_s01": "Ennoda negotiate panreengala? Dhairiyam dhaan. Confession-a type pannunga.",
  "sa_s02": "Anju nimisham enna panna poreenga? Sollunga, type pannunga.",
  "sa_s03": "Feed ungala miss pannadhu. Aana seri, prove pannunga.",
  "sa_u01": "Ungalukkaga oru chinna sadangu ready pannirukken.",
  "sa_u02": "Snooze venuma? Oru chinna embarrassing line type pannunga. Terms and conditions apply.",
  "st2_01": "Reels-a stop panna mudiyala.",
  "st2_02": "Oru snooze use pannitten, innum onnume kathukala.",
  "st2_04": "Idhu dhaan really last time. Poona thadava maadhiriye.",
  "st2_05": "Innum continue panna oru cartoon-kitta permission kekkuren.",
  "st2_06": "Close panradhukku badhila indha muzhu line-ayum type panniten.",
  "st_a01": "Innum oru video en life-a maathidum.",
  "st_a02": "Innum oru stranger-oda holiday photo paakanum.",
  "st_h01": "Naan reels-ku adimai, en kanavu-ku illa.",
  "st_h02": "En thumb dhaan ippo en boss.",
  "st_h03": "Indha video enakku help pannadhu-nu theriyum.",
  "st_p01": "Innum anju nimisham dhaan, promise.",
  "st_p02": "Idhu mudinjadhum close pannidren.",
  "st_p03": "Idhu dhaan innaiku en last scroll.",
  "st_s01": "Oru app kitta argument-la thothuttu irukken.",
  "st_s02": "Algorithm-ku ennai vida ennai nalla theriyum.",
  "st_s03": "Naan enna thedren-nu enakke theriyala.",
  "st_u01": "En saayangalam muzhusum scroll-ku samarpanam.",
  "st_u02": "Sir please, innum konjam reels kudunga.",
  "st_h04": "Edhukku open pannen-nu marandhutten.",
  "st_u03": "En saayangalam-a indha app-ku kuduthutten. Refund illa.",
  "su_01": "Illa. Mudinjiduchu. Podhum.",
  "su_02": "Snooze: zero. Excuse: adhuvum zero. Close pannunga.",
  "su_03": "Rendu snooze-um mudinjiduchu. Ippo irukradhu nalla button mattum dhaan.",
  "su_04": "Innum time kudukalaam, aana adhaiyum inga dhaan selavu pannuveenga.",
  "w_01": "First roast-laye close panneenga. Naan sentence-a mudikka kooda illa.",
  "w_02": "Close panneenga. Naan proud illa. Disappointed-um illa.",
  "w_03": "{streak} naal continuous-ah. Yaaruya nee?",
  "w_04": "{streak}-day streak. Solla vishayame illa enakku. Nalladhu.",
  "w_05": "Nethu ella limit-um kulla. Naan… proud-ah? Weird-ah irukku.",
  "w_06": "Full day ella limit-kulla. Ivlo bore-ah irundhadhe illa. Well done.",
  "w_07": "Limit-a korachitteenga. Semma.",
  "w_08": "Ezhu naal. Seri, sirikkiren. Weird aakkadheenga.",
  "wr_b01": "Ennai install pannadhukku munnadi-ya vida adhigama scroll panneenga. Mosamana record.",
  "wr_b02": "{worst_time} {worst_app}-la. Sambalam illadha part-time velai.",
  "wr_b03": "{week_total} indha vaaram. Unga thumb-ku oru holiday venum. Ungalukkum dhaan.",
  "wr_f01": "First week mudinjiduchu. Baseline set aairuchu. Ini dhaan aattam.",
  "wr_f02": "First week done. Enkitta notes irukku. Neraya notes.",
  "wr_g01": "Seri, nalla pannitteenga. Adhu thalaikku yeradha maathiri paathukkonga.",
  "wr_g02": "{won_back} indha vaaram thirumba kidaichadhu. Adha nalla vishayathukku use pannirupeenganu nambaren.",
  "wr_g03": "Poona vaaratha vida kammiya scroll. Sandhegama irukku, aana impressed.",
  "wr_m01": "Sila naal neenga jeyicheenga, sila naal {worst_app} jeyichudhu. Next week rematch.",
}

# Which kinds of app a line fits (None = any app). Apps are mapped to a kind in src/roasts/kinds.ts.
KINDS = {"feed","video","chat","browser","games","shopping","work"}
FV = ["feed","video"]                          # reels, videos, the algorithm, strangers' lives
FEED = ["feed"]                                # posts, other people's holidays, ads
SCROLL = ["feed","video","browser","shopping"] # endless scrolling in general
KIND_TAGS = {
  "lh_p01":FV,"lh_p07":FV,"lh_p08":SCROLL,"lh_h01":FEED,"lh_h04":SCROLL,"lh_h06":FV,"lh_h08":FV,"lh_h09":SCROLL,
  "lh_s05":FEED,"lh_s08":FV,"lh_s10":SCROLL,"lh_u02":SCROLL,"lh_u03":SCROLL,"lh_u08":FEED,
  "hu_p03":SCROLL,"hu_p04":FV,"hu_h01":FV,"hu_h03":FV,"hu_u03":FV,
  "lc_p04":FV,"lc_h02":FV,"lc_s04":FV,"sa_s03":FV,
  "st_p03":SCROLL,"st_h01":FV,"st_h03":FV,"st_s02":FV,"st_u01":SCROLL,"st_u02":FV,
  "st2_01":FV,"as_02":FV,"as_05":FEED,
  "ln_01":FV,"ln_02":FEED,"ln_06":SCROLL,"ln_07":FV,"ln_08":SCROLL,"hm_07":SCROLL,
  # slot decisions made when pairing the Tanglish lines (2026-10-12)
  "lh_h04":FV,"lh_h09":FV,"lh_u07":SCROLL,
  "lh_h11":FV,"lh_h12":FV,"lh_s11":SCROLL,
}
for r in EN + EXTRA_SLOTS:
    if r["id"] in KIND_TAGS: r["kinds"] = KIND_TAGS[r["id"]]
_ids = {r["id"] for r in EN + EXTRA_SLOTS}
assert all(k in _ids for k in KIND_TAGS), [k for k in KIND_TAGS if k not in _ids]

# ---- lines that use the user's name ({name}, Settings → Roasting). Only how Loop / Lupe address you,
# never the joke. Filled in the app; lines with {name} are skipped when no name is set.
EN += [
R("nm_lh_p01","limit_hit",P,"{name}, that's your {app} time for today. Go do something nice."),
R("nm_lh_p02","limit_hit",P,"Okay {name}, {time} is plenty. See you tomorrow."),
R("nm_lh_h01","limit_hit",H,"{name}. {time} on {app}. Really?"),
R("nm_lh_h02","limit_hit",H,"{name}, your limit was {limit}. You're at {time}. Explain."),
R("nm_lh_h03","limit_hit",H,"Hey {name}. {time} of scrolling, and you won't remember any of it."),
R("nm_lh_s01","limit_hit",S,"{name}. {time}. On {app}. I'm not even going to finish this sentence."),
R("nm_lh_s02","limit_hit",S,"{over} over, {name}. Self-control called. You let it ring."),
R("nm_lh_s03","limit_hit",S,"Bold move, {name}. {time} on {app} and still going."),
R("nm_lh_u01","limit_hit",U,"{name}, I've seen your screen time. I need a moment."),
R("nm_hu_p01","heads_up",P,"{left} left on {app}, {name}. Start wrapping up."),
R("nm_hu_h01","heads_up",H,"{name}, {left} left. I'm watching the clock so you don't have to."),
R("nm_hu_s01","heads_up",S,"{left} left, {name}. I've already started warming up."),
R("nm_lc_p01","last_call",P,"{name}, {left} left. Finish this one and close it."),
R("nm_lc_h01","last_call",H,"{left} left, {name}. After that, it's my turn."),
R("nm_lc_s01","last_call",S,"{name}. {left}. Close it now and we stay friends."),
R("nm_ln_01","late_night",None,"It's {clock}, {name}. The feed doesn't sleep. You should."),
R("nm_ln_02","late_night",None,"{name}. {clock}. Put it down."),
R("nm_su_01","snoozes_used_up",None,"No snoozes left, {name}. A deal's a deal."),
R("nm_hm_01","home_over",None,"{name}. We talked about this."),
R("nm_hm_02","home_close",None,"{name}, careful. {app} is nearly done for today."),
R("nm_hm_03","home_under",None,"Under every limit, {name}. Keep it boring."),
]
TA.update({
  "nm_lh_p01": "{name}, innaiku {app} time mudinjiduchu. Vera edhavadhu nalladha pannunga.",
  "nm_lh_p02": "Okay {name}, {time} podhum. Naalaikku paapom.",
  "nm_lh_h01": "{name}. {app}-la {time}. Nijamaava?",
  "nm_lh_h02": "{name}, limit {limit}. Neenga {time}-la irukeenga. Explain pannunga.",
  "nm_lh_h03": "{name}, {time} scroll panneenga. Onnu kooda nyabagam irukkaadhu.",
  "nm_lh_s01": "{name}. {time}. {app}. Indha sentence-a mudikka kooda enakku manasu illa.",
  "nm_lh_s02": "{over} over, {name}. Self-control call pannuchu. Neenga edukkala.",
  "nm_lh_s03": "Dhairiyam dhaan, {name}. {app}-la {time}, innum poitu irukeenga.",
  "nm_lh_u01": "{name}, unga screen time-a paathen. Enakku konjam time venum.",
  "nm_hu_p01": "{name}, {app}-la {left} dhaan irukku. Mella wrap up pannunga.",
  "nm_hu_h01": "{left} baaki, {name}. Clock-a naan paathukkaren.",
  "nm_hu_s01": "{left} irukku, {name}. Naan already warm-up aaiten.",
  "nm_lc_p01": "{name}, {left} irukku. Idhai mudichittu close pannunga.",
  "nm_lc_h01": "{left} baaki, {name}. Adhukku apram en turn.",
  "nm_lc_s01": "{name}. {left}. Ippo close pannunga, namma friends-ave irukkalam.",
  "nm_ln_01": "{clock} aachu, {name}. Feed thoongadhu. Neenga thoonganum.",
  "nm_ln_02": "{name}. {clock}. Phone-a keezha vainga.",
  "nm_su_01": "Snooze ellam mudinjiduchu, {name}. Deal-na deal.",
  "nm_hm_01": "{name}. Idha pathi naama already pesinom.",
  "nm_hm_02": "{name}, careful. {app} innaiku kitta thatta mudinjiduchu.",
  "nm_hm_03": "Ella limit-kum keezha, {name}. Ipdiye boring-ah irunga.",
})

PLACEHOLDERS = {"name","app","time","limit","opens","over","left","streak","clock","won_back","week_total","worst_app","worst_time"}
APP_KEYS = {
  "instagram": ["com.instagram.android"],
  "youtube": ["com.google.android.youtube"],
  "snapchat": ["com.snapchat.android"],
  "x": ["com.twitter.android"],
  "reddit": ["com.reddit.frontpage"],
  "whatsapp": ["com.whatsapp"],
}

# ---------- assemble one pack per language from the shared slots ----------
SLOTS = {}
for r in EN + EXTRA_SLOTS:
    assert r["id"] not in SLOTS, ("duplicate slot id", r["id"])
    assert re.fullmatch(r"[a-z0-9_]+", r["id"]) and not re.match(r"(en|ta)_", r["id"]), ("ids carry no language prefix", r["id"])
    SLOTS[r["id"]] = r
for i in TA: assert i in SLOTS, ("Tanglish line for an unknown slot", i)

TEXTS = {
    "en": {r["id"]: r["text"] for r in EN if r["text"]},
    "ta-Latn": dict(TA),
}

def check_line(r):
    for ph in re.findall(r"\{(\w+)\}", r["text"]):
        assert ph in PLACEHOLDERS, (r["id"], r["lang"], ph)
    assert r["text"].strip(), (r["id"], r["lang"], "empty line")
    assert r["intensity"] in (None, P, H, S, U)
    assert r["roaster"] in (None, "loop", "lupe")
    for a in (r["apps"] or []): assert a in APP_KEYS, (r["id"], a)
    for k in (r["kinds"] or []): assert k in KINDS, (r["id"], k)

def pack_for(lang):
    out = []
    for sid, slot in SLOTS.items():
        text = TEXTS[lang].get(sid)
        if not text: continue
        r = dict(slot); r["text"] = text; r["lang"] = lang
        check_line(r); out.append(r)
    return out

def write(name, lang, pack):
    doc = {
        "pack": name, "lang": lang, "version": VERSION,
        "placeholders": sorted(PLACEHOLDERS),
        "appKeys": APP_KEYS,
        "notes": "Same id = same slot in every language (category, intensity, apps, kinds, roaster). The text can be a different joke per language. intensity null = any level; apps null = any app; kinds null = any kind of app (feed, video, chat, browser, games, shopping, work); roaster null = both. snooze_sentence_* must be typed by the user; compare ignoring case and extra spaces. comparison lines use minMinutes; win_streak uses minStreak.",
        "roasts": pack,
    }
    with open(f"{OUT}/{name}.{lang}.json", "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
    return len(pack)

# ---------- coverage: what a user actually gets, per language ----------
LEVELS = [P, H, S]            # levels users can pick today; add U when Unhinged ships
KIND_LIST = sorted(KINDS) + ["other"]
LEVELLED = ["heads_up","last_call","limit_hit","snooze_ask","snooze_sentence_1"]
ANY_LEVEL = ["late_night","after_snooze","snooze_sentence_2","snoozes_used_up","snooze_backout",
             "home_day1","home_under","home_close","home_over","weekly_good","weekly_bad","weekly_mixed","weekly_first",
             "win_first_roast","win_streak","win_streak_7","win_perfect_day","win_lowered_limit","comparison"]

def pool(pack, cat, lvl, kind, roaster):
    return [r for r in pack if r["category"] == cat and not r["apps"]
            and (not r["roaster"] or r["roaster"] == roaster)
            and (not r["kinds"] or kind in r["kinds"])
            and (lvl is None or not r["intensity"] or r["intensity"] == lvl)]

def coverage(packs):
    errors, warns = [], []
    for lang, pack in packs.items():
        for roaster in ("loop", "lupe"):
            for kind in KIND_LIST:
                for cat in LEVELLED:
                    for lvl in LEVELS:
                        n = len(pool(pack, cat, lvl, kind, roaster))
                        if n == 0: errors.append(f"{lang}: no {cat}/{lvl} line for {kind} apps ({roaster})")
                        elif n == 1: warns.append(f"{lang}: only 1 {cat}/{lvl} line for {kind} apps ({roaster})")
                for cat in ANY_LEVEL:
                    n = len(pool(pack, cat, None, kind, roaster))
                    if n == 0: errors.append(f"{lang}: no {cat} line for {kind} apps ({roaster})")
    return errors, sorted(set(warns))

VERSION = 3
packs = {lang: pack_for(lang) for lang in TEXTS}
errors, warns = coverage(packs)
for w in warns: print("warn:", w)
if errors:
    print("\n".join("ERROR: " + e for e in errors)); raise SystemExit(1)

n_en = write("core", "en", packs["en"])
n_ta = write("core", "ta-Latn", packs["ta-Latn"])
manifest = {"version": VERSION, "packs": [
    {"file": "core.en.json", "lang": "en", "count": n_en},
    {"file": "core.ta-Latn.json", "lang": "ta-Latn", "count": n_ta}]}
json.dump(manifest, open(f"{OUT}/manifest.json","w"), indent=2)

missing = {lang: sorted(set(SLOTS) - set(TEXTS[lang])) for lang in TEXTS}
print(f"slots {len(SLOTS)} | en {n_en} | ta-Latn {n_ta}")
for lang, ids in missing.items():
    print(f"{lang} has no line yet for {len(ids)} slots" + (": " + ", ".join(ids) if len(ids) <= 40 else ""))
