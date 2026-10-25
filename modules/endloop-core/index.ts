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
  /** Opens the page and brings Endloop back by itself once the switch is on. */
  openUsageAccessSettings(): Promise<void>;
  /** Opens the page and brings Endloop back by itself once the switch is on. */
  openOverlaySettings(): Promise<void>;
  /** Endloop's App info page (Battery → Unrestricted); comes back by itself once exempt. */
  openBatterySettings(): Promise<void>;
  /** The phone maker's autostart / background page, falling back to App info. False if nothing opened. */
  openBrandBackgroundSettings(): Promise<boolean>;
  /** System settings for just the status ("Loop is watching") channel. */
  openStatusNotificationSettings?(): Promise<void>;
  /** Package of the store that installed Endloop ("com.android.vending" for Play), or null when sideloaded. */
  installSource(): string | null;
  /** Android 13+ and installed from an APK file or download: Usage access and overlay need "Allow restricted settings" first. */
  isRestrictedSettingsLikely(): boolean;
  listApps(days: number): Promise<NativeApp[]>;
  todayMinutes(packages: string[]): Promise<Record<string, number>>;
  setConfig(json: string): Promise<void>;
  startWatcher(): Promise<void>;
  stopWatcher(): Promise<void>;
  lastHeartbeat(): number;
  /** JSON array of { from, to } (ms) when Endloop was off while the phone was on. */
  offGaps?(): string;
  /** JSON array of { packageName, reason, at } from the "Convince me" step. */
  snoozeLog(): string;
  appDetail(packageName: string, days: number): Promise<NativeAppDetail>;
  /** JSON array of { packageName, text, at } for every roast shown. */
  roastLog(): string;
  /** Oldest first, today last. */
  history(days: number, packages: string[]): Promise<NativeHistoryDay[]>;
  /** Screen 21: render a square share card natively (see src/lib/share-cards.ts); share = true opens the share sheet, false saves to Pictures/Endloop. */
  shareCard(json: string, share: boolean): Promise<boolean>;
  /** Which of these packages are still installed. */
  installed(packages: string[]): string[];
  /** Stop watching and wipe everything the native side stored. */
  clearData(): Promise<void>;
  shareRoast(text: string, stat: string): Promise<boolean>;
  /** Testing: send one notification now (ignores the Settings toggles). False if nothing is tracked yet. */
  testNotification?(kind: 'heads_up' | 'last_call' | 'late_night' | 'weekly' | 'loops' | 'explain'): Promise<boolean>;
  /** Snooze ladder: snoozes today across all apps (the next step is this + 1). */
  snoozesToday?(): number;
  /** Snooze ladder: snooze this app for `minutes` and log the reason. */
  grantSnooze?(packageName: string, minutes: number, reason: string): void;
  /** Snooze ladder: no roasts for this app until midnight. */
  bunk?(packageName: string, how: 'leave' | 'timeout' | 'payback'): void;
  /** Snooze ladder: "Never mind, close it" counts as a win. */
  /** Go to the launcher (the snooze screen's "Never mind, close it"). */
  goHome?(): boolean;
  addWin?(): void;
  /** Open an app (back to it after a snooze). */
  openApp?(packageName: string): boolean;
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
  intensity?: 'polite' | 'honest' | 'savage'; // Unhinged is sent as 'savage' (image name)
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
    minimalText?: string;
    browserTitle?: string;
    browserText?: string;
    weeklyIn?: string;
    weeklyLoopsTail?: string;
    loopsTitleEnough?: string;
    loopsTitleShort?: string;
    loopsText?: string;
    loopsLabel?: string;
    loopsOpen?: string;
    loopsOpenShort?: string;
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
    clockEyebrow?: string;
    clockLine?: string;
    /** The day's 2nd roast for an app, and the 3rd+ ({n} = 3RD, 4TH…). */
    secondEyebrow?: string;
    thirdEyebrow?: string;
    /** Premium Strict mode wall. */
    strictEyebrow?: string;
    strictLine?: string;
    strictNote?: string;
  };
  /** The snooze ladder runs in the app (src/app/snooze.tsx): "5 more minutes" opens it there. */
  ladder?: boolean;
  /** Snooze button per ladder step: 1st, 2nd, 3rd, 4th and later. */
  ladderLabels?: string[];
  /** Premium Strict mode: after the 3rd snooze of the day, no more snoozes. */
  strict?: boolean;
  /** Snooze length in minutes (Premium can pick 2). */
  snoozeMin?: number;
  /** Minutes after midnight when late-night nudges start (until 5 am); -1 turns them off. */
  bedtimeMin?: number;
  /** Notification types left on in Settings. */
  notify?: { headsUp: boolean; lastCall: boolean; lateNight: boolean; weekly: boolean };
  /** Pause for today: no warnings or roasts before this time (ms). */
  pausedUntil?: number;
  /** Booked leave days (YYYY-MM-DD, local): no warnings or roasts on these days. */
  offDays?: string[];
  /** Half-day leaves (Premium, YYYY-MM-DD): no warnings or roasts from 18:00 on these days. */
  halfDays?: string[];
  /** This week's Loops for the Saturday reminder and Sunday last call; `week` = Monday (YYYY-MM-DD). */
  loops?: { count: number; week: string; carry: boolean; cost: number };
  /** Settings → Status notification: "live" counter (default) or "minimal". */
  statusMode?: 'live' | 'minimal';
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
    /** Premium: Saturday and Sunday limit; the watcher uses it on those days. Left out = same as limitMin. */
    weekendLimitMin?: number;
    /** "Pay it back" day (YYYY-MM-DD): the limit is 15 min shorter that day. */
    payBackOn?: string;
    lines: { heads_up: string[]; last_call: string[]; limit_hit: string[]; late_night: string[]; snoozes_used_up: string[] };
  }[];
};
