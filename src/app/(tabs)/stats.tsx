import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

import { Wordmark } from '@/brand/logo';
import { pose, roasterName, type Roaster } from '@/characters';
import { StarIcon } from '@/components/icons';
import { PremiumSheet } from '@/components/premium-sheet';
import { AppTile, Avatar, Character, T } from '@/components/ui';
import { usage, type HistoryDay } from '@/data/usage';
import { dayTotal, mondayOf, monthReport, normalDay, PARTS, topExcuse, WEAK_LINE, weakestPart } from '@/lib/report';
import { fmt } from '@/lib/time';
import { weeklyReport } from '@/lib/weekly';
import { limitOn, localDay, useSettings, type TrackedApp } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

const DAY = 86_400_000;
const HISTORY_DAYS = 62; // this month, last month, and four past weeks

/** Report Card (canvas Screen 19; formerly Stats): time only. Streaks and Loops live in Attendance. */
export default function ReportCard() {
  const s = useSettings();
  const { tracked, roaster, startedAt, baselineDailyMin, premium, set } = s;
  const [days, setDays] = useState<HistoryDay[] | null>(null);
  const [parts, setParts] = useState<[number, number, number, number][]>([]);
  const [view, setView] = useState<'week' | 'month'>('week');
  const [now, setNow] = useState(() => Date.now());
  const [sheet, setSheet] = useState<null | 'stats' | 'worst-hour'>(null);

  useEffect(() => {
    if (!startedAt) set({ startedAt: localDay() }); // installs from before this screen
    const pkgs = tracked.map((a) => a.packageName);
    const load = () => {
      setNow(Date.now());
      usage.history(HISTORY_DAYS, pkgs).then(setDays).catch(() => setDays([]));
      if (premium) Promise.all(pkgs.map((p) => usage.detail(p).then((d) => d.parts).catch(() => [0, 0, 0, 0] as [number, number, number, number]))).then(setParts);
    };
    load();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && load());
    return () => sub.remove();
  }, [tracked, startedAt, premium, set]);

  const normal = normalDay(tracked, baselineDailyMin);
  const start = new Date(`${startedAt ?? localDay()}T00:00:00`).getTime();
  const sinceStart = Math.max(0, Math.floor((now - start) / DAY));

  // No baseline at all (Usage Access was skipped in onboarding): the first full week becomes it.
  const firstWeek = days ? days.filter((d) => d.day >= start && d.day < start + 7 * DAY) : [];
  const firstWeekAvg = firstWeek.length >= 7 ? Math.round(firstWeek.reduce((n, d) => n + dayTotal(d, tracked), 0) / 7) : 0;
  useEffect(() => {
    if (normal == null && firstWeekAvg > 0) set({ baselineDailyMin: firstWeekAvg });
  }, [normal, firstWeekAvg, set]);

  const month = view === 'month' && premium;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={st.header}>
        <Wordmark width={96} />
        <View accessibilityRole="radiogroup" style={st.segment}>
          {(['week', 'month'] as const).map((v) => {
            const on = v === 'week' ? !month : month;
            return (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityHint={v === 'month' && !premium ? 'Premium' : undefined}
                onPress={() => (v === 'month' && !premium ? setSheet('stats') : setView(v))}
                style={[st.segBtn, on && st.segOn]}>
                <T v="bodyBold" style={{ fontSize: 14, color: on ? colors.ink : colors.muted }}>{v === 'week' ? 'Week' : 'Month'}</T>
                {v === 'month' && !premium ? <Lock /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {!days ? null : normal == null ? (
        <FirstWeek days={days} tracked={tracked} start={start} sinceStart={sinceStart} roaster={roaster} />
      ) : month ? (
        <Month days={days} tracked={tracked} start={start} normal={normal} parts={parts} roaster={roaster} />
      ) : (
        <Week days={days} tracked={tracked} start={start} normal={normal} parts={parts} premium={premium} now={now} onLocked={() => setSheet('worst-hour')} />
      )}

      <PremiumSheet visible={sheet !== null} onClose={() => setSheet(null)} roaster={roaster} reason={sheet ?? 'stats'} />
    </SafeAreaView>
  );
}

/* ---------------------------------------------------------------- week */

function Week({ days, tracked, start, normal, parts, premium, now, onLocked }: { days: HistoryDay[]; tracked: TrackedApp[]; start: number; normal: number; parts: [number, number, number, number][]; premium: boolean; now: number; onLocked: () => void }) {
  const s = useSettings();
  const week = days.slice(-7);
  const counted = week.filter((d) => d.day >= start);
  const total = counted.reduce((n, d) => n + dayTotal(d, tracked), 0);
  const wonBack = Math.round(normal * counted.length - total);
  const report = weeklyReport(days.slice(-14), tracked, s.startedAt ?? localDay(), normal, { lang: s.roastLang, intensity: s.intensity, roaster: s.roaster });
  const perApp = tracked.map((a) => {
    const now = counted.reduce((n, d) => n + (d.apps[a.packageName] ?? 0), 0);
    const usual = a.avgDailyMin * counted.length;
    return { app: a, now, change: usual > 0 ? Math.round(((now - usual) / usual) * 100) : null };
  });
  const switched = perApp.some((p) => (p.change ?? 0) <= -10) && perApp.some((p) => (p.change ?? 0) >= 5);
  const excuse = topExcuse(mondayOf(now));
  const wins = counted.reduce((n, d) => n + d.wins, 0);
  const snoozes = counted.reduce((n, d) => n + d.snoozes, 0);
  const good = wonBack >= 0;
  const movies = Math.floor(Math.max(0, wonBack) / 120);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 14, paddingBottom: 120, gap: 16 }}>
      <View style={[st.hero, { backgroundColor: good ? '#E3F3EC' : colors.blush }]}>
        <T v="label" style={{ fontSize: 11, color: good ? colors.chill : colors.red }}>{good ? 'Time won back this week' : 'Time lost this week'}</T>
        <T style={{ fontFamily: fonts.display, fontSize: 46, lineHeight: 50, color: colors.ink }}>{fmt(Math.abs(wonBack))}</T>
        <T v="caption" style={{ fontSize: 13 }}>
          vs your normal week{good && movies > 0 ? ` · that's ${movies} ${movies === 1 ? 'movie' : 'movies'}` : good ? '' : ' · more than before Endloop'}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Avatar source={pose(s.roaster, good ? 'popcorn' : 'headShake')} size={38} bg={colors.white} />
          <T v="bodyBold" style={{ flex: 1, fontSize: 14, lineHeight: 19, color: colors.ink }}>{report.roast}</T>
        </View>
      </View>

      <Bars week={week} start={start} tracked={tracked} normal={normal} />

      <View style={{ gap: 8 }}>
        <T v="label" style={{ fontSize: 11 }}>Per app · vs your normal</T>
        {perApp.map(({ app, now, change }) => (
          <View key={app.packageName} style={st.appRow}>
            <AppTile label={app.label} color={app.color} iconUri={app.iconUri} size={34} />
            <T v="bodyBold" style={{ flex: 1, fontSize: 15 }}>{app.label}</T>
            <T v="bodyBold" style={{ fontSize: 15 }}>{fmt(now)}</T>
            <T v="bodyBold" style={{ width: 56, textAlign: 'right', fontSize: 13, color: change == null ? colors.muted : change <= 0 ? colors.chill : colors.red }}>
              {change == null ? 'New' : `${change <= 0 ? '↓' : '↑'} ${Math.abs(change)}%`}
            </T>
          </View>
        ))}
        {switched ? <T v="caption" style={{ fontSize: 13 }}>You didn&apos;t quit scrolling. You changed apps.</T> : null}
      </View>

      {excuse ? (
        <View style={st.excuse}>
          <Character source={pose(s.roaster, 'airQuotes')} size={110} alt={`${roasterName[s.roaster]}, doing air quotes`} />
          <View style={{ flex: 1, gap: 4 }}>
            <T v="label" style={{ fontSize: 11, color: colors.red }}>Most used excuse</T>
            <T style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.ink }}>
              “{excuse.reason}” {excuse.count} {excuse.count === 1 ? 'time' : 'times'}.{excuse.count > 2 ? ' That’s a pattern.' : ''}
            </T>
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Tile value={wins} label="closed on the first roast" color={colors.chill} />
        <Tile value={snoozes} label="snoozes used" color={colors.heads} />
      </View>

      <WeakestHour parts={parts} premium={premium} onLocked={onLocked} roaster={s.roaster} />

      <Pressable accessibilityRole="button" onPress={() => router.push('/weekly')} style={st.weeklyCta}>
        <Avatar source={pose(s.roaster, 'envelope')} size={44} bg="#3A1C20" />
        <View style={{ flex: 1 }}>
          <T v="label" style={{ fontSize: 11, color: '#FFD3D8' }}>Weekly roast</T>
          <T v="bodyBold" style={{ fontSize: 15, color: colors.white }}>This week, in one roast →</T>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const BAR_H = 120;
function Bars({ week, start, tracked, normal }: { week: HistoryDay[]; start: number; tracked: TrackedApp[]; normal: number }) {
  const s = useSettings();
  const totals = week.map((d) => ({ day: d.day, m: dayTotal(d, tracked), counted: d.day >= start, under: tracked.every((a) => (d.apps[a.packageName] ?? 0) <= limitOn(a, s, new Date(d.day))) }));
  const top = Math.max(normal, ...totals.map((t) => t.m), 1) * 1.1;
  const worst = totals.filter((t) => t.counted).reduce((m, t) => (t.m > (m?.m ?? -1) ? t : m), null as (typeof totals)[number] | null);
  return (
    <View style={{ gap: 6 }}>
      <T v="label" style={{ fontSize: 11 }}>Tracked apps per day</T>
      <T v="caption" style={{ fontSize: 12 }}>Your normal · {fmt(normal)}</T>
      <View style={{ height: BAR_H + 22, flexDirection: 'row', gap: 8, paddingTop: 6 }}>
        <View pointerEvents="none" style={[st.normalLine, { top: 6 + BAR_H - (normal / top) * BAR_H }]} />
        {totals.map((t, i) => {
          const today = i === totals.length - 1;
          const isWorst = worst?.day === t.day && t.m > normal;
          const col = !t.counted ? colors.line : t.m > normal ? colors.red : colors.chill;
          const label = today ? 'Today' : new Date(t.day).toLocaleDateString('en-GB', { weekday: 'short' });
          return (
            <View key={t.day} style={{ flex: 1, alignItems: 'center', gap: 4 }} accessible accessibilityLabel={`${label}: ${fmt(t.m)}`}>
              <View style={{ height: BAR_H, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                <View style={{ width: 22, height: Math.max(4, (t.m / top) * BAR_H), borderRadius: 6, backgroundColor: col }} />
              </View>
              <T v="caption" style={{ fontSize: 11, color: isWorst ? colors.red : today ? colors.ink : colors.muted, fontFamily: isWorst || today ? fonts.bold : fonts.medium }}>{label}</T>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function WeakestHour({ parts, premium, onLocked, roaster }: { parts: [number, number, number, number][]; premium: boolean; onLocked: () => void; roaster: Roaster }) {
  const w = weakestPart(parts);
  if (!premium) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Your weakest hour, Premium" onPress={onLocked} style={st.weak}>
        <View style={{ flex: 1, gap: 6 }}>
          <T v="label" style={{ fontSize: 11, color: '#FFB38A' }}>Your weakest hour</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <T v="bodyBold" style={{ fontSize: 15, color: colors.white }}>You crack every night at</T>
            <View style={{ width: 56, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.35)' }} />
          </View>
        </View>
        <View style={st.premiumPill}>
          <StarIcon size={11} />
          <T v="bodyBold" style={{ fontSize: 12, color: colors.red }}>Premium</T>
        </View>
      </Pressable>
    );
  }
  return (
    <View style={[st.weak, { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
      <T v="label" style={{ fontSize: 11, color: '#FFB38A' }}>Your weakest hour</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar source={pose(roaster, 'magnifier')} size={48} bg="#3A1C20" />
        <T style={{ flex: 1, fontFamily: fonts.display, fontSize: 18, lineHeight: 23, color: colors.white }}>{w.worst ? WEAK_LINE[w.worst.key] : 'Not enough data yet. Give me a few days.'}</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 3, height: 22 }}>
        {PARTS.map((p, i) => (
          <View key={p.key} style={{ flex: p.hours, borderRadius: 6, backgroundColor: w.max > 0 ? `rgba(229,19,43,${0.2 + 0.8 * (w.perHour[i] / w.max)})` : 'rgba(255,255,255,0.12)' }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {PARTS.map((p) => (
          <T key={p.key} v="caption" style={{ flex: p.hours, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{p.label}</T>
        ))}
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- month (Premium) */

function Month({ days, tracked, start, normal, parts, roaster }: { days: HistoryDay[]; tracked: TrackedApp[]; start: number; normal: number; parts: [number, number, number, number][]; roaster: Roaster }) {
  const m = monthReport(days, tracked, start, normal);
  const won = m.wonBack ?? 0;
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 14, paddingBottom: 120, gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[st.monthTile, { backgroundColor: won >= 0 ? '#E3F3EC' : colors.blush, flex: 1.3 }]}>
          <T style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: colors.ink }}>{fmt(Math.abs(won))}</T>
          <T v="bodyBold" style={{ fontSize: 12, color: won >= 0 ? colors.chill : colors.red }}>{won >= 0 ? `won back in ${m.monthName}` : `lost in ${m.monthName}`}</T>
        </View>
        <View style={[st.monthTile, { borderWidth: 1, borderColor: colors.line }]}>
          <T style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: m.change == null ? colors.muted : m.change <= 0 ? colors.chill : colors.red }}>
            {m.change == null ? '—' : `${m.change <= 0 ? '↓' : '↑'} ${Math.abs(m.change)}%`}
          </T>
          <T v="caption" style={{ fontSize: 12 }}>vs {m.lastMonthName}</T>
        </View>
      </View>

      <Trend trend={m.trend} normal={normal} />
      <WeakestHour parts={parts} premium onLocked={() => {}} roaster={roaster} />

      {m.worstDow && m.bestDow ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[st.monthTile, { borderWidth: 1, borderColor: colors.line }]}>
            <T style={{ fontFamily: fonts.display, fontSize: 20, color: colors.red }}>{m.worstDow}</T>
            <T v="caption" style={{ fontSize: 12 }}>your worst day</T>
          </View>
          <View style={[st.monthTile, { borderWidth: 1, borderColor: colors.line }]}>
            <T style={{ fontFamily: fonts.display, fontSize: 20, color: colors.chill }}>{m.bestDow}</T>
            <T v="caption" style={{ fontSize: 12 }}>your best. Touch grass more.</T>
          </View>
        </View>
      ) : null}

      {m.weeks.length ? (
        <View style={{ gap: 4 }}>
          <T v="label" style={{ fontSize: 11 }}>Past weeks</T>
          {m.weeks.map((w) => {
            const end = new Date(w.from + 6 * DAY);
            const from = new Date(w.from);
            const label = `${from.getDate()}–${end.getDate()} ${end.toLocaleDateString('en-GB', { month: 'short' })}`;
            const v = w.wonBack ?? 0;
            return (
              <View key={w.from} style={st.weekRow}>
                <T v="bodyBold" style={{ flex: 1, fontSize: 15 }}>{label}</T>
                <T v="bodyBold" style={{ fontSize: 14, color: v >= 0 ? colors.chill : colors.red }}>{v >= 0 ? `+${fmt(v)} back` : `−${fmt(-v)} lost`}</T>
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Trend({ trend, normal }: { trend: { day: number; minutes: number | null }[]; normal: number }) {
  const W = 340;
  const H = 110;
  const pts = trend.map((t, i) => ({ x: (i / Math.max(1, trend.length - 1)) * W, m: t.minutes })).filter((p) => p.m != null) as { x: number; m: number }[];
  const top = Math.max(normal, ...pts.map((p) => p.m), 1) * 1.15;
  const y = (m: number) => H - (m / top) * H;
  const last = pts[pts.length - 1];
  return (
    <View style={{ gap: 6 }}>
      <T v="label" style={{ fontSize: 11 }}>30-day trend</T>
      <Svg width="100%" height={H + 8} viewBox={`0 -4 ${W} ${H + 8}`} preserveAspectRatio="none">
        <Line x1={0} x2={W} y1={y(normal)} y2={y(normal)} stroke={colors.ink} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="6 5" />
        {pts.length > 1 ? <Polyline points={pts.map((p) => `${p.x},${y(p.m)}`).join(' ')} fill="none" stroke={colors.chill} strokeWidth={2.5} strokeLinejoin="round" /> : null}
        {last ? <Circle cx={last.x} cy={y(last.m)} r={5} fill={colors.chill} /> : null}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T v="caption" style={{ fontSize: 11 }}>{trend[0] ? new Date(trend[0].day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</T>
        <T v="caption" style={{ fontSize: 11 }}>Your normal · {fmt(normal)}</T>
        <T v="caption" style={{ fontSize: 11 }}>Today</T>
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- first week, no baseline yet (S19-D) */

function FirstWeek({ days, tracked, start, sinceStart, roaster }: { days: HistoryDay[]; tracked: TrackedApp[]; start: number; sinceStart: number; roaster: Roaster }) {
  const left = Math.max(1, 7 - sinceStart);
  const soFar = days.filter((d) => d.day >= start).slice(-7).reduce((n, d) => n + dayTotal(d, tracked), 0);
  const labels = Array.from({ length: 7 }, (_, i) => new Date(start + i * DAY).toLocaleDateString('en-GB', { weekday: 'short' }));
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 120, gap: 14, alignItems: 'center' }}>
      <T style={{ alignSelf: 'flex-start', fontFamily: fonts.display, fontSize: 28, color: colors.ink }}>Report Card</T>
      <Character source={pose(roaster, 'drumroll')} size={210} alt={`${roasterName[roaster]} with a drumroll`} />
      <T style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.ink, textAlign: 'center' }}>
        Your first report card drops in {left} {left === 1 ? 'day' : 'days'}.
      </T>
      <T style={{ fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center' }}>I need one full week to learn your normal. Then every week gets compared to it. Brace yourself.</T>
      <View style={[st.card, { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' }]}>
        {labels.map((l, i) => {
          const done = i < sinceStart;
          return (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <View style={[st.dayDot, done ? { backgroundColor: colors.red } : { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D9CFD0' }]}>
                {done ? (
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path d="M5 12l5 5 9-10" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : (
                  <T v="bodyBold" style={{ fontSize: 12, color: colors.muted }}>{i + 1}</T>
                )}
              </View>
              <T v="caption" style={{ fontSize: 11 }}>{l}</T>
            </View>
          );
        })}
      </View>
      <View style={[st.card, { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.surface, borderWidth: 0 }]}>
        <T v="bodyBold" style={{ flex: 1, fontSize: 14 }}>So far this week</T>
        <T style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>{fmt(soFar)}</T>
      </View>
    </ScrollView>
  );
}

/* ---------------------------------------------------------------- bits */

function Tile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={st.tile}>
      <T style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color }}>{value}</T>
      <T v="caption" style={{ fontSize: 13 }}>{label}</T>
    </View>
  );
}

function Lock({ color = colors.muted }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={5} y={11} width={14} height={10} rx={2} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
  segment: { width: 170, flexDirection: 'row', gap: 2, padding: 3, borderRadius: 12, backgroundColor: colors.surface },
  segBtn: { flex: 1, height: 34, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  segOn: { backgroundColor: colors.white, elevation: 1 },
  hero: { gap: 2, padding: 18, borderRadius: 24 },
  normalLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: colors.ink, opacity: 0.35, zIndex: 1 },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line },
  excuse: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 16, borderRadius: 22, backgroundColor: colors.blush, overflow: 'hidden' },
  tile: { flex: 1, gap: 2, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line },
  weak: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 22, backgroundColor: colors.ink },
  premiumPill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.blush },
  weeklyCta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: '#C20F24' },
  monthTile: { flex: 1, gap: 2, padding: 14, borderRadius: 18 },
  weekRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
  card: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  dayDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
