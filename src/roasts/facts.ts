import type { Intensity, RoastLang } from '@/store/settings';

/**
 * Cards shown while the snooze countdown runs (Screen 10, step 3). Three kinds:
 * - research: real, sourced findings (see "Research facts library" in the master plan). Say "linked to"
 *   for correlations; mood / mental-health findings are `calm` and read the same in every tone.
 * - math: the user's own time, worked out natively from today's usage ({app}, {time}, {weekHours}, {yearDays}).
 * - tip: a practical way to manage time and the phone. Advice, not a claim, so no study is cited.
 * Re-check numbers and links before launch and once a year.
 */
type Toned = Record<Intensity, string>;
type Card = {
  id: string;
  kind: 'research' | 'math' | 'tip';
  source: string;
  calm?: boolean;
  en: Toned | string;
  ta: Toned | string;
};

const CARDS: Card[] = [
  // ---- research ----
  {
    id: 'attention_47s',
    kind: 'research',
    source: 'Gloria Mark, UC Irvine',
    en: {
      polite: 'Attention on one screen now lasts about 47 seconds on average. Yours deserves longer.',
      honest: 'Average attention on one screen: 47 seconds. It was 2.5 minutes in 2004.',
      savage: "Attention on one screen: 47 seconds. You've used most of yours reading this.",
    },
    ta: {
      polite: 'Oru screen-la namma attention average-a 47 seconds dhaan. Unakku adhai vida jaasti venum.',
      honest: 'Oru screen-la attention: 47 seconds. 2004-la adhu 2.5 minutes.',
      savage: 'Attention span: 47 seconds. Idha padikkave adhula paadhi pochu.',
    },
  },
  {
    id: 'refocus_25m',
    kind: 'research',
    source: 'Gloria Mark, UC Irvine',
    en: {
      polite: 'Getting back into a task after an interruption takes about 25 minutes. Worth protecting your focus.',
      honest: 'After an interruption, it takes about 25 minutes to get back into a task. This was an interruption.',
      savage: 'One interruption costs about 25 minutes of focus. You just bought five more of them.',
    },
    ta: {
      polite: 'Oru interruption-ku apram thirumba focus panna 25 minutes aagum. Focus-a kaappaathunga.',
      honest: 'Interruption-ku apram vela-ku thirumba 25 minutes aagum. Idhuvum oru interruption dhaan.',
      savage: 'Oru interruption = 25 minutes focus kaali. Neenga innum 5 vaanguringa.',
    },
  },
  {
    id: 'india_5h',
    kind: 'research',
    source: 'EY report, 2025',
    en: {
      polite: 'Indians average about 5 hours a day on their phones. Every minute you take back counts.',
      honest: "India averages about 5 hours a day on phones. That's a part-time job with no salary.",
      savage: "India's average is about 5 hours of phone a day. You're trying hard to beat it.",
    },
    ta: {
      polite: 'India-la average-a oru naalaiku 5 hours phone. Neenga thirumba edukkura ovvoru minute-um mukkiyam.',
      honest: 'India average: naalaiku 5 hours phone. Salary illaadha part-time job.',
      savage: 'India average 5 hours. Neenga adha beat panna romba try panringa.',
    },
  },
  {
    id: 'bedtime_13m',
    kind: 'research',
    source: 'Frontiers in Psychiatry, 2025',
    en: {
      polite: 'Each extra hour of screen time is linked to a bedtime about 13 minutes later.',
      honest: 'Every extra hour on your phone is linked to going to bed about 13 minutes later.',
      savage: 'Every extra hour here is linked to a 13-minute later bedtime. Your pillow misses you.',
    },
    ta: {
      polite: 'Ovvoru extra hour screen time-um 13 minutes late-a thoonga link aagudhu.',
      honest: 'Extra oru hour phone = 13 minutes late-a thookam. Research solludhu.',
      savage: 'Extra oru hour inga = 13 minutes late thookam. Unga pillow wait pannudhu.',
    },
  },
  {
    id: 'penn_30min',
    kind: 'research',
    calm: true,
    source: 'Hunt et al., University of Pennsylvania',
    en: 'In one study, people who cut social apps to about 30 minutes a day for 3 weeks felt less lonely and less low.',
    ta: 'Oru study-la, 3 weeks naalaiku 30 minutes mattum social apps use pannavanga konjam lonely-a, low-a feel pannala.',
  },
  {
    id: 'bmc_3weeks',
    kind: 'research',
    calm: true,
    source: 'Pieh et al., BMC Medicine, 2025',
    en: 'Keeping screen time under 2 hours a day for 3 weeks lowered stress and improved sleep quality in one study. The gains faded when screen time went back up.',
    ta: '3 weeks naalaiku 2 hours-ku kammi screen time vechavangalukku stress kammi aachu, thookam better aachu. Thirumba screen time yeriyadhum adhu poiduchu.',
  },
  // ---- the user's own time ----
  {
    id: 'math_year',
    kind: 'math',
    source: 'Your usage today',
    en: {
      polite: "At {time} a day, {app} adds up to about {yearDays} days a year. That's a lot of your year.",
      honest: 'At {time} a day, that is about {yearDays} full days a year on {app}.',
      savage: '{time} a day is about {yearDays} days a year on {app}. A whole holiday, spent scrolling.',
    },
    ta: {
      polite: 'Naalaiku {time} na, varushathuku {yearDays} naal {app}-la. Konjam yosinga.',
      honest: 'Naalaiku {time} = varushathuku {yearDays} full days {app}-la.',
      savage: 'Naalaiku {time} = varushathuku {yearDays} naal {app}. Oru full vacation, scroll-laye.',
    },
  },
  {
    id: 'math_week',
    kind: 'math',
    source: 'Your usage today',
    en: {
      polite: 'At this pace, {app} takes about {weekHours} hours a week. Imagine one of those back.',
      honest: 'At this pace, {app} takes about {weekHours} hours a week. That is a weekend afternoon, every week.',
      savage: '{weekHours} hours a week on {app}. You could learn a language with that. You won\'t, but you could.',
    },
    ta: {
      polite: 'Indha pace-la {app} vaarathuku {weekHours} hours edukkudhu. Adhula onnu thirumba kidaicha?',
      honest: 'Indha pace-la vaarathuku {weekHours} hours {app}. Ovvoru vaaramum oru weekend afternoon.',
      savage: 'Vaarathuku {weekHours} hours {app}. Oru language kathukalaam. Kathuka maateenga, but mudiyum.',
    },
  },
  // ---- managing time ----
  {
    id: 'tip_other_room',
    kind: 'tip',
    source: 'Tip',
    en: {
      polite: 'Try leaving your phone in another room for your next task. Out of sight really helps.',
      honest: 'Phone in another room while you work. Out of reach beats willpower.',
      savage: "Put the phone in another room. Your willpower clearly isn't doing the job.",
    },
    ta: {
      polite: 'Adutha vela seiyum podhu phone-a vera room-la vechu paarunga. Kannula padaama irundhaa help aagum.',
      honest: 'Vela seiyum podhu phone vera room-la. Willpower-a vida distance better.',
      savage: 'Phone-a vera room-la vainga. Unga willpower vela seiyala, theriyudhu.',
    },
  },
  {
    id: 'tip_notifications',
    kind: 'tip',
    source: 'Tip',
    en: {
      polite: 'Turning off notifications for apps that are not people can make the pull a lot weaker.',
      honest: 'Turn off notifications from apps that are not people. Fewer pings, fewer "just checking".',
      savage: "Mute every app that isn't a human. They're not texting you, they're fishing.",
    },
    ta: {
      polite: 'Manushangal illaadha apps-oda notifications off panna, phone-a edukkura aasai kammi aagum.',
      honest: 'Manushangal illaadha apps notifications off pannunga. Kammi ping, kammi "summa check".',
      savage: 'Manushan illaadha ella app-um mute. Avanga text pannala, meen pidikkuraanga.',
    },
  },
  {
    id: 'tip_plan_block',
    kind: 'tip',
    source: 'Tip',
    en: {
      polite: 'Pick one time of day for scrolling and enjoy it fully. The rest of the day gets easier.',
      honest: 'Give scrolling a slot, like 8 to 8:30 pm. When it has a time, it stops taking all of them.',
      savage: 'Book a scroll slot, like a meeting. Right now it books you.',
    },
    ta: {
      polite: 'Scroll panna oru neram fix pannunga, andha neram full-a enjoy pannunga. Meedhi naal easy aagum.',
      honest: 'Scroll-ku oru slot kudunga, 8 to 8:30 pm maadhiri. Neram fix aana, ella neramum edukkaadhu.',
      savage: 'Scroll-ku meeting maadhiri slot book pannunga. Ippo adhu dhaan unga neram book pannudhu.',
    },
  },
  {
    id: 'tip_2min',
    kind: 'tip',
    source: 'Tip',
    en: {
      polite: 'If the urge hits, wait two minutes and do one small thing first. It often passes.',
      honest: 'When you reach for the app, do one 2-minute task first. The urge usually fades.',
      savage: 'Next time your thumb twitches, drink some water first. Your thumb is not the boss.',
    },
    ta: {
      polite: 'App open panna thonuna, 2 minutes wait panni oru chinna vela pannunga. Adhu poidum.',
      honest: 'App-ku kai pogum podhu, mudhalla oru 2-minute vela. Aasai kammi aagidum.',
      savage: 'Adutha thadava thumb thudikkum podhu, thanni kudinga. Thumb unga boss illa.',
    },
  },
];

export const FACT_LABEL: Record<RoastLang, string> = { en: 'WHILE YOU WAIT', 'ta-Latn': 'WAIT PANNUM PODHU' };

/** Every card in the user's language and tone. Calm cards read the same in every tone. */
export function factsFor(lang: RoastLang, intensity: Intensity): { text: string; source: string }[] {
  return CARDS.map((c) => {
    const v = lang === 'ta-Latn' ? c.ta : c.en;
    return { text: typeof v === 'string' ? v : v[intensity], source: c.source };
  });
}
