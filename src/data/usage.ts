import { EndloopCore } from 'endloop-core';

/**
 * Where screen-time numbers come from.
 *
 * On an Android dev/production build this is the native `endloop-core` module
 * (UsageStatsManager). Anywhere the native code isn't available (Expo Go, web) it falls back to
 * believable demo numbers, so screens can still be built and previewed.
 */
export type InstalledApp = {
  packageName: string;
  label: string;
  /** Tile colour, used when there's no icon. */
  color: string;
  /** file:// icon from the phone, when available. */
  iconUri?: string | null;
  /** Average minutes per day over the last 7 days. */
  avgDailyMin: number;
  /** Total minutes over the last 7 days. */
  weekMin: number;
};

export type TodayUsage = Record<string, number>; // packageName -> minutes used today

export type AppDetail = {
  daily: { day: number; minutes: number }[];
  opensToday: number;
  longestTodayMin: number;
  parts: [number, number, number, number];
};

export type HistoryDay = { day: number; apps: Record<string, number>; roasts: number; snoozes: number; wins: number };

export type RoastEntry = { packageName: string; text: string; at: number };

export interface UsageSource {
  readonly isReal: boolean;
  hasUsageAccess(): Promise<boolean>;
  /** Launcher apps, worst first (by last week's usage). Endloop itself excluded. */
  listApps(): Promise<InstalledApp[]>;
  today(packages: string[]): Promise<TodayUsage>;
  /** Screen 11: the last 7 days of one app. */
  detail(packageName: string): Promise<AppDetail>;
  /** Roasts shown for one app, newest first. */
  roasts(packageName: string): RoastEntry[];
  /** Screen 12: the last `days` days, oldest first. */
  history(days: number, packages: string[]): Promise<HistoryDay[]>;
}

function parseRoasts(json: string, packageName: string): RoastEntry[] {
  try {
    const all = JSON.parse(json) as RoastEntry[];
    return all.filter((r) => r.packageName === packageName).reverse();
  } catch {
    return [];
  }
}

const TILE_COLORS = ['#B04A7A', '#B8443A', '#B9A032', '#3E8B5E', '#4A6FB0', '#3A3A3A', '#8E2E2E', '#2E7D4F', '#6B5BFF', '#B86E00'];
function tileColor(pkg: string): string {
  let h = 0;
  for (let i = 0; i < pkg.length; i++) h = (h * 31 + pkg.charCodeAt(i)) | 0;
  return TILE_COLORS[Math.abs(h) % TILE_COLORS.length];
}

const DAYS = 7;

const nativeUsage: UsageSource | null = EndloopCore
  ? {
      isReal: true,
      async hasUsageAccess() {
        return EndloopCore!.hasUsageAccess();
      },
      async listApps() {
        const apps = await EndloopCore!.listApps(DAYS);
        return apps.map((a) => {
          const weekMin = Math.round(a.totalMs / 60000);
          return {
            packageName: a.packageName,
            label: a.label,
            iconUri: a.iconUri,
            color: tileColor(a.packageName),
            weekMin,
            avgDailyMin: Math.round(weekMin / DAYS),
          };
        });
      },
      async today(packages) {
        const m = await EndloopCore!.todayMinutes(packages);
        return Object.fromEntries(packages.map((p) => [p, Math.round(m[p] ?? 0)]));
      },
      async detail(packageName) {
        const d = await EndloopCore!.appDetail(packageName, DAYS);
        return {
          daily: d.daily.map((x) => ({ day: x.day, minutes: Math.round(x.minutes) })),
          opensToday: d.opensToday,
          longestTodayMin: Math.round(d.longestTodayMin),
          parts: d.parts.map((m) => Math.round(m)) as AppDetail['parts'],
        };
      },
      roasts(packageName) {
        return parseRoasts(EndloopCore!.roastLog(), packageName);
      },
      async history(days, packages) {
        return EndloopCore!.history(days, packages);
      },
    }
  : null;

const DEMO_APPS: InstalledApp[] = [
  { packageName: 'com.instagram.android', label: 'Instagram', color: '#B04A7A', avgDailyMin: 160, weekMin: 1120 },
  { packageName: 'com.google.android.youtube', label: 'YouTube', color: '#B8443A', avgDailyMin: 121, weekMin: 845 },
  { packageName: 'com.snapchat.android', label: 'Snapchat', color: '#B9A032', avgDailyMin: 79, weekMin: 552 },
  { packageName: 'com.whatsapp', label: 'WhatsApp', color: '#3E8B5E', avgDailyMin: 56, weekMin: 390 },
  { packageName: 'com.android.chrome', label: 'Chrome', color: '#4A6FB0', avgDailyMin: 36, weekMin: 250 },
  { packageName: 'com.twitter.android', label: 'X', color: '#3A3A3A', avgDailyMin: 29, weekMin: 205 },
  { packageName: 'com.netflix.mediaclient', label: 'Netflix', color: '#8E2E2E', avgDailyMin: 24, weekMin: 170 },
  { packageName: 'com.spotify.music', label: 'Spotify', color: '#2E7D4F', avgDailyMin: 14, weekMin: 100 },
];

const DEMO_TODAY: TodayUsage = {
  'com.instagram.android': 92,
  'com.google.android.youtube': 38,
  'com.snapchat.android': 12,
  'com.whatsapp': 20,
};

export const mockUsage: UsageSource = {
  isReal: false,
  async hasUsageAccess() {
    return true;
  },
  async listApps() {
    return DEMO_APPS;
  },
  async today(packages) {
    return Object.fromEntries(packages.map((p) => [p, DEMO_TODAY[p] ?? 0]));
  },
  async detail(packageName) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mins = [95, 128, 140, 52, 70, 58, DEMO_TODAY[packageName] ?? 30];
    return {
      daily: mins.map((m, i) => ({ day: today.getTime() - (6 - i) * 86_400_000, minutes: m })),
      opensToday: 14,
      longestTodayMin: 42,
      parts: [56, 98, 147, 343],
    };
  },
  async history(days, packages) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: days }, (_, i) => {
      const k = days - 1 - i;
      const f = 0.55 + 0.35 * ((k * 37) % 10) / 10;
      return {
        day: today.getTime() - k * 86_400_000,
        apps: Object.fromEntries(packages.map((p) => [p, Math.round((DEMO_APPS.find((a) => a.packageName === p)?.avgDailyMin ?? 40) * f)])),
        roasts: k % 3,
        snoozes: k % 4 === 0 ? 1 : 0,
        wins: k % 2,
      };
    });
  },
  roasts() {
    const now = Date.now();
    return [
      { packageName: '', text: "1h 10m of other people's vacations. Your own life is on airplane mode.", at: now - 3_600_000 },
      { packageName: '', text: "It's been 40 seconds. I'm not tired. Are you?", at: now - 86_400_000 },
    ];
  },
};

/** Apps people usually mean by "doomscrolling", pinned when hours aren't available. */
export const USUAL_SUSPECTS = ['com.instagram.android', 'com.google.android.youtube', 'com.snapchat.android', 'com.twitter.android'];

export const usage: UsageSource = nativeUsage ?? mockUsage;
