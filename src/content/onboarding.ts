/**
 * Onboarding v2 lines (docs/content/C4-onboarding.md is the source; IDs match).
 * Only the roaster's lines have a Tanglish version; buttons and UI text stay English.
 */
import type { InstalledApp } from '@/data/usage';
import { appKind } from '@/roasts/kinds';
import type { Goal, Intensity, RoastLang, UserGroup } from '@/store/settings';

type Line = { en: string; ta: string };
const L = (en: string, ta = en): Line => ({ en, ta });

export const OB = {
  pickLoop: L("I don't do motivation quotes. I do roasts.", 'Motivation quotes-lam enkitta kedaiyaadhu. Roast-u mattum dhaan.'),
  pickLupe: L("I don't do sympathy. Your battery will thank me.", 'Sympathy-lam illa. Unga battery-ku dhaan ini nalla kaalam.'),
  langEn: L('English. Polite language, impolite truths.'),
  langTa: L('Tanglish-ah? Seri, ini roast-um local, vali-um local.'),
  group: {
    school: L('School. So the "study group" is a reels group.', 'School-ah? "Group study"-nu sollitu reels group-dhaane?'),
    college: L('College. Attendance on proxy, Instagram on full attendance.', 'College-ah? Attendance proxy-la, Instagram-la full attendance.'),
    working: L('Working. Ah, the "just checking one mail" to YouTube pipeline.', 'Office-ah? "Oru mail check panren"-nu aarambichu YouTube-la mudiyum.'),
    other: L("Other. Mysterious. Your screen time isn't.", 'Other-ah? Neenga mystery-ah irukkalaam. Unga screen time mystery illa.'),
  } satisfies Record<UserGroup, Line>,
  usageAsk: L('Show me your screen time. I promise to judge.', 'Unga screen time-a kaatunga. Judge panna dhaan poren.'),
  usageBack: L('No permission? What am I, a fortune teller?', 'Permission illaama vandheengala? Naan enna jothidar-ah?'),
  usageGranted: L('…oh no.', '…aiyo.'),
  usageCounting: L('Counting your hours. This might take a while.', 'Unga hours-a count panren. Konjam neram aagum.'),
  revealReady: L('Your last 7 days. Brace yourself.', 'Last 7 days. Heart weak-ah irundha paakaadheenga.'),
  band: [
    L("Under an hour a day? Respect. You're basically a monk.", 'Oru hour kooda illaya? Neenga saamiyaar-ah?'),
    L('Not bad. Not good. Very "just passed" energy.', 'Pass mark vaanguna maadhiri. Mosam illa, perusa illa.'),
    L("That's a part-time job. It pays you in reels.", 'Idhu part-time job. Sambalam reels-la dhaan.'),
    L('{week_hours} hours a week. Full-time job. Zero salary. Lots of overtime.', 'Vaarathukku {week_hours} hours. Full-time job, salary zero, overtime full.'),
    L("I need to sit down. Actually, so do you. Oh wait, you already are.", 'Un phone-ku daily charging podra… un life-ku mattum eppo bro recharge poda pora?'),
  ],
  revealNew: L('Brand-new phone? Clean record. Enjoy it while it lasts.', 'Pudhu phone-ah? Record clean. Evlo naal-nu paapom.'),
  nameTitle: L('So. What should I call you?', 'Seri. Ungala enna-nu koopidanum?'),
  nameEarned: L("After those numbers, you've earned a title.", 'Indha numbers-ku, ungalukku oru title kudukalaam.'),
  namePick: L("{name}. It suits you. That's the sad part.", '{name}. Correct-aa set aagudhu. Adhu dhaan sogam.'),
  nameOwn: L('{name}. Nice name. Shame about the screen time.', '{name}. Nalla peru. Screen time dhaan konjam problem.'),
  nameSkip: L("No name? Fine, I'll pick: {name}. Change it in Settings if it hurts.", 'Peru sollala-na? Seri, naane vechiduren: {name}. Vali-na Settings-la maathikonga.'),
  appsTitle: L('These three ate your week. Agree?', 'Indha moonu dhaan unga week-a saapdichu. Correct-ah?'),
  appsBlind: L("I'm flying blind here. Pick the apps you feel guilty about.", 'Enakku kann theriyala. Guilty-aa feel panra apps-a neengale pick pannunga.'),
  apps4thTitle: L('Three apps? 😏', 'Moonu app podhuma? 😏'),
  apps4thBody: L(
    'Get Premium, I watch up to 6 apps! Add the ones you like… or fine, we can just be friends! 😂',
    'Premium vaangunga, enga kitta 6 apps irukku! Pudichadha add pannikkonga… illa paravaala, friends-ahve iruppom! 😂',
  ),
  limitsTitle: L("How much is too much? Be honest. I'll know.", 'Evlo podhum? Unmaiya sollunga. Enakku theriyum.'),
  limitsTitlePremium: L("Six apps. Bold. I've cleared my schedule.", 'Aaru app-ah? Bold-u. Unga-kaaga full day free pannitten.'),
  limReasonable: L('Reasonable. Suspiciously reasonable.', 'Ivlo reasonable-ah? Yaaru solli kuduthaanga?'),
  limLow: L("Ambitious. I respect it. I don't believe it, but I respect it.", 'Periya plan. Respect. Nambikkai illa, aanaalum respect.'),
  limSame: L('So… exactly what you already do. Revolutionary.', 'Adhaavadhu… ippo panradhaiye pannuveenga. Semma plan.'),
  limAbove: L('Above your normal? Why did you even install me?', 'Normal-a vida jaasthi-ah? Apram yen ennai install panneenga?'),
  limLifestyle: L("{limit}? That's not a limit, that's a lifestyle.", '{limit}-ah? Adhu limit illa, lifestyle.'),
  loopsLine: L('Basically a salary for not scrolling.', 'Scroll pannaama irundha kidaikkira salary.'),
  weekendTitle: L('Weekends need their own rules? 😏', 'Weekend-ku thani rules venuma? 😏'),
  weekendBody: L(
    'Premium lets you set different limits for weekdays and weekends. Saturday you deserves a little mercy… or not. 😂',
    'Premium-la weekday, weekend-ku thani limits vekkalaam. Saturday-la konjam mercy… illa adhuvum illa! 😂',
  ),
  levelTitle: L('How mean should I be? Choose wisely.', 'Evlo kaaram venum? Yosichu sollunga.'),
  levelTitlePremium: L('How mean should I be? You can afford the worst.', 'Evlo kaaram venum? Premium vaangiteenga, full kaaram tharalaam.'),
  preview: {
    polite: L('{week_time} on {app} last week. Maybe a little less this week? Only if you want. 🙂', 'Pona vaaram {app}-la {week_time}. Indha vaaram konjam kammi pannalaamaa? Ungalukku ok-na mattum.'),
    honest: L("{week_time} on {app} last week. That's not a break, that's a shift.", '{app}-la {week_time}. Idhu break illa boss, full shift.'),
    savage: L('{week_time} on {app}. The algorithm knows you better than your best friend does.', '{app}-la {week_time}. Unga best friend-a vida algorithm-ku dhaan unga mela knowledge jaasthi.'),
    unhinged: L('{week_time} on {app}. At this point {app} should be paying you rent.', '{app}-la {week_time}. Ivlo neram irundha, {app} unakku rent kudukkanum bro.'),
  } satisfies Record<Intensity, Line>,
  previewNoAccess: L("Imagine 14 hours on Instagram. Now imagine it's you.", '14 hours Instagram-la. Adhu rendu full working days, boss.'),
  unhingedTitle: L('Unhinged? You sure? 😈', 'Unhinged-ah? Sure-ah? 😈'),
  unhingedBody: L(
    'Premium unlocks Unhinged. No filter, no mercy. Your feelings have been warned. 😂',
    'Premium-la Unhinged unlock aagum. Filter illa, mercy illa. Feelings-ku naan responsible illa! 😂',
  ),
  school: L('Unhinged stays locked for school. Rules are rules. Finish your homework first.', 'School-ku Unhinged illa. Rules-na rules. Mudhalla homework mudinga.'),
  goalTitle: L('Why are you here? Be honest.', 'Yen inga vandheenga? Unmaiya sollunga.'),
  goal: {
    exams: L("Exams. So every reel is a chapter you didn't read.", 'Exam-ah? Ovvoru reel-um padikkaadha oru chapter.'),
    sleep: L('Sleep. Bold, from someone who scrolls at 1 am.', 'Thookam venuma? Mudhalla raathiri 1 mani scroll-a niruthunga.'),
    focus: L("Focus. I'll be the coworker who catches you.", 'Focus-ah? Naan dhaan unga office spy.'),
    family: L("Family time. They're in the next room, by the way.", 'Family time-ah? Avanga pakkathu room-la dhaan irukkaanga.'),
    checking: L("Just checking. Sure. That's what they all say.", 'Summa check panna vandheengala? Ellarum adhe dhaan solluvaanga.'),
    own: L("Your words. I'll quote them back to you. Often.", 'Unga words. Adikkadi ungalukke thiruppi solluven.'),
  } satisfies Record<Goal, Line>,
  goalOwnPremium: L('"{goal}" Noted. You\'ll hear it at the worst possible moment.', '"{goal}" Note panniten. Correct-aana bad timing-la ungalukke thiruppi solluven.'),
  testHonest: L("Time's up on {app}, {name}. This is how it'll look. Every. Single. Time.", '{app} limit mudinjiduchu boss! 😂 Inime "innoru reel mattum" nu kenja pora face-a ippave practice pannunga.'),
  testPolite: L('{name}, this is what {app} looks like when time is up. Gentle, right? Enjoy it.', '{app} time mudinja ippadi dhaan varuven. Gentle-ah irukken, enjoy pannunga.'),
  testSavage: L('{name}, this is me at your {app} limit. Practise your "just one more" face now.', '{app} limit mudinjiduchu boss! 😂 Inime "innoru reel mattum" nu kenja pora face-a ippave practice pannunga.'),
  bonus: L("That's the deal, {name}: you hit your limit, I show up. Now, a gift. Don't get used to it.", 'Idhu dhaan deal, {name}: limit thaandina, naan varuven. Ippo oru gift. Pazhagidaadheenga.'),
};

/** Pick the language and fill {vars}. A line that would show a raw {placeholder} falls back to `fallback`. */
export function say(line: Line, lang: RoastLang, vars: Record<string, string | number> = {}, fallback = ''): string {
  const raw = lang === 'ta-Latn' ? line.ta : line.en;
  const out = raw.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] == null || vars[k] === '' ? m : String(vars[k])));
  return /\{\w+\}/.test(out) ? fallback : out;
}

/** Reveal band from the daily average (minutes). */
export function bandOf(dailyMin: number): number {
  if (dailyMin < 60) return 0;
  if (dailyMin < 120) return 1;
  if (dailyMin < 240) return 2;
  if (dailyMin < 360) return 3;
  return 4;
}

/** "1 month" / "21 days" a year for a daily average (minutes), in the roast language. */
export function perYear(dailyMin: number, lang: RoastLang): string {
  const days = (dailyMin * 365) / 1440;
  if (days < 30) {
    const d = Math.max(1, Math.round(days));
    return lang === 'ta-Latn' ? `${d} naal` : `${d} day${d === 1 ? '' : 's'}`;
  }
  const m = Math.round((days / 30) * 2) / 2;
  const t = Number.isInteger(m) ? String(m) : m.toFixed(1);
  return lang === 'ta-Latn' ? `${t} maasam` : `${t} month${m === 1 ? '' : 's'}`;
}

const TITLES: Record<string, string[]> = {
  feed: ['Doomscroller', 'Professional Scroller', 'Reel Researcher', 'Thumb Athlete'],
  video: ['Binge Boss', 'Autoplay Survivor', 'Next Episode Expert'],
  chat: ['Last Seen Legend', 'Blue Tick Bandit', 'Typing… Forever'],
  games: ['Just One More Match', 'Respawn Regular'],
  shopping: ['Cart Collector', 'Wishlist Warrior'],
  browser: ['Tab Hoarder', 'Rabbit Hole Ranger'],
  other: ['Professional Scroller', 'Thumb Athlete'],
};

/**
 * Three earned titles from the last 7 days (habits only, nothing gendered): one from the top app's
 * kind, one for the heaviest/lightest use, one from the second app's kind. Shuffled by `seed`.
 * Late-night and pickup titles need numbers onboarding doesn't read yet.
 */
export function earnedTitles(apps: InstalledApp[], dailyMin: number, seed: number): string[] {
  const kindTitles = (a?: InstalledApp) => (a ? (TITLES[appKind(a.packageName, a.label)] ?? TITLES.other) : TITLES.other);
  const pick = (list: string[], n: number) => list[(seed + n) % list.length];
  const out: string[] = [pick(kindTitles(apps[0]), 0)];
  const special = dailyMin >= 360 ? ['Screen Time Champion', 'Battery Drainer'] : dailyMin < 60 ? ['Suspiciously Fine', 'The Rare One'] : null;
  if (special) out.push(pick(special, 1));
  for (const cand of [...kindTitles(apps[1]), ...kindTitles(apps[0]), ...TITLES.other]) {
    if (out.length >= 3) break;
    if (!out.includes(cand)) out.push(cand);
  }
  return out;
}

export const NO_ACCESS_TITLES = ['Mystery Scroller', 'Unknown Thumb'];
