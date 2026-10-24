/**
 * Loops & Leaves and streaks (Product Book A2b, A3; canvas "Attendance v2").
 * Everything is worked out from the phone's own usage history, so nothing has to be credited at
 * midnight: a day counts once it's over. The store only keeps what the user did (leaves booked,
 * Loops spent, Streak savers used).
 */
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { usage, type HistoryDay, type TodayUsage } from '@/data/usage';
import { limitOn, useSettings, type LeaveBooking, type TrackedApp } from '@/store/settings';

export const LETTER_COST = 200;
/** Premium half-day leave: 100 Loops, no roasts from 18:00 (HALF_DAY_FROM_HOUR in Store.kt), counts as ½. */
export const HALF_COST = 100;
export const HALF_DAY_FROM = 18;
export const MILESTONES = [3, 7, 14, 30, 100];
export const FREE_LEAVES_A_MONTH = 2;
const MAX_LEAVES_A_MONTH = 4;
const DAILY_CAP = 40;
const DAY = 86_400_000;

type S = ReturnType<typeof useSettings.getState>;

/** Local YYYY-MM-DD for a timestamp. */
export function dayOf(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const at = (day: string) => new Date(`${day}T00:00:00`).getTime();
const addDays = (day: string, n: number) => dayOf(at(day) + n * DAY + 3_600_000); // +1 h keeps DST shifts on the right day
/** Monday of the week `day` is in (weeks run Monday to Sunday). */
export function weekStart(day: string): string {
  const dow = (new Date(at(day)).getDay() + 6) % 7; // Monday = 0
  return addDays(day, -dow);
}
const monthOf = (day: string) => day.slice(0, 7);

/** An app earns Loops when its limit is below the user's own normal (onboarding's Earning pill). */
export const earns = (a: TrackedApp) => a.avgDailyMin >= 5 && a.limitMin < a.avgDailyMin;

/** Loops for one finished day: 30 × share of apps under (earning ones only) + 10 if every app was under, max 40. */
function loopsFor(d: HistoryDay, s: S): number {
  const date = new Date(d.day);
  const under = (a: TrackedApp) => (d.apps[a.packageName] ?? 0) <= limitOn(a, s, date);
  if (!s.tracked.length || !s.tracked.some(earns)) return 0;
  const clean = s.tracked.filter((a) => earns(a) && under(a)).length;
  const all = s.tracked.every(under);
  return Math.min(DAILY_CAP, Math.round((30 * clean) / s.tracked.length) + (all ? 10 : 0));
}

export type DayMark = 'present' | 'bunk' | 'leave' | 'today' | 'future' | 'before';
export type AppStatus = 'clean' | 'risk' | 'bunk' | 'learn';

export type Attendance = {
  ready: boolean;
  /** All-apps streak, counted up to yesterday; today only joins once it's over. */
  streak: number;
  best: number;
  atRisk: boolean;
  onLeaveToday: boolean;
  week: { day: string; mark: DayMark }[];
  perApp: Record<string, { streak: number; status: AppStatus; minutesLeft: number; strike: boolean }>;
  loops: number;
  /** Week 1 only: the balance carries into week 2 if it's under 200 by Sunday. */
  firstWeek: boolean;
  clearsInDays: number;
  freeLeavesLeft: number;
  bookings: LeaveBooking[];
  savers: { free: number; premium: number };
  /** Yesterday broke the all-apps streak and a saver could cover it. */
  canSave: string | null;
  /** Loops earned yesterday (the perfect-day card shows them). */
  yesterdayLoops: number;
  /** This week's Loops per finished day, Monday first (null = not over yet, before Endloop, or on leave). */
  weekLoops: (number | null)[];
  /** The app that broke it, and by how much (for "YouTube went 12 minutes over yesterday"). */
  brokeBy: { label: string; overMin: number } | null;
};

/** Work out the whole Attendance state from history (oldest first) and today's minutes. */
export function compute(s: S, history: HistoryDay[], today: TodayUsage, now = Date.now()): Attendance {
  const todayKey = dayOf(now);
  const start = s.startedAt ?? todayKey;
  const leaves = s.leaves ?? [];
  const leaveDays = new Set(leaves.map((l) => l.day));
  const saved = new Set((s.savedDays ?? []).map((x) => x.day));
  const byDay = new Map(history.map((h) => [dayOf(h.day), h]));
  const under = (a: TrackedApp, d: HistoryDay | undefined, day: string) => (d?.apps[a.packageName] ?? 0) <= limitOn(a, s, new Date(at(day)));

  // All-apps streak: walk back from yesterday. Leave days pause it; a saved day counts as present.
  let streak = 0;
  let lastBreak: string | null = null;
  for (let day = addDays(todayKey, -1); day >= start; day = addDays(day, -1)) {
    if (leaveDays.has(day)) continue;
    const d = byDay.get(day);
    if (saved.has(day) || (d && s.tracked.every((a) => under(a, d, day)))) streak++;
    else {
      lastBreak = day;
      break;
    }
  }
  const best = Math.max(s.bestStreak ?? 0, streak);

  const perApp: Attendance['perApp'] = {};
  const daysTracked = Math.round((at(todayKey) - at(start)) / DAY);
  for (const a of s.tracked) {
    let n = 0;
    for (let day = addDays(todayKey, -1); day >= start; day = addDays(day, -1)) {
      if (leaveDays.has(day)) continue;
      if (saved.has(day) || under(a, byDay.get(day), day)) n++;
      else break;
    }
    const used = today[a.packageName] ?? 0;
    const limit = limitOn(a, s, new Date(now));
    const status: AppStatus = used > limit ? 'bunk' : a.avgDailyMin < 5 && daysTracked < 7 ? 'learn' : limit - used <= Math.max(10, limit * 0.15) ? 'risk' : 'clean';
    const strike = (s.bunks ?? []).some((b) => b.pkg === a.packageName && weekStart(b.day) === weekStart(todayKey));
    perApp[a.packageName] = { streak: n, status, minutesLeft: Math.max(0, limit - used), strike };
  }
  const onLeaveToday = leaveDays.has(todayKey);
  const atRisk = !onLeaveToday && s.tracked.some((a) => (today[a.packageName] ?? 0) > limitOn(a, s, new Date(now)));

  // This week's register, Monday to Sunday.
  const monday = weekStart(todayKey);
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    const d = byDay.get(day);
    const mark: DayMark =
      day === todayKey ? (onLeaveToday ? 'leave' : 'today') : day > todayKey ? (leaveDays.has(day) ? 'leave' : 'future') : day < start ? 'before' : leaveDays.has(day) ? 'leave' : saved.has(day) || (d && s.tracked.every((a) => under(a, d, day))) ? 'present' : 'bunk';
    return { day, mark };
  });

  // Loops: this week's finished days (leave days earn nothing), plus the welcome bonus in week 1,
  // plus week 1's balance carried over if it never reached a letter.
  const weekLoops = (mon: string) => {
    let n = mon === weekStart(start) ? (s.welcomeBonus?.loops ?? 0) : 0;
    for (let i = 0; i < 7; i++) {
      const day = addDays(mon, i);
      if (day >= todayKey || day < start || leaveDays.has(day)) continue;
      const d = byDay.get(day);
      if (d) n += loopsFor(d, s);
    }
    return n - (s.loopsSpent?.[mon] ?? 0);
  };
  const firstMonday = weekStart(start);
  const firstWeek = monday === firstMonday;
  let loops = weekLoops(monday);
  if (monday === addDays(firstMonday, 7)) {
    const w1 = weekLoops(firstMonday);
    if (w1 > 0 && w1 < LETTER_COST) loops += w1;
  }
  loops = Math.max(0, loops);
  const clearsInDays = Math.round((at(addDays(monday, 7)) - at(todayKey)) / DAY);

  const month = monthOf(todayKey);
  // A bunk with a leave left uses one of the month's free leaves ("Retroactive leave letter filed").
  const freeUsed = leaves.filter((l) => l.paidWith === 'free' && monthOf(l.day) === month).length + (s.bunks ?? []).filter((b) => b.how === 'leave' && monthOf(b.day) === month).length;
  const bookings = leaves.filter((l) => l.day >= todayKey).sort((a, b) => a.day.localeCompare(b.day));

  // Streak savers: 1 per 30 days of best all-apps streak (Free), plus 1 a month for Premium.
  const usedFree = (s.savedDays ?? []).filter((x) => !x.premium).length;
  const premiumUsedThisMonth = (s.savedDays ?? []).some((x) => x.premium && monthOf(x.day) === month);
  const savers = { free: Math.max(0, Math.floor(best / 30) - usedFree), premium: s.premium && !premiumUsedThisMonth ? 1 : 0 };
  const canSave = lastBreak && lastBreak === addDays(todayKey, -1) && savers.free + savers.premium > 0 ? lastBreak : null;
  const weekLoopsList = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    const d = byDay.get(day);
    return day >= todayKey || day < start || leaveDays.has(day) || !d ? null : loopsFor(d, s);
  });
  const yKey = addDays(todayKey, -1);
  const yDay = byDay.get(yKey);
  const yesterdayLoops = yDay && yKey >= start && !leaveDays.has(yKey) ? loopsFor(yDay, s) : 0;
  let brokeBy: Attendance['brokeBy'] = null;
  if (canSave) {
    const d = byDay.get(canSave);
    for (const a of s.tracked) {
      const over = Math.round((d?.apps[a.packageName] ?? 0) - limitOn(a, s, new Date(at(canSave))));
      if (over > 0 && (!brokeBy || over > brokeBy.overMin)) brokeBy = { label: a.label, overMin: over };
    }
  }

  return {
    ready: true,
    streak,
    best,
    atRisk,
    onLeaveToday,
    week,
    perApp,
    loops,
    firstWeek,
    clearsInDays,
    freeLeavesLeft: Math.max(0, FREE_LEAVES_A_MONTH - freeUsed),
    bookings,
    savers,
    canSave,
    brokeBy,
    yesterdayLoops,
    weekLoops: weekLoopsList,
  };
}

const EMPTY: Attendance = {
  ready: false,
  streak: 0,
  best: 0,
  atRisk: false,
  onLeaveToday: false,
  week: [],
  perApp: {},
  loops: 0,
  firstWeek: true,
  clearsInDays: 7,
  freeLeavesLeft: FREE_LEAVES_A_MONTH,
  bookings: [],
  savers: { free: 0, premium: 0 },
  canSave: null,
  brokeBy: null,
  yesterdayLoops: 0,
  weekLoops: [],
};

/** Live Attendance for the current settings; refreshes on focus and whenever the app comes back. */
export function useAttendance(): Attendance {
  const focused = useIsFocused();
  const s = useSettings();
  const [data, setData] = useState<{ history: HistoryDay[]; today: TodayUsage } | null>(null);
  const pkgs = s.tracked.map((a) => a.packageName).join(',');

  const load = useCallback(() => {
    const list = pkgs ? pkgs.split(',') : [];
    const work = list.length ? Promise.all([usage.history(60, list), usage.today(list)]) : Promise.resolve([[], {}] as [HistoryDay[], TodayUsage]);
    work.then(([history, today]) => setData({ history, today }));
  }, [pkgs]);

  useEffect(() => {
    if (focused) load();
  }, [focused, load]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => st === 'active' && load());
    return () => sub.remove();
  }, [load]);

  const result = data ? compute(s, data.history, data.today) : EMPTY;
  // Keep the best streak (Streak savers are earned from it) and the old streak field in step.
  const { set, bestStreak, streakDays, loopsNow } = s;
  useEffect(() => {
    if (!result.ready) return;
    if (result.best > (bestStreak ?? 0) || result.streak !== streakDays) set({ bestStreak: Math.max(result.best, bestStreak ?? 0), streakDays: result.streak });
  }, [result.ready, result.best, result.streak, bestStreak, streakDays, set]);
  // Hand this week's Loops to the watcher for the Saturday reminder and the Sunday last call.
  const carry = result.firstWeek && result.loops < LETTER_COST;
  useEffect(() => {
    if (!result.ready) return;
    const week = weekStart(dayOf(Date.now()));
    if (loopsNow?.count !== result.loops || loopsNow.week !== week || loopsNow.carry !== carry) set({ loopsNow: { count: result.loops, week, carry } });
  }, [result.ready, result.loops, carry, loopsNow, set]);
  return result;
}

/** A leave counts 1 toward the weekly and monthly caps; a half day counts ½. */
const units = (l: LeaveBooking) => (l.half ? 0.5 : 1);

/** Can a Leave Letter be written now, and for which days? `half` = a Premium half-day letter. */
export function letterRules(s: S, a: Attendance, half = false, now = Date.now()) {
  const todayKey = dayOf(now);
  const dow = new Date(now).getDay();
  const weekend = dow === 0 || dow === 6;
  const open = weekend || __DEV__; // dev builds open every day so it can be tested
  const horizon = s.premium ? 30 : 7;
  const leaves = s.leaves ?? [];
  const want = half ? 0.5 : 1;
  const sum = (list: LeaveBooking[]) => list.reduce((n, l) => n + units(l), 0);
  const days = Array.from({ length: horizon }, (_, i) => addDays(todayKey, i + 1)).map((day) => {
    const taken = leaves.some((l) => l.day === day);
    const weekFull = sum(leaves.filter((l) => weekStart(l.day) === weekStart(day))) + want > 1;
    const monthFull = sum(leaves.filter((l) => monthOf(l.day) === monthOf(day))) + want > MAX_LEAVES_A_MONTH;
    return { day, ok: !taken && !weekFull && !monthFull, why: taken ? 'Booked' : weekFull ? 'One a week' : monthFull ? '4 a month' : '' };
  });
  // Free leaves are whole days; a half day is always paid in Loops.
  const cost = half ? HALF_COST : LETTER_COST;
  const pay: 'loops' | 'free' | null = a.loops >= cost ? 'loops' : !half && a.freeLeavesLeft > 0 ? 'free' : null;
  return { open, weekendOnly: !weekend && __DEV__, days, pay, cost };
}

/** Book a leave; Loops are charged to this week. */
export function bookLeave(day: string, reason: string, paidWith: 'loops' | 'free', half = false) {
  const s = useSettings.getState();
  const mon = weekStart(dayOf(Date.now()));
  const cost = half ? HALF_COST : LETTER_COST;
  s.set({
    leaves: [...(s.leaves ?? []), { day, reason, paidWith, bookedOn: dayOf(Date.now()), ...(half ? { half: true } : {}) }],
    ...(paidWith === 'loops' ? { loopsSpent: { ...(s.loopsSpent ?? {}), [mon]: (s.loopsSpent?.[mon] ?? 0) + cost } } : {}),
  });
}

/** Cancel before the day: the leave (and its Loops, if that week is still running) come back. */
export function cancelLeave(day: string) {
  const s = useSettings.getState();
  const l = (s.leaves ?? []).find((x) => x.day === day);
  if (!l) return;
  const mon = weekStart(l.bookedOn);
  s.set({
    leaves: (s.leaves ?? []).filter((x) => x.day !== day),
    ...(l.paidWith === 'loops' ? { loopsSpent: { ...(s.loopsSpent ?? {}), [mon]: Math.max(0, (s.loopsSpent?.[mon] ?? 0) - (l.half ? HALF_COST : LETTER_COST)) } } : {}),
  });
}

/** Spend a Streak saver on a broken day (the Premium monthly one first). */
export function spendSaver(day: string, a: Attendance) {
  const s = useSettings.getState();
  s.set({ savedDays: [...(s.savedDays ?? []), { day, premium: a.savers.premium > 0 }] });
}

/** "Sun 26 Oct" (or "20 Oct" without the weekday). */
export function fmtDay(day: string | undefined, weekday: boolean): string {
  if (!day) return '';
  const d = new Date(`${day}T00:00:00`);
  const md = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return weekday ? `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${md}` : md;
}
