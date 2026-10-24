import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Roaster } from '@/characters';

import { zustandStorage } from './storage';

/** 'unhinged' is Premium only (and never for school students). */
export type Intensity = 'polite' | 'honest' | 'savage' | 'unhinged';
export type RoastLang = 'en' | 'ta-Latn';
/** The three tones most text is written in; Unhinged borrows Savage wherever it has nothing of its own. */
export type Tone = Exclude<Intensity, 'unhinged'>;
export const toneOf = (i: Intensity): Tone => (i === 'unhinged' ? 'savage' : i);

export type TrackedApp = {
  packageName: string;
  label: string;
  color: string;
  iconUri?: string | null;
  avgDailyMin: number;
  weekMin: number;
  limitMin: number;
  /** Premium: Saturday and Sunday limit, used when `weekendLimits` is on. Stored only; the watcher doesn't read it yet. */
  weekendLimitMin?: number;
  /** Anti-cheat (Screen 11): a raised limit waits for tomorrow… */
  nextLimitMin?: number;
  /** …from this local date (YYYY-MM-DD). */
  nextFrom?: string;
  /** Stop tracking from this local date (YYYY-MM-DD). */
  removeFrom?: string;
  /** "Pay it back" after a bunk (YYYY-MM-DD): that day the limit is PAY_BACK_MIN shorter. */
  payBackOn?: string;
};

/** Bunk today (snooze ladder, last step): that app is free till midnight; a Strike on Attendance this week. */
export type Bunk = { pkg: string; day: string; how: 'leave' | 'timeout' | 'payback'; at: number };
export const PAY_BACK_MIN = 15;

export type PermissionState = 'pending' | 'granted' | 'skipped';
/** A booked day off (Leave Letter): no roasts that day, streaks paused. */
/** `half` (Premium): a half-day leave, no roasts from 18:00; costs 100 Loops and counts as ½ toward the caps. */
export type LeaveBooking = { day: string; reason: string; paidWith: 'loops' | 'free'; bookedOn: string; half?: boolean };
/** Onboarding "Which one are you?" (optional; steers roast flavour, never an exact age). */
export type UserGroup = 'school' | 'college' | 'working' | 'other';
/** Onboarding "Why are you here?". */
export type Goal = 'exams' | 'sleep' | 'focus' | 'family' | 'checking' | 'own';

type Settings = {
  onboarded: boolean;
  /**
   * Premium. Play Billing isn't built yet, so this is only ever switched on by the paywall in dev
   * builds, to test the Premium screens. Release builds keep it false.
   */
  premium: boolean;
  /** Premium: Today's look. 'premium' (default) = black and red; 'classic' = the white Free look. */
  homeLook?: 'premium' | 'classic';
  /** Premium: separate weekend limits on (see TrackedApp.weekendLimitMin). */
  weekendLimits?: boolean;
  hasUsageAccess: boolean;
  /** What Loop / Lupe call the user in some roasts ({name}). Optional; stays on the phone. */
  name?: string;
  /** True when the roaster picked the name (an earned title) because the user skipped. */
  nameAuto?: boolean;
  group?: UserGroup;
  goal?: Goal;
  /** The user's own words when goal is 'own' (60 chars max). */
  goalText?: string;
  /** Leave Letters booked (Attendance). Cancel before the day for a refund. */
  leaves?: LeaveBooking[];
  /** Loops spent per week (key: the week's Monday, YYYY-MM-DD). Balances are computed from usage history. */
  loopsSpent?: Record<string, number>;
  /** Days a Streak saver covered (YYYY-MM-DD); `premium` = the monthly Premium saver. */
  savedDays?: { day: string; premium: boolean }[];
  /** Longest all-apps streak so far (Streak savers are earned per 30 days of it). */
  bestStreak?: number;
  /** Loops as last worked out in the app, for the native Saturday / Sunday notifications. `week` = that week's Monday. */
  loopsNow?: { count: number; week: string; carry: boolean };
  /** Attendance first-visit walkthrough seen (canvas AT2-D). */
  attendanceIntroSeen?: boolean;
  /** All-apps milestones already celebrated (3, 7, 14, 30, 100). */
  milestonesSeen?: number[];
  /** Welcome bonus granted at the end of onboarding (the Loops & Leaves system reads it later). */
  welcomeBonus?: { loops: number; leaves: number; on: string };
  /** Daily average across all apps from the onboarding reveal (minutes); over 4 h → gentler 20% suggestions. */
  revealDailyMin?: number;
  roaster: Roaster;
  roastLang: RoastLang;
  intensity: Intensity;
  tracked: TrackedApp[];
  permissions: { notifications: PermissionState; overlay: PermissionState; battery: PermissionState };
  howItWorksDismissed: boolean;
  streakDays: number;
  /** Day onboarding finished (YYYY-MM-DD): day 1 of the 21-day challenge. */
  startedAt?: string;
  /** Before-Endloop minutes a day on the tracked apps (Screen 12). Unset until known. */
  baselineDailyMin?: number;
  /** Late-night nudges start here (minutes after midnight); -1 = off. */
  bedtimeMin: number;
  notify: { headsUp: boolean; lastCall: boolean; lateNight: boolean; weekly: boolean };
  /** Pause Endloop for today: the date it was paused (YYYY-MM-DD). */
  pausedOn?: string;
  /** Days paused, for "1 day off" in the weekly roast. */
  pausedDays: string[];
  roastSound: boolean;
  /** Settings → Status notification: live counter or a plain "Endloop is on". */
  statusMode: 'live' | 'minimal';
  /** Day the perfect-day card was last dismissed or shared (YYYY-MM-DD). */
  perfectSeen?: string;
  /** Day the "Want me to be stricter tomorrow?" card was dismissed (YYYY-MM-DD). */
  strictNudgeSeen?: string;
  /** Premium Strict mode: after the 3rd snooze of the day, only "Fine. Close it". */
  strictOn?: boolean;
  /** Day Strict mode was switched on (the wall says "You switched it on Monday"). */
  strictSince?: string;
  /** Switching Strict mode off waits until this day (YYYY-MM-DD). */
  strictOffFrom?: string;
  /** Premium: snooze length, 5 (default) or 2 minutes. Premium is never more lenient. */
  snoozeMin?: 2 | 5;
  /** Premium: hard mode, faster games and more rounds (fallback timers stay the same). */
  hardMode?: boolean;
  /** Premium "Your own words": the user's own reason, held up before the first snooze. */
  ownWords?: { text: string; on: string };
  /** Bunks this month and last (snooze ladder). */
  bunks?: Bunk[];

  set: (patch: Partial<Omit<Settings, 'set' | 'setLimit' | 'setPermission' | 'reset'>>) => void;
  setLimit: (packageName: string, limitMin: number) => void;
  setPermission: (key: keyof Settings['permissions'], state: PermissionState) => void;
  /** Lowering applies now; raising waits for tomorrow. `when: 'tomorrow'` defers a lower one too. Returns when it takes effect. */
  changeLimit: (packageName: string, limitMin: number, when?: 'tomorrow') => 'now' | 'tomorrow';
  /** Stop tracking from tomorrow (today's limit stays). */
  scheduleRemove: (packageName: string) => void;
  cancelRemove: (packageName: string) => void;
  /** Apply raises and removals whose day has come. Call on start and whenever the app comes back. */
  applyScheduled: () => void;
  reset: () => void;
};

/**
 * The limit that applies on `date`: the Premium weekend limit on Saturday and Sunday when it's on,
 * else the everyday one. The native watcher makes the same choice (TrackedApp.limitMin in Store.kt).
 */
export function limitOn(app: TrackedApp, s: { premium: boolean; weekendLimits?: boolean }, date = new Date()): number {
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const base = weekend && s.premium && s.weekendLimits && app.weekendLimitMin != null ? app.weekendLimitMin : app.limitMin;
  // "Pay it back": the day after a bunk, 15 minutes less (TrackedApp.payBackOn; Store.kt does the same).
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return app.payBackOn === key ? Math.max(1, base - PAY_BACK_MIN) : base;
}

/** Strict mode is on today (Premium only; switching it off waits until tomorrow). */
/**
 * Apps the watcher actually watches. Premium (or 3 or fewer): all of them. Premium ended with more than 3: the 3 the user
 * uses most, until they pick their own 3 (S16-H) — stricter, never looser, and the Today card says so.
 */
export function watchedApps(s: { premium: boolean; tracked: TrackedApp[] }): TrackedApp[] {
  if (s.premium || s.tracked.length <= 3) return s.tracked;
  const top = new Set([...s.tracked].sort((a, b) => b.avgDailyMin - a.avgDailyMin).slice(0, 3).map((a) => a.packageName));
  return s.tracked.filter((a) => top.has(a.packageName));
}

export function strictActive(s: { premium: boolean; strictOn?: boolean; strictOffFrom?: string }): boolean {
  return !!s.premium && !!s.strictOn && !(s.strictOffFrom && localDay() >= s.strictOffFrom);
}

/** Local date as YYYY-MM-DD; `plus` days ahead. */
export function localDay(plus = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + plus);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** A name as typed, made safe for roast lines: trimmed, no braces or control characters, 20 chars max. */
export function cleanName(raw: string): string {
  return raw
    .replace(/[{}\p{Cc}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20)
    .trim();
}

/** Tanglish by default when the phone itself is set to Tamil. */
function defaultLang(): RoastLang {
  const code = getLocales()[0]?.languageCode;
  return code === 'ta' ? 'ta-Latn' : 'en';
}

const initial = {
  onboarded: false,
  premium: false,
  hasUsageAccess: false,
  roaster: 'loop' as Roaster,
  roastLang: defaultLang(),
  intensity: 'honest' as Intensity,
  tracked: [] as TrackedApp[],
  permissions: { notifications: 'pending', overlay: 'pending', battery: 'pending' } as Settings['permissions'],
  howItWorksDismissed: false,
  streakDays: 0,
  bedtimeMin: 23 * 60 + 30,
  notify: { headsUp: true, lastCall: true, lateNight: true, weekly: true },
  pausedDays: [] as string[],
  roastSound: false,
  statusMode: 'live' as 'live' | 'minimal',
};

export const useSettings = create<Settings>()(
  persist(
    (set, get) => ({
      ...initial,
      set: (patch) => set(patch),
      setLimit: (packageName, limitMin) =>
        set((s) => ({ tracked: s.tracked.map((a) => (a.packageName === packageName ? { ...a, limitMin } : a)) })),
      setPermission: (key, state) => set((s) => ({ permissions: { ...s.permissions, [key]: state } })),
      changeLimit: (packageName, limitMin, when) => {
        const app = get().tracked.find((a) => a.packageName === packageName);
        const now = when !== 'tomorrow' && (!app || limitMin <= app.limitMin);
        set((s) => ({
          tracked: s.tracked.map((a) => {
            if (a.packageName !== packageName) return a;
            const { nextLimitMin: _n, nextFrom: _f, ...rest } = a;
            return now ? { ...rest, limitMin } : { ...rest, nextLimitMin: limitMin, nextFrom: localDay(1) };
          }),
        }));
        return now ? 'now' : 'tomorrow';
      },
      scheduleRemove: (packageName) =>
        set((s) => ({ tracked: s.tracked.map((a) => (a.packageName === packageName ? { ...a, removeFrom: localDay(1) } : a)) })),
      cancelRemove: (packageName) =>
        set((s) => ({
          tracked: s.tracked.map((a) => {
            if (a.packageName !== packageName) return a;
            const { removeFrom: _r, ...rest } = a;
            return rest;
          }),
        })),
      applyScheduled: () => {
        const today = localDay();
        const s = get();
        const due = s.tracked.some((a) => (a.removeFrom && a.removeFrom <= today) || (a.nextFrom && a.nextFrom <= today));
        if (!due) return;
        set({
          tracked: s.tracked
            .filter((a) => !(a.removeFrom && a.removeFrom <= today))
            .map((a) => {
              if (!(a.nextFrom && a.nextFrom <= today) || a.nextLimitMin == null) return a;
              const { nextLimitMin, nextFrom: _f, ...rest } = a;
              return { ...rest, limitMin: nextLimitMin };
            }),
        });
      },
      reset: () => set({ ...initial, roastLang: defaultLang() }),
    }),
    { name: 'settings', storage: createJSONStorage(() => zustandStorage), version: 1 },
  ),
);
