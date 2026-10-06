import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { Wordmark } from '@/brand/logo';
import { pose, roasterName, type Pose, type Roaster } from '@/characters';
import { AppTile, Character, T } from '@/components/ui';
import { PremiumSheet } from '@/components/premium-sheet';
import { usage, type HistoryDay } from '@/data/usage';
import { fmt } from '@/lib/time';
import { localDay, useSettings, type TrackedApp } from '@/store/settings';
import { colors, fonts, gradients, radius } from '@/theme/tokens';

const DAY = 86_400_000;
const HISTORY_DAYS = 21; // this week, last week, and the 21-day challenge

/** Screen 12 · Stats: is Endloop actually helping? */
export default function Stats() {
  const { tracked, roaster, startedAt, baselineDailyMin, set } = useSettings();
  const [days, setDays] = useState<HistoryDay[] | null>(null);
  const [premium, setPremium] = useState<null | 'stats' | 'archive'>(null);

  useEffect(() => {
    if (!startedAt) set({ startedAt: localDay() }); // installs from before this screen
    const load = () => usage.history(HISTORY_DAYS, tracked.map((a) => a.packageName)).then(setDays).catch(() => setDays([]));
    load();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && load());
    return () => sub.remove();
  }, [tracked, startedAt, set]);

  // Installs from before the baseline was saved: the averages picked in onboarding are the same thing.
  const pickedAvg = tracked.reduce((s, a) => s + a.avgDailyMin, 0);
  const baseline = baselineDailyMin ?? (pickedAvg > 0 ? pickedAvg : undefined);
  const m = days ? metrics(days, tracked, startedAt ?? localDay(), baseline) : null;

  // No baseline from onboarding (Usage Access was skipped): the first full week becomes it.
  const sinceStart = m?.sinceStart ?? 0;
  const firstWeekAvg = m?.firstWeekAvg ?? 0;
  useEffect(() => {
    if (baseline == null && sinceStart >= 7 && firstWeekAvg > 0) set({ baselineDailyMin: firstWeekAvg });
  }, [sinceStart, firstWeekAvg, baseline, set]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={st.header}>
        <Wordmark width={100} />
        <View accessibilityRole="radiogroup" style={st.segment}>
          <View accessibilityRole="radio" accessibilityState={{ checked: true }} style={[st.segBtn, st.segOn]}>
            <T v="bodyBold" style={{ fontSize: 14 }}>Week</T>
          </View>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: false }} accessibilityHint="Premium" onPress={() => setPremium('stats')} style={st.segBtn}>
            <T v="bodyBold" style={{ fontSize: 14, color: colors.muted }}>Month</T>
            <LockIcon />
          </Pressable>
        </View>
      </View>

      {!m ? null : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 12, paddingBottom: 36, gap: 20 }}>
          <T v="display" accessibilityRole="header">Your week</T>
          <Hero m={m} roaster={roaster} />
          <DailyChart m={m} />
          <View style={st.tiles}>
            <Tile value={`${m.underDays}/${m.weekDays}`} label="days under all limits" color={m.underDays >= m.weekDays / 2 ? colors.chill : colors.red} />
            <Tile value={String(m.wins)} label="closed on the first roast" color={colors.chill} />
            <Tile value={String(m.snoozes)} label="snoozes used" color={colors.heads} />
            <Tile value={String(m.roasts)} label="roasts received" color={colors.red} />
          </View>
          <PerApp m={m} tracked={tracked} />
          <Challenge day={m.challengeDay} under={m.challengeUnder} roaster={roaster} />
          <WeeklyCta roaster={roaster} onPress={() => router.push('/weekly')} />
          <Pressable accessibilityRole="button" onPress={() => setPremium('archive')} style={st.archive}>
            <T v="bodyBold">Past weekly roasts</T>
            <View style={st.premiumTag}>
              <LockIcon color={colors.red} />
              <T v="bodyBold" style={{ fontSize: 12, color: colors.red }}>Premium</T>
            </View>
          </Pressable>
        </ScrollView>
      )}

      <PremiumSheet visible={premium !== null} onClose={() => setPremium(null)} roaster={roaster} reason={premium ?? 'stats'} />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

type Metrics = ReturnType<typeof metrics>;

function metrics(days: HistoryDay[], tracked: TrackedApp[], startedAt: string, baseline: number | undefined) {
  const start = new Date(`${startedAt}T00:00:00`).getTime();
  const sinceStart = Math.max(0, Math.floor((Date.now() - start) / DAY)); // 0 on day 1
  const total = (d: HistoryDay) => tracked.reduce((s, a) => s + (d.apps[a.packageName] ?? 0), 0);
  const underAll = (d: HistoryDay) => tracked.every((a) => (d.apps[a.packageName] ?? 0) <= a.limitMin);

  const week = days.slice(-7);
  const lastWeek = days.slice(-14, -7);
  const counted = week.filter((d) => d.day >= start); // only days with Endloop running
  const weekTotal = counted.reduce((s, d) => s + total(d), 0);
  const firstWeek = days.filter((d) => d.day >= start && d.day < start + 7 * DAY);
  const firstWeekAvg = firstWeek.length >= 7 ? Math.round(firstWeek.reduce((s, d) => s + total(d), 0) / 7) : 0;
  const base = baseline ?? null;

  const perApp = tracked.map((a) => {
    const now = week.reduce((s, d) => s + (d.apps[a.packageName] ?? 0), 0);
    const before = lastWeek.reduce((s, d) => s + (d.apps[a.packageName] ?? 0), 0);
    return { app: a, now, change: before > 0 ? Math.round(((now - before) / before) * 100) : null };
  });

  const sinceStartDays = days.filter((d) => d.day >= start);
  return {
    week: week.map((d) => ({ day: d.day, minutes: total(d), counted: d.day >= start })),
    base,
    sinceStart,
    firstWeekAvg,
    wonBack: base != null ? base * counted.length - weekTotal : null,
    countedDays: counted.length,
    weekDays: counted.length,
    underDays: counted.filter(underAll).length,
    wins: counted.reduce((s, d) => s + d.wins, 0),
    snoozes: counted.reduce((s, d) => s + d.snoozes, 0),
    roasts: counted.reduce((s, d) => s + d.roasts, 0),
    perApp,
    challengeDay: Math.min(21, sinceStart + 1),
    challengeUnder: sinceStartDays.filter(underAll).length,
  };
}

function Hero({ m, roaster }: { m: Metrics; roaster: 'loop' | 'lupe' }) {
  let label: string, value: string, sub: string, color: string, tint: string, face: Pose, line: string;
  if (m.base == null) {
    label = 'Building your baseline';
    value = `Day ${Math.min(7, m.sinceStart + 1)} of 7`;
    sub = 'Then I can tell you how much time you won back.';
    color = colors.heads;
    tint = colors.headsTint;
    face = 'notes';
    line = 'Taking notes. So many notes.';
  } else if ((m.wonBack ?? 0) >= 0) {
    const won = m.wonBack ?? 0;
    label = 'Time won back';
    value = fmt(won);
    sub = `vs your ${fmt(m.base)} a day before Endloop`;
    color = colors.chill;
    tint = colors.chillTint;
    face = 'flex';
    line = won >= 150 ? 'Look at that. Almost an entire movie, back.' : won >= 30 ? 'Real hours, back in your life. Keep going.' : 'Small win. Still a win.';
  } else {
    label = 'Time lost';
    value = fmt(-(m.wonBack ?? 0));
    sub = 'more than before Endloop. Impressive, in the wrong way.';
    color = colors.red;
    tint = colors.blush;
    face = 'headInHands';
    line = `I roasted you ${m.roasts} times. You roasted me back by ignoring it.`;
  }
  return (
    <LinearGradient colors={[tint, deeper(tint)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
      <View style={st.heroChar} pointerEvents="none">
        <Character source={pose(roaster, face)} size={240} alt={`${roasterName[roaster]}: ${line}`} />
      </View>
      <View style={{ width: '54%', gap: 10 }}>
        <View style={st.pill}>
          <View style={[st.dot, { backgroundColor: color }]} />
          <T v="bodyBold" style={{ fontSize: 12, color }} numberOfLines={1}>{label}</T>
        </View>
        <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontFamily: fonts.display, fontSize: 38, lineHeight: 42, color: colors.ink }}>{value}</T>
        <T v="caption" style={{ fontSize: 13, color: colors.ink, opacity: 0.7 }}>{sub}</T>
      </View>
      <T v="bodyBold" style={{ width: '54%', fontSize: 17, lineHeight: 23, paddingTop: 14 }}>{line}</T>
    </LinearGradient>
  );
}

/** A slightly deeper shade of the tint, for the hero gradient. */
function deeper(tint: string): string {
  const map: Record<string, string> = { [colors.blush]: '#FFC9D0', [colors.headsTint]: '#FFDDA8', [colors.chillTint]: '#C4E8D7' };
  return map[tint] ?? tint;
}

const BAR_H = 150;

function DailyChart({ m }: { m: Metrics }) {
  const ref = m.base ?? 0;
  const top = Math.max(ref, ...m.week.map((d) => d.minutes), 1) * 1.12;
  const lineY = BAR_H - (ref / top) * BAR_H;
  return (
    <View style={st.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T v="bodyBold" style={{ fontSize: 17 }}>Per day</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Legend color={colors.chill} text="Under" />
          <Legend color={colors.red} text="Over" />
        </View>
      </View>
      {ref > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={st.dash} />
          <T v="caption" style={{ fontSize: 12 }}>Before Endloop · {fmt(ref)} a day</T>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 4, paddingTop: 18 }}>
        {ref > 0 ? <View pointerEvents="none" style={[st.baseLine, { top: 18 + lineY }]} /> : null}
        {m.week.map((d, i) => {
          const isToday = i === m.week.length - 1;
          const col = !d.counted ? colors.line : ref > 0 && d.minutes > ref ? colors.red : colors.chill;
          const label = isToday ? 'Today' : new Date(d.day).toLocaleDateString('en-IN', { weekday: 'short' });
          return (
            <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 6 }} accessible accessibilityLabel={`${label}: ${fmt(d.minutes)}`}>
              <View style={{ height: BAR_H, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                <View style={{ width: 26, height: Math.max(4, (d.minutes / top) * BAR_H), borderRadius: 8, backgroundColor: col, opacity: isToday || !d.counted ? 1 : 0.85 }} />
              </View>
              <T v="caption" style={{ fontSize: 12, color: isToday ? colors.ink : colors.muted, fontFamily: isToday ? fonts.bold : fonts.medium }}>{label}</T>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Tile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={st.tile}>
      <View style={[st.tileBar, { backgroundColor: color }]} />
      <T style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.ink }}>{value}</T>
      <T v="caption" style={{ fontSize: 13 }}>{label}</T>
    </View>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <T v="caption" style={{ fontSize: 12 }}>{text}</T>
    </View>
  );
}

function PerApp({ m, tracked }: { m: Metrics; tracked: TrackedApp[] }) {
  if (!tracked.length) return null;
  return (
    <View style={st.card}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <T v="bodyBold" style={{ fontSize: 17 }}>Per app</T>
        <T v="caption" style={{ fontSize: 12 }}>vs last week</T>
      </View>
      {m.perApp.map(({ app, now, change }, i) => {
        const down = change != null && change < 0;
        const up = change != null && change > 5;
        const badge = change == null ? { bg: colors.surface, fg: colors.muted, text: 'New' } : down ? { bg: colors.chillTint, fg: colors.chill, text: `↓ ${Math.abs(change)}%` } : { bg: colors.blush, fg: colors.red, text: `↑ ${Math.abs(change)}%` };
        return (
          <View key={app.packageName} style={[st.appRow, i === 0 && { borderTopWidth: 0, paddingTop: 4 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppTile label={app.label} color={app.color} iconUri={app.iconUri} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="bodyBold">{app.label}</T>
                <T v="caption">{fmt(now)} this week</T>
              </View>
              <View style={[st.badge, { backgroundColor: badge.bg }]}>
                <T v="bodyBold" style={{ fontSize: 13, color: badge.fg }}>{badge.text}</T>
              </View>
            </View>
            {up ? <T v="caption" style={{ paddingLeft: 52 }}>{app.label} went up. I noticed. Everyone noticed.</T> : null}
          </View>
        );
      })}
    </View>
  );
}

/** Describes the studies; never promises a result. */
function Challenge({ day, under, roaster }: { day: number; under: number; roaster: Roaster }) {
  return (
    <View style={st.challenge}>
      <View style={st.challengeChar} pointerEvents="none">
        <Character source={pose(roaster, 'knuckles')} size={150} alt="" />
      </View>
      <View style={{ width: '62%', gap: 8 }}>
        <T v="label" style={{ fontSize: 11, color: '#FFB38A' }}>21-day challenge</T>
        <T style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 33, color: colors.white }}>Day {day}</T>
        <T v="bodyBold" style={{ fontSize: 15, lineHeight: 20, color: colors.white }}>
          {day >= 21 ? 'Three weeks. The same length as the studies.' : 'The studies ran for 3 weeks. Keep going.'}
        </T>
      </View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 21, now: day }} style={st.progress}>
        <View style={{ width: `${(day / 21) * 100}%`, height: 10, borderRadius: 5, backgroundColor: '#FFB38A' }} />
      </View>
      <T v="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {under} of {day} days under every limit so far. In one study, people who kept limits for 3 weeks felt less lonely and less low.
      </T>
    </View>
  );
}

/** This week's roast: a red card, not a plain link. */
function WeeklyCta({ roaster, onPress }: { roaster: Roaster; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Open this week's roast" onPress={onPress} style={({ pressed }) => [{ borderRadius: 24, overflow: 'hidden' }, pressed && { opacity: 0.9 }]}>
      <LinearGradient colors={gradients.roasted} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.weekly}>
        <View style={{ flex: 1, gap: 6, paddingVertical: 20, paddingLeft: 20 }}>
          <T v="label" style={{ fontSize: 11, color: '#FFD3D8' }}>Weekly roast</T>
          <T style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 27, color: colors.white }}>This week, in one roast</T>
          <View style={st.weeklyBtn}>
            <T v="bodyBold" style={{ fontSize: 14, color: colors.red }}>Open it →</T>
          </View>
        </View>
        <Character source={pose(roaster, 'envelope')} size={150} alt="" />
      </LinearGradient>
    </Pressable>
  );
}

function LockIcon({ color = colors.muted }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={5} y={11} width={14} height={10} rx={2} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 },
  segment: { width: 170, flexDirection: 'row', gap: 2, padding: 3, borderRadius: 12, backgroundColor: colors.surface },
  segBtn: { flex: 1, height: 34, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  segOn: { backgroundColor: colors.white, elevation: 1 },
  hero: { minHeight: 280, padding: 20, borderRadius: 28, overflow: 'hidden', justifyContent: 'space-between' },
  heroChar: { position: 'absolute', right: -54, bottom: 0 },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.white, maxWidth: '100%' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  card: { gap: 12, padding: 18, borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  baseLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.ink, opacity: 0.35, zIndex: 1 },
  dash: { width: 18, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.ink, opacity: 0.4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48.4%', gap: 4, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface },
  tileBar: { width: 24, height: 4, borderRadius: 2, marginBottom: 6 },
  appRow: { gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  badge: { minWidth: 58, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  challenge: { gap: 12, padding: 20, borderRadius: 24, backgroundColor: colors.ink, overflow: 'hidden' },
  challengeChar: { position: 'absolute', right: -30, top: 0 },
  weekly: { flexDirection: 'row', alignItems: 'flex-end' },
  weeklyBtn: { alignSelf: 'flex-start', marginTop: 8, height: 38, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.white, justifyContent: 'center' },
  progress: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 4 },
  archive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  premiumTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.blush },
});
