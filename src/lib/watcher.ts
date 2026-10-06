import { EndloopCore, type WatcherConfig } from 'endloop-core';

import { linesFor } from '@/roasts';
import { FACT_LABEL, factsFor } from '@/roasts/facts';
import { localDay, useSettings } from '@/store/settings';

function endOfToday(): number {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

type S = ReturnType<typeof useSettings.getState>;

/** Screen 10 copy that isn't in the roast library (library lines and facts are added in buildConfig). */
type FrictionCopy = Omit<NonNullable<WatcherConfig['friction']>, 'secondSentences' | 'backoutLines' | 'facts' | 'factLabel'>;
const FRICTION: Record<S['roastLang'], FrictionCopy> = {
  en: {
    eyebrow: '5 MORE MINUTES?',
    title: 'Oh? Convince me.',
    subtitle: "Why do you need more {app}? Pick one. Be honest, I'll know.",
    reasons: ["It's actually for work", 'Replying to someone', 'Finishing what I started', "No reason. I'm weak."],
    pick: 'Pick a reason first',
    next: 'Next',
    typeEyebrow: 'YOUR CONFESSION',
    typeTitle: 'Type this. Exactly.',
    typeHint: 'Type it exactly. No pasting.',
    typoHint: 'Typo. Letters must match exactly.',
    sentences: [
      'This is for work and I will close it right after.',
      'I am replying to one message and then leaving.',
      'I will finish this one thing and close it.',
      'I am choosing {app} over everything else today.',
    ],
    secondEyebrow: 'SECOND SNOOZE',
    secondTitle: 'Longer sentence. Longer wait.',
    waitEyebrow: 'TYPED. NOW WAIT.',
    waitTitle: "I'm staring. You're waiting.",
    wait: 'Give me 5 minutes · {n}',
    readyEyebrow: 'FINE.',
    readyTitle: "Five minutes. I'm counting.",
    confirm: 'Give me 5 minutes',
    back: 'Never mind, close it',
    backoutEyebrow: 'CLOSED WITHOUT A FIGHT',
  },
  'ta-Latn': {
    eyebrow: 'INNUM 5 MINUTES AH?',
    title: 'Convince pannu.',
    subtitle: 'Innum {app} edhuku? Onnu choose pannu. Poi sonna enakku theriyum.',
    reasons: ['Work-ku dhaan, sathiyama', 'Oruthar-ku reply pannanum', 'Paathutu irukradha mudikkanum', 'Reason illa. Naan weak.'],
    pick: 'Mudhalla reason choose pannu',
    next: 'Next',
    typeEyebrow: 'UNGA CONFESSION',
    typeTitle: 'Idha apdiye type pannu.',
    typeHint: 'Exact-a type pannu. Paste panna mudiyaadhu.',
    typoHint: 'Typo. Letters correct-a irukkanum.',
    sentences: [
      'Idhu work-ku dhaan, mudichittu close pannuven.',
      'Oru message-ku reply panni kelambiduven.',
      'Indha onna mudichittu close pannuven.',
      'Innaiku ella vishayatha vida {app}-a dhaan choose panren.',
    ],
    secondEyebrow: 'RENDAAVADHU SNOOZE',
    secondTitle: 'Periya line. Periya wait.',
    waitEyebrow: 'TYPE PANNIYACHU. IPPO WAIT.',
    waitTitle: 'Naan paathutu irukken. Neenga wait pannunga.',
    wait: '5 minutes kudu · {n}',
    readyEyebrow: 'SARI.',
    readyTitle: '5 minutes. Naan count panren.',
    confirm: '5 minutes kudu',
    back: 'Vendaam, close pannu',
    backoutEyebrow: 'FIGHT ILLAMA CLOSE',
  },
};

const NOTIF: Record<S['roastLang'], NonNullable<WatcherConfig['notif']>> = {
  en: {
    headsUpTitle: '{app}: {left} left',
    lastCallTitle: '{app}: {left}.',
    lateNightTitle: "It's {clock}.",
    headsUpLabel: 'HEADS UP',
    lastCallLabel: 'LAST CALL',
    lateNightLabel: 'STILL UP?',
    putDown: 'Put it down',
    goSleep: 'Go to sleep',
    open: 'Open Endloop',
    watchingTitle: 'Loop is watching',
    over: 'over',
    explainTitle: 'One quiet notification, sorry',
    explainText: "Android makes me show one quiet notification so I can keep watching. Swipe it away if it bugs you. I'll still be here.",
    weeklyTitle: 'Your weekly roast is ready.',
    weeklyText: 'Brace yourself.',
    weeklyLabel: 'THIS WEEK',
    weeklyOpen: 'See my roast',
  },
  'ta-Latn': {
    headsUpTitle: '{app}: innum {left} dhaan',
    lastCallTitle: '{app}: {left} dhaan.',
    lateNightTitle: 'Mani {clock} aachu.',
    headsUpLabel: 'HEADS UP',
    lastCallLabel: 'LAST CALL',
    lateNightLabel: 'INNUM THOONGALA?',
    putDown: 'Keela vai',
    goSleep: 'Poi thoongu',
    open: 'Endloop open pannu',
    watchingTitle: 'Loop paathutu irukken',
    over: 'over',
    explainTitle: 'Oru notification irukkum, sorry',
    explainText: 'Android sollirukku, naan watch panna idhu venum. Swipe pannu, naan inga dhaan irupen.',
    weeklyTitle: 'Indha vaara roast ready.',
    weeklyText: 'Thayaaraa irunga.',
    weeklyLabel: 'INDHA VAARAM',
    weeklyOpen: 'Roast-a paaru',
  },
};

const ROAST: Record<S['roastLang'], NonNullable<WatcherConfig['roast']>> = {
  en: {
    eyebrow: "TIME'S UP",
    stat: '{app} · {time} today · opened {opens} times',
    reopenEyebrow: 'BACK ALREADY?',
    reopenStat: '{app} · reopened {n} times since your roast',
    reopenLines: ["It's been {ago}. I'm not tired. Are you?", "{ago}. That's all you lasted.", 'We can do this all day. I literally can.'],
    usedUpEyebrow: 'NO MORE SNOOZES',
    usedUpNote: 'Snoozes reset at midnight.',
    shareEyebrow: 'I GOT ROASTED',
    shareStat: '{app} · {time} today',
    shareTagline: 'Get roasted. Scroll less.',
    shareLabel: 'Share this roast',
  },
  'ta-Latn': {
    eyebrow: "TIME'S UP",
    stat: '{app} · innaiku {time} · {opens} thadava open panna',
    reopenEyebrow: 'THIRUMBI VANTHACHA?',
    reopenStat: '{app} · roast-ku apram {n} thadava open panna',
    reopenLines: ['{ago} dhaan aachu. Naan tired illa. Neenga?', '{ago} kooda thaanga mudiyala?', 'Naal full-a idhe pannalaam. Enakku problem illa.'],
    usedUpEyebrow: 'SNOOZE MUDINJIDUCHU',
    usedUpNote: 'Midnight-ku snooze reset aagum.',
    shareEyebrow: 'I GOT ROASTED',
    shareStat: '{app} · innaiku {time}',
    shareTagline: 'Get roasted. Scroll less.',
    shareLabel: 'Indha roast-a share pannu',
  },
};

/** Late-night nudges start at 11:30 pm unless changed in Settings. */
const DEFAULT_BEDTIME_MIN = 23 * 60 + 30;

/** What the Kotlin watcher needs: limits plus the roast lines it may pick from. */
export function buildConfig(s: S): WatcherConfig {
  const who = { lang: s.roastLang, intensity: s.intensity, roaster: s.roaster };
  return {
    enabled: s.onboarded && s.tracked.length > 0,
    closeLabel: s.roastLang === 'ta-Latn' ? 'Sari, close pannu' : 'Fine. Close it.',
    snoozeLabel: s.roastLang === 'ta-Latn' ? 'Innum 5 minutes venum' : 'I need 5 more minutes',
    maxSnoozesPerDay: 2,
    friction: {
      ...FRICTION[s.roastLang],
      secondSentences: linesFor('snooze_sentence_2', { ...who, packageName: '' }),
      backoutLines: linesFor('snooze_backout', { ...who, packageName: '' }),
      factLabel: FACT_LABEL[s.roastLang],
      facts: factsFor(s.roastLang, s.intensity),
    },
    notif: NOTIF[s.roastLang],
    roast: ROAST[s.roastLang],
    bedtimeMin: s.bedtimeMin ?? DEFAULT_BEDTIME_MIN,
    notify: s.notify,
    pausedUntil: s.pausedOn === localDay() ? endOfToday() : 0,
    roaster: s.roaster,
    intensity: s.intensity,
    apps: s.tracked.map((a) => ({
      packageName: a.packageName,
      label: a.label,
      limitMin: a.limitMin,
      lines: {
        heads_up: linesFor('heads_up', { ...who, packageName: a.packageName, appLabel: a.label }),
        last_call: linesFor('last_call', { ...who, packageName: a.packageName, appLabel: a.label }),
        limit_hit: linesFor('limit_hit', { ...who, packageName: a.packageName, appLabel: a.label }),
        late_night: linesFor('late_night', { ...who, packageName: a.packageName, appLabel: a.label }),
        snoozes_used_up: linesFor('snoozes_used_up', { ...who, packageName: a.packageName, appLabel: a.label }),
      },
    })),
  };
}

let last = '';

/** Push settings to the native watcher (starts or stops it). No-op without the native core. */
export async function syncWatcher(s: S = useSettings.getState()) {
  if (!EndloopCore) return;
  const json = JSON.stringify(buildConfig(s));
  if (json === last) return;
  last = json;
  await EndloopCore.setConfig(json);
}

/** Keep the watcher in sync with settings for the lifetime of the app. Returns an unsubscribe. */
export function startWatcherSync(): () => void {
  syncWatcher().catch(() => {});
  return useSettings.subscribe((s) => {
    syncWatcher(s).catch(() => {});
  });
}

/** True when the watcher hasn't ticked for over a minute although it should be running. */
export function watcherLooksDead(): boolean {
  if (!EndloopCore) return false;
  const s = useSettings.getState();
  if (!s.onboarded || !s.tracked.length) return false;
  const hb = EndloopCore.lastHeartbeat();
  return hb > 0 && Date.now() - hb > 60_000;
}
