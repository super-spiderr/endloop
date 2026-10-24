/**
 * Snooze ladder lines (Product Book A4; canvas Screen 23). Drafts for the content session (C2):
 * reasons by app kind plus four that always show, 2–3 replies each, game heckles, cool-off and Bunk.
 * Only the roaster's lines have a Tanglish version; buttons and UI text stay English.
 * Roasts target the habit, never the person.
 */
import type { AppKind } from '@/roasts/kinds';
import type { RoastLang } from '@/store/settings';

type Line = { en: string; ta: string };
const L = (en: string, ta = en): Line => ({ en, ta });
export const say = (l: Line, lang: RoastLang) => (lang === 'ta-Latn' ? l.ta : l.en);
export const pick = <T,>(list: readonly T[], seed = Date.now()): T => list[Math.abs(Math.floor(seed)) % list.length];

export type Reason = { id: string; label: string; replies: Line[] };

const R = (id: string, label: string, ...replies: Line[]): Reason => ({ id, label, replies });

/** Two reasons per kind of app. `other` apps get the always-on ones only. */
const BY_KIND: Partial<Record<AppKind, Reason[]>> = {
  feed: [
    R('one_more', 'Just one more reel', L('Just one more. Like the last 47.', 'Innum onnu. Last 47 maadhiri dhaane.'), L('One more reel. Famous last words.', 'Oru reel dhaan. Ellarum ippadi dhaan aarambipaanga.')),
    R('catching_up', "Catching up on what I missed", L("You missed nothing. I checked. It's the same five memes.", 'Onnum miss aagala. Naan paathen. Adhe 5 memes dhaan.')),
  ],
  video: [
    R('finish_video', 'Finishing this video', L('This video. Then autoplay. Then the next one. I know the plan.', 'Indha video. Apram autoplay. Apram next. Plan theriyum.'), L('It has a progress bar. You have a limit. Interesting choice.', 'Video-ku progress bar irukku. Unakku limit irukku.')),
    R('learning', "It's educational", L('Educational. Sure. What did you learn? Name one thing.', 'Educational-ah? Enna kathukitta? Onnu sollu.')),
  ],
  chat: [
    R('replying', 'Replying to someone', L("Replying to someone. Sure. That's the third reply this week.", 'Reply pannanum-ah? Indha vaaram moonavadhu reply idhu.'), L('They can wait five minutes. You did it to them.', '5 minute wait pannattum. Neenga avangala wait panna vechadhu illaya?')),
    R('group', 'The group chat is on fire', L('The group chat is always on fire. It never burns down.', 'Group chat eppovume fire dhaan. Erinju mudiyaadhu.')),
  ],
  games: [
    R('one_match', 'Just one more match', L('One match. Then "best of three". Then sunrise.', 'Oru match. Apram best of three. Apram vidinjidum.'), L('Your streak is losing too. Just saying.', 'Unga streak-um thokkudhu. Sollitten.')),
    R('daily', 'My daily reward expires', L('Your daily reward is you. Not the coins.', 'Daily reward neenga dhaan. Coins illa.')),
  ],
  shopping: [
    R('sale', "There's a sale ending", L('The sale ends. Another one starts in 10 minutes. Every time.', 'Sale mudiyum. 10 nimishathula innoru sale. Eppovume.')),
    R('cart', 'Just checking my cart', L('Your cart is fine. It misses you less than you think.', 'Cart nalla dhaan irukku. Neenga nenaikra alavu miss pannala.')),
  ],
  browser: [
    R('looking_up', 'Looking something up', L('Looking something up. Forty tabs later.', 'Edho search panreenga. 40 tabs apram.')),
    R('reading', 'Reading an article', L('Reading. Or scrolling past the article to the comments.', 'Article padikreengala? Illa comments-ku scroll panreengala?')),
  ],
  work: [R('deadline', 'Deadline, actually', L('Deadline. Then why are you on this app?', 'Deadline-ah? Appo indha app-la enna panreenga?'))],
};

/** Always shown, whatever the app. */
const ALWAYS: Reason[] = [
  R('bored', "I'm bored", L("Bored is good. Bored is where ideas live. Go meet one.", 'Bore adikradhu nalladhu dhaan. Ideas angadhaan irukkum.'), L('Bored. So you chose the most boring cure.', 'Bore-ah? Adhukku idhu dhaan cure-ah?')),
  R('work', 'Work or study', L("It's for work. It's always for work.", 'Work-ku dhaan. Eppovume work-ku dhaan.'), L('Your boss would like a word. So would your syllabus.', 'Unga boss pesanumaam. Syllabus-um.')),
  R('night', "Can't sleep", L("The phone is why you can't sleep. Big reveal.", 'Thookam varaadhadhu phone-naala dhaan. Surprise!')),
  R('else', 'Something else', L('Something else. Very specific. Very convincing.', 'Vera edho. Romba clear-ah sonneenga.')),
];

export function reasonsFor(kind: AppKind, night: boolean): Reason[] {
  const own = BY_KIND[kind] ?? [];
  const always = ALWAYS.filter((r) => r.id !== 'night' || night);
  return [...own, ...always].slice(0, 6);
}

/* ---------- the games' heckles (Screen 23: speech bubble at the bottom) ---------- */

export const HECKLE = {
  catch: [L('He hides in your apps. Fitting, isn’t it?', 'Unga apps-kulla oliyuraan. Correct-ah dhaan irukku.'), L('Faster. Your thumb is warmed up from scrolling.', 'Speed-ah. Scroll panni thumb ready-ah dhaane irukku.')],
  quick: [L("I've seen faster thumbs at 3 am. Yours, actually.", 'Raathiri 3 manikku idhai vida fast-ah irundheenga.'), L('Wait for it. Patience. You know, the thing you lack here.', 'Wait pannunga. Porumai. Adhu dhaan unga kitta illa.')],
  swipe: [L('The heart doesn’t work. Nice try.', 'Heart work aagaadhu. Nalla try.'), L('Swipe me away. You do it to alarms every morning.', 'Swipe pannunga. Daily alarm-a pannreengale.')],
  rps: [L('I always throw scissors. Or do I?', 'Naan eppovume scissors dhaan. Illa?'), L('Two in a row. I believe in you. Not really.', 'Rendu thadava jeyikkanum. Nambikkai irukku. Illa.')],
  win: [L('Fine. You won. Five minutes. I’m counting.', 'Sari. Jeyichitteenga. 5 minutes. Count panren.'), L('Lucky. Five minutes. The clock is mine.', 'Luck dhaan. 5 minutes. Clock en kitta.')],
  timeout: [L('Time’s up. You didn’t win, but I keep my word.', 'Time mudinjiduchu. Jeyikkala, aanaalum promise promise dhaan.')],
};

/* ---------- step 4+: cool-off and Bunk ---------- */

export const COOL = {
  title2: L("Two minutes. Stare at a wall. It's free.", '2 nimisham. Suvar-a paarunga. Free dhaan.'),
  title5: L('Five minutes this time. The wall missed you.', 'Indha thadava 5 nimisham. Suvar ungala miss pannuchu.'),
  still: [L('Still here? Your friends finished a movie in this time.', 'Innum inga dhaan irukkeengala? Friends oru padam paathu mudichitaanga.'), L('Breathe. In. Out. Not scroll. Breathe.', 'Moochu vidunga. Scroll illa. Moochu.')],
};

export const BUNK = {
  leave: L('Bunk approved. Using a leave. Retroactive Leave Letter filed. Don’t make it a habit.', 'Bunk approved. Oru leave poachu. Pazhaya date-la Leave Letter. Pazhakkam aakkaadheenga.'),
  timeout: L('One minute outside the class. Then it’s yours till midnight.', 'Oru nimisham class veliya. Apram midnight varaikkum ungaludhu.'),
  payback: L('Open it now. Tomorrow it gets 15 minutes less. I don’t forget.', 'Ippo open pannikonga. Naalaiku 15 nimisham kammi. Naan marakka maaten.'),
};
