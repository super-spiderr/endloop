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
};

export type PermissionState = 'pending' | 'granted' | 'skipped';
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

  set: (patch: Partial<Omit<Settings, 'set' | 'setLimit' | 'setPermission' | 'reset'>>) => void;
  setLimit: (packageName: string, limitMin: number) => void;
  setPermission: (key: keyof Settings['permissions'], state: PermissionState) => void;
  /** Lowering applies now; raising waits for tomorrow. Returns when it takes effect. */
  changeLimit: (packageName: string, limitMin: number) => 'now' | 'tomorrow';
  /** Stop tracking from tomorrow (today's limit stays). */
  scheduleRemove: (packageName: string) => void;
  cancelRemove: (packageName: string) => void;
  /** Apply raises and removals whose day has come. Call on start and whenever the app comes back. */
  applyScheduled: () => void;
  reset: () => void;
};

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
      changeLimit: (packageName, limitMin) => {
        const app = get().tracked.find((a) => a.packageName === packageName);
        const now = !app || limitMin <= app.limitMin;
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
