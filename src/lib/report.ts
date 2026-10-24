/**
 * Report Card and weekly-roast numbers (Product Book A6/A7, canvas Screens 19 and 25), worked out from
 * the phone's usage history, the snooze log and per-app day parts. Pure functions; screens load data.
 */
import { EndloopCore } from 'endloop-core';

import type { HistoryDay } from '@/data/usage';
import type { TrackedApp } from '@/store/settings';

const DAY = 86_400_000;

/** Minutes on the tracked apps that day. */
export const dayTotal = (d: HistoryDay, tracked: TrackedApp[]) => tracked.reduce((s, a) => s + (d.apps[a.packageName] ?? 0), 0);

/** The user's normal day before Endloop: the onboarding baseline, else the apps' own 7-day averages. */
export function normalDay(tracked: TrackedApp[], baselineDailyMin?: number): number | null {
  if (baselineDailyMin != null) return baselineDailyMin;
  const picked = tracked.reduce((s, a) => s + a.avgDailyMin, 0);
  return picked > 0 ? picked : null;
}

/** Monday 00:00 of the week `ms` is in. */
export function mondayOf(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/* ---------- snooze excuses ---------- */

type SnoozeEntry = { packageName: string; reason: string; at: number };

/** Reasons people actually picked (games, cool-offs and bunks are ladder steps, not excuses). */
export function snoozeEntries(): SnoozeEntry[] {
  try {
    const all = JSON.parse(EndloopCore?.snoozeLog() ?? '[]') as SnoozeEntry[];
    return all.filter((e) => e && typeof e.reason === 'string');
  } catch {
    return [];
  }
}

const isExcuse = (r: string) => !/^(game:|bunk:|cooloff)/.test(r);

/** The most used excuse since `from` (ms), with its count. */
export function topExcuse(from: number, entries = snoozeEntries()): { reason: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const e of entries) if (e.at >= from && isExcuse(e.reason)) counts.set(e.reason, (counts.get(e.reason) ?? 0) + 1);
  let best: { reason: string; count: number } | null = null;
  for (const [reason, count] of counts) if (!best || count > best.count) best = { reason, count };
  return best;
}

/** Bunks since `from` (ms), newest first, for "Wednesday: you bunked Instagram at 4:12 pm." */
export function bunksSince(from: number, entries = snoozeEntries()) {
  return entries.filter((e) => e.at >= from && e.reason.startsWith('bunk:')).sort((a, b) => b.at - a.at);
}

/* ---------- weakest part of the day (Premium) ---------- */

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'late';
export const PARTS: { key: DayPart; label: string; hours: number; range: string }[] = [
  { key: 'morning', label: '6 am', hours: 6, range: '6 am to noon' },
  { key: 'afternoon', label: 'noon', hours: 5, range: 'noon to 5 pm' },
  { key: 'evening', label: '5 pm', hours: 5, range: '5 pm to 10 pm' },
  { key: 'late', label: '10 pm', hours: 8, range: '10 pm to 6 am' },
];

/** Sum the apps' day parts (from appDetail) and find the hours the thumb gives up. Per hour, so the long night isn't favoured. */
export function weakestPart(parts: [number, number, number, number][]) {
  const sum = [0, 1, 2, 3].map((i) => parts.reduce((s, p) => s + (p[i] ?? 0), 0));
  const perHour = sum.map((m, i) => m / PARTS[i].hours);
  const max = Math.max(...perHour, 0);
  const worst = perHour.indexOf(max);
  return { perHour, max, worst: max > 0 ? PARTS[worst] : null };
}

export const WEAK_LINE: Record<DayPart, string> = {
  morning: 'You crack before breakfast. The day hasn’t even started.',
  afternoon: 'You crack after lunch. Every single day. Food coma, scroll coma.',
  evening: 'You crack in the evening. Dinner is a scroll break with food.',
  late: 'You crack after 10 pm. Every night. I see you.',
};

/* ---------- month (Premium) ---------- */

/** Days of the calendar month that `ref` is in, up to and including `ref`'s day. */
function monthDays(days: HistoryDay[], ref: Date) {
  return days.filter((d) => {
    const x = new Date(d.day);
    return x.getFullYear() === ref.getFullYear() && x.getMonth() === ref.getMonth() && d.day <= ref.getTime();
  });
}

export function monthReport(days: HistoryDay[], tracked: TrackedApp[], start: number, normal: number | null, now = Date.now()) {
  const today = new Date(now);
  const thisMonth = monthDays(days, today).filter((d) => d.day >= start);
  const prevRef = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59);
  const lastMonth = monthDays(days, prevRef).filter((d) => d.day >= start);
  const avg = (ds: HistoryDay[]) => (ds.length ? ds.reduce((s, d) => s + dayTotal(d, tracked), 0) / ds.length : null);
  const wonBack = normal != null ? Math.round(normal * thisMonth.length - thisMonth.reduce((s, d) => s + dayTotal(d, tracked), 0)) : null;
  const a = avg(thisMonth);
  const b = avg(lastMonth);
  const change = a != null && b != null && b > 0 ? Math.round(((a - b) / b) * 100) : null;

  const trend = days.slice(-30).map((d) => ({ day: d.day, minutes: d.day >= start ? dayTotal(d, tracked) : null }));

  // Worst and best weekday over the last 4 full weeks.
  const recent = days.slice(-28).filter((d) => d.day >= start);
  const byDow = Array.from({ length: 7 }, (_, i) => recent.filter((d) => new Date(d.day).getDay() === i));
  const dowAvg = byDow.map((ds) => (ds.length >= 2 ? ds.reduce((s, d) => s + dayTotal(d, tracked), 0) / ds.length : null));
  const valid = dowAvg.map((v, i) => ({ v, i })).filter((x) => x.v != null) as { v: number; i: number }[];
  const worstDow = valid.length >= 3 ? valid.reduce((m, x) => (x.v > m.v ? x : m)) : null;
  const bestDow = valid.length >= 3 ? valid.reduce((m, x) => (x.v < m.v ? x : m)) : null;

  // Past weeks (Monday to Sunday), newest first.
  const weeks: { from: number; wonBack: number | null }[] = [];
  const thisMon = mondayOf(now);
  for (let k = 1; k <= 4; k++) {
    const from = thisMon - k * 7 * DAY;
    const ds = days.filter((d) => d.day >= from && d.day < from + 7 * DAY && d.day >= start);
    if (!ds.length) break;
    weeks.push({ from, wonBack: normal != null ? Math.round(normal * ds.length - ds.reduce((s, d) => s + dayTotal(d, tracked), 0)) : null });
  }

  return {
    monthName: today.toLocaleDateString('en-GB', { month: 'long' }),
    lastMonthName: prevRef.toLocaleDateString('en-GB', { month: 'long' }),
    wonBack,
    change,
    trend,
    worstDow: worstDow ? WEEKDAYS[worstDow.i] : null,
    bestDow: bestDow ? WEEKDAYS[bestDow.i] : null,
    weeks,
  };
}

export const WEEKDAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
