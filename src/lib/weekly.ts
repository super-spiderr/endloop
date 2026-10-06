import type { HistoryDay } from '@/data/usage';
import { fill, pickRoast } from '@/roasts';
import type { Roaster } from '@/characters';
import type { Intensity, RoastLang, TrackedApp } from '@/store/settings';

import { fmt } from './time';

const DAY = 86_400_000;

export type WeekType = 'first' | 'good' | 'bad' | 'mixed';

/** Everything Screen 13 shows, worked out from the last 14 days of history. */
export type WeeklyReport = {
  dates: string; // "22–28 Sep"
  total: number; // minutes on tracked apps this week
  perDay: number;
  worst: { label: string; minutes: number } | null;
  wonBack: number | null; // vs before Endloop; negative = lost
  underDays: number;
  countedDays: number;
  wins: number;
  type: WeekType;
  roast: string;
};

export function weeklyReport(
  days: HistoryDay[],
  tracked: TrackedApp[],
  startedAt: string,
  baseline: number | undefined,
  who: { lang: RoastLang; intensity: Intensity; roaster: Roaster },
): WeeklyReport {
  const start = new Date(`${startedAt}T00:00:00`).getTime();
  const week = days.slice(-7);
  const last = days.slice(-14, -7);
  const counted = week.filter((d) => d.day >= start);
  const sum = (ds: HistoryDay[], pkg?: string) =>
    ds.reduce((s, d) => s + (pkg ? (d.apps[pkg] ?? 0) : tracked.reduce((t, a) => t + (d.apps[a.packageName] ?? 0), 0)), 0);

  const total = sum(week);
  const lastTotal = sum(last);
  const worstApp = tracked.map((a) => ({ label: a.label, minutes: sum(week, a.packageName) })).sort((a, b) => b.minutes - a.minutes)[0];
  const worst = worstApp && worstApp.minutes > 0 ? worstApp : null;
  const wonBack = baseline != null ? baseline * counted.length - sum(counted) : null;
  const underDays = counted.filter((d) => tracked.every((a) => (d.apps[a.packageName] ?? 0) <= a.limitMin)).length;
  const wins = counted.reduce((s, d) => s + d.wins, 0);

  const firstWeek = Date.now() - start < 7 * DAY;
  const type: WeekType = firstWeek
    ? 'first'
    : wonBack != null && wonBack < 0
      ? 'bad'
      : (wonBack ?? 0) > 0 && (lastTotal === 0 || total <= lastTotal)
        ? 'good'
        : 'mixed';

  const vars = {
    won_back: fmt(Math.max(0, wonBack ?? 0)),
    worst_app: worst?.label ?? 'your phone',
    worst_time: fmt(worst?.minutes ?? 0),
    week_total: fmt(total),
  };
  const line = pickRoast({ category: `weekly_${type}`, ...who, seed: Math.floor(Date.now() / DAY), vars: Object.keys(vars) });
  const fallback: Record<WeekType, string> = {
    first: "Week 1. The baseline is set. Now we see what you're made of.",
    good: "Fine. You did well. Don't let it go to your head.",
    bad: 'You scrolled more than before you installed me. Impressive, in the worst way.',
    mixed: `Some days you won, some days ${vars.worst_app} won. Rematch next week.`,
  };

  const first = new Date(week[0]?.day ?? Date.now());
  const lastDay = new Date(week[week.length - 1]?.day ?? Date.now());
  const month = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short' });
  const dates =
    month(first) === month(lastDay) ? `${first.getDate()}–${lastDay.getDate()} ${month(lastDay)}` : `${first.getDate()} ${month(first)} – ${lastDay.getDate()} ${month(lastDay)}`;

  return {
    dates,
    total,
    perDay: Math.round(total / 7),
    worst,
    wonBack,
    underDays,
    countedDays: counted.length,
    wins,
    type,
    roast: fill(line ?? fallback[type], vars),
  };
}
