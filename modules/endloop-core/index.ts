import { requireOptionalNativeModule } from 'expo';

export type NativeApp = {
  packageName: string;
  label: string;
  /** Foreground time over the requested window, in milliseconds. */
  totalMs: number;
  /** file:// PNG of the app's icon, cached by the module. */
  iconUri: string | null;
};

/** Screen 11: one app's recent usage. */
export type NativeAppDetail = {
  /** Oldest first, today last. `day` = local midnight in ms. */
  daily: { day: number; minutes: number }[];
  opensToday: number;
  longestTodayMin: number;
  /** Minutes over the period: morning 6–12, afternoon 12–17, evening 17–22, late night 22–6. */
  parts: [number, number, number, number];
};

/** Screen 12: one day of history. `day` = local midnight in ms; `apps` = minutes per tracked app. */
export type NativeHistoryDay = { day: number; apps: Record<string, number>; roasts: number; snoozes: number; wins: number };

type EndloopCoreModule = {
  hasUsageAccess(): boolean;
  canDrawOverlays(): boolean;
  isIgnoringBatteryOptimizations(): boolean;
  areNotificationsEnabled(): boolean;
  openUsageAccessSettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  openBatterySettings(): Promise<void>;
  listApps(days: number): Promise<NativeApp[]>;
  todayMinutes(packages: string[]): Promise<Record<string, number>>;
  setConfig(json: string): Promise<void>;
  startWatcher(): Promise<void>;
  stopWatcher(): Promise<void>;
  lastHeartbeat(): number;
  /** JSON array of { packageName, reason, at } from the "Convince me" step. */
  snoozeLog(): string;
  appDetail(packageName: string, days: number): Promise<NativeAppDetail>;
  /** JSON array of { packageName, text, at } for every roast shown. */
  roastLog(): string;
  /** Oldest first, today last. */
  history(days: number, packages: string[]): Promise<NativeHistoryDay[]>;
  /** Screen 13: render the weekly card natively; share = true opens the share sheet, false saves to Pictures/Endloop. */
  weeklyCard(json: string, share: boolean): Promise<boolean>;
  /** Which of these packages are still installed. */
  installed(packages: string[]): string[];
  /** Stop watching and wipe everything the native side stored. */
  clearData(): Promise<void>;
  shareRoast(text: string, stat: string): Promise<boolean>;
  /** Testing: send one notification now (ignores the Settings toggles). False if nothing is tracked yet. */
  testNotification?(kind: 'heads_up' | 'last_call' | 'late_night' | 'weekly' | 'explain'): Promise<boolean>;
  /** Screen 17: false until a build made with `prebuild --clean` includes the icon aliases. */
  appIconSupported?(): boolean;
  /** 'default' | 'loop' | 'lupe' — what the user picked (may still be waiting to apply). */
  appIcon?(): string;
  /** Saved now; the launcher icon changes when Endloop goes to the background. */
  setAppIcon?(name: string): void;
};

/**
 * Endloop's Android core. `null` where the native code isn't built in
 * (Expo Go, web, iOS), so callers can fall back to demo data.
 */
export const EndloopCore = requireOptionalNativeModule<EndloopCoreModule>('EndloopCore');

/** Shape the Kotlin watcher reads (see Store.kt). */
export type WatcherConfig = {
  enabled: boolean;
  closeLabel: string;
  snoozeLabel: string;
  maxSnoozesPerDay: number;
  /** Who roasts and how hard: picks Loop / Lupe's pose on the native roast screen. */
  roaster?: 'loop' | 'lupe';
  intensity?: 'polite' | 'honest' | 'savage';
  /** Notification copy (Screen 8). {app}, {left}, {clock} are filled natively. */
  notif?: {
    headsUpTitle: string;
    lastCallTitle: string;
    lateNightTitle: string;
    headsUpLabel: string;
    lastCallLabel: string;
    lateNightLabel: string;
    putDown: string;
    goSleep: string;
    open: string;
    watchingTitle: string;
    over: string;
    explainTitle: string;
    explainText: string;
    weeklyTitle: string;
    weeklyText: string;
    weeklyLabel: string;
    weeklyOpen: string;
  };
  /** Roast screen copy (Screen 9). */
  roast?: {
    eyebrow: string;
    stat: string;
    reopenEyebrow: string;
    reopenStat: string;
    reopenLines: string[];
    usedUpEyebrow: string;
    usedUpNote: string;
    shareEyebrow: string;
    shareStat: string;
    shareTagline: string;
    shareLabel: string;
  };
  /** Minutes after midnight when late-night nudges start (until 5 am); -1 turns them off. */
  bedtimeMin?: number;
  /** Notification types left on in Settings. */
  notify?: { headsUp: boolean; lastCall: boolean; lateNight: boolean; weekly: boolean };
  /** Pause for today: no warnings or roasts before this time (ms). */
  pausedUntil?: number;
  /** Copy for the "Convince me" step behind the snooze button. {app} and {n} are filled natively. */
  friction?: {
    eyebrow: string;
    title: string;
    subtitle: string;
    reasons: string[];
    pick: string;
    next: string;
    typeEyebrow: string;
    typeTitle: string;
    typeHint: string;
    typoHint: string;
    /** One confession per reason. */
    sentences: string[];
    secondEyebrow: string;
    secondTitle: string;
    secondSentences: string[];
    waitEyebrow: string;
    waitTitle: string;
    wait: string;
    readyEyebrow: string;
    readyTitle: string;
    confirm: string;
    factLabel: string;
    /** Facts, time math and tips in the user's tone; {app} {time} {weekHours} {yearDays} filled natively. */
    facts: { text: string; source: string }[];
    back: string;
    backoutEyebrow: string;
    backoutLines: string[];
  };
  apps: {
    packageName: string;
    label: string;
    limitMin: number;
    lines: { heads_up: string[]; last_call: string[]; limit_hit: string[]; late_night: string[]; snoozes_used_up: string[] };
  }[];
};
