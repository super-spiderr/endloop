import { EndloopCore } from 'endloop-core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { Wordmark } from '@/brand/logo';
import { pose, roasterName, type Pose } from '@/characters';
import { CloseIcon } from '@/components/icons';
import { RedStatusBar } from '@/components/onboarding-ui';
import { AppTile, Avatar, Button, Character, LinkButton, T } from '@/components/ui';
import { usage, type HistoryDay } from '@/data/usage';
import { LETTER_COST, useAttendance } from '@/lib/attendance';
import { poseDrawable, SHARE_TAGLINE, shareCard } from '@/lib/share-cards';
import { dayTotal, normalDay, topExcuse } from '@/lib/report';
import { fmt } from '@/lib/time';
import { weeklyReport, type WeeklyReport } from '@/lib/weekly';
import { limitOn, localDay, useSettings, type TrackedApp } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

const DAY = 86_400_000;
const W80 = 'rgba(255,255,255,0.82)';

type Card = 'cover' | 'skyline' | 'podium' | 'excuse' | 'receipt' | 'loops' | 'share';

/**
 * Weekly roast v2 (canvas Screen 25): Sunday's story. Tap the right of the screen for the next card,
 * the left to go back. Cover → the week as a skyline → app podium → excuse of the week → time-won-back
 * receipt → Loops last call (Write a Leave Letter) → share.
 */
export default function Weekly() {
  const s = useSettings();
  const { tracked, roaster, roastLang, intensity, startedAt, baselineDailyMin } = s;
  const att = useAttendance();
  const [days, setDays] = useState<HistoryDay[] | null>(null);
  const [i, setI] = useState(0);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    usage
      .history(14, tracked.map((a) => a.packageName))
      .then(setDays)
      .catch(() => setDays([]));
  }, [tracked]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));
  if (!days) return <View style={{ flex: 1, backgroundColor: '#5C0714' }} />;

  const normal = normalDay(tracked, baselineDailyMin);
  const report = weeklyReport(days, tracked, startedAt ?? localDay(), normal ?? undefined, { lang: roastLang, intensity, roaster });
  const excuse = topExcuse(now - 7 * DAY);
  const cards: Card[] = ['cover', 'skyline', 'podium', ...(excuse ? (['excuse'] as const) : []), ...(normal != null ? (['receipt'] as const) : []), 'loops', 'share'];
  const card = cards[Math.min(i, cards.length - 1)];
  const story = cards.length - 1; // the share step has no progress bar
  const next = () => setI((n) => Math.min(cards.length - 1, n + 1));
  const back = () => setI((n) => Math.max(0, n - 1));
  const who = roasterName[roaster];

  if (card === 'share') return <Share report={report} days={days} tracked={tracked} onClose={close} onBack={back} />;

  const dark = card === 'skyline' || card === 'loops';
  const light = card === 'podium' || card === 'receipt';
  const ink = light ? colors.ink : colors.white;

  return (
    <View style={{ flex: 1, backgroundColor: light ? '#FFE9DC' : dark ? '#141414' : '#5C0714' }}>
      <RedStatusBar light={!light} />
      <Background card={card} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ paddingHorizontal: 14, paddingTop: 8, gap: 10, zIndex: 2 }}>
          <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Card ${i + 1} of ${story}`}>
            {Array.from({ length: story }, (_, k) => (
              <View key={k} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: k <= i ? ink : light ? 'rgba(20,20,20,0.18)' : 'rgba(255,255,255,0.28)' }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Avatar source={pose(roaster, 'peer')} size={30} bg={colors.blush} />
              <T v="bodyBold" style={{ fontSize: 13, color: ink }}>Sunday roast · {report.dates}</T>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <CloseIcon size={20} color={ink} />
            </Pressable>
          </View>
        </View>

        {/* Tap zones: left third goes back, the rest goes on. Buttons inside cards sit above them. */}
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Pressable accessibilityLabel="Previous card" style={{ flex: 1 }} onPress={back} />
            <Pressable accessibilityLabel="Next card" style={{ flex: 2 }} onPress={next} />
          </View>
        </View>

        <Animated.View key={card} entering={FadeIn.duration(250)} style={{ flex: 1 }} pointerEvents="box-none">
          {card === 'cover' ? <Cover who={who} face={pose(roaster, 'selfie')} /> : null}
          {card === 'skyline' ? <Skyline days={days.slice(-7)} tracked={tracked} normal={normal} report={report} lastWeek={days.slice(-14, -7)} /> : null}
          {card === 'podium' ? <Podium days={days} tracked={tracked} face={pose(roaster, 'headShake')} /> : null}
          {card === 'excuse' && excuse ? <Excuse excuse={excuse} face={pose(roaster, 'airQuotes')} /> : null}
          {card === 'receipt' && normal != null ? <Receipt days={days.slice(-7)} tracked={tracked} normal={normal} report={report} face={pose(roaster, 'popcorn')} who={who} /> : null}
          {card === 'loops' ? <Loops att={att} onShare={next} /> : null}
        </Animated.View>

        {card !== 'loops' ? (
          <T v="bodyBold" style={{ alignSelf: 'center', paddingBottom: 12, fontSize: 13, color: light ? colors.muted : 'rgba(255,255,255,0.7)' }} pointerEvents="none">
            Tap for the next one
          </T>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

/* ---------- backgrounds ---------- */

function Background({ card }: { card: Card }) {
  const colorsFor: Record<Card, readonly [string, string, ...string[]]> = {
    cover: ['#E5132B', '#9E0B1C', '#5C0714'],
    skyline: ['#1E1416', '#141414'],
    podium: ['#FFF1E6', '#FFC9A8'],
    excuse: ['#E5132B', '#8E0A1B', '#5C0714'],
    receipt: ['#FFF1E6', '#FFB38A'],
    loops: ['#2A2010', '#141414'],
    share: ['#FFFFFF', '#FFFFFF'],
  };
  return <LinearGradient colors={colorsFor[card]} style={StyleSheet.absoluteFill} pointerEvents="none" />;
}

/* ---------- 1 · cover ---------- */

function Cover({ who, face }: { who: string; face: number }) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      <View style={{ paddingHorizontal: 24, paddingTop: 28, gap: 2 }}>
        <View style={st.glassPill}>
          <T v="bodyBold" style={{ fontSize: 11, letterSpacing: 1, color: colors.white }}>THIS WEEK · LIVE FROM YOUR THUMB</T>
        </View>
        <T style={[st.cover, { marginTop: 16 }]}>THE</T>
        <T style={[st.cover, st.outline]}>SUNDAY</T>
        <T style={st.cover}>ROAST</T>
        <T v="bodyBold" style={{ marginTop: 14, maxWidth: 230, fontSize: 16, lineHeight: 22, color: W80 }}>Hosted by {who}. Starring your screen time. No refunds.</T>
      </View>
      <View style={{ position: 'absolute', right: -40, bottom: 0 }}>
        <Character source={face} size={Math.min(380, width * 0.95)} alt={`${who} holding up the week on a phone`} fadeTo="#5C0714" />
      </View>
    </View>
  );
}

/* ---------- 2 · the week as a skyline ---------- */

function Skyline({ days, lastWeek, tracked, normal, report }: { days: HistoryDay[]; lastWeek: HistoryDay[]; tracked: TrackedApp[]; normal: number | null; report: WeeklyReport }) {
  const off = offGapsByDay();
  const totals = days.map((d) => ({ day: d.day, m: dayTotal(d, tracked), off: off.get(localKey(d.day)) ?? 0 }));
  const max = Math.max(...totals.map((t) => t.m), normal ?? 0, 1);
  const H = 260;
  const worst = totals.reduce((a, b) => (b.m > a.m ? b : a), totals[0]);
  const lastTotal = lastWeek.reduce((n, d) => n + dayTotal(d, tracked), 0);
  const diff = lastTotal > 0 ? report.total - lastTotal : null;
  const offDay = totals.filter((t) => t.off >= 60).sort((a, b) => b.off - a.off)[0];
  const worstName = worst ? new Date(worst.day).toLocaleDateString('en-GB', { weekday: 'long' }) : '';
  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      <View style={{ paddingHorizontal: 24, paddingTop: 22, gap: 4 }}>
        <T v="bodyBold" style={{ fontSize: 15, color: W80 }}>This week you gave your apps</T>
        <T style={{ fontFamily: fonts.display, fontSize: 72, lineHeight: 78, color: colors.white }}>{fmt(report.total)}</T>
        {diff != null ? (
          <View style={[st.glassPill, { backgroundColor: diff <= 0 ? 'rgba(111,224,176,0.16)' : 'rgba(255,90,106,0.18)' }]}>
            <T v="bodyBold" style={{ fontSize: 13, color: diff <= 0 ? '#6FE0B0' : '#FF8A96' }}>
              {diff <= 0 ? '↓' : '↑'} {fmt(Math.abs(diff))} {diff <= 0 ? 'less' : 'more'} than last week
            </T>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ marginHorizontal: 24, height: H + 24, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        {normal != null ? (
          <>
            <View style={[st.normalLine, { bottom: 24 + (normal / max) * H }]} />
            <View style={[st.normalTag, { bottom: 24 + (normal / max) * H - 10 }]}>
              <T v="bodyBold" style={{ fontSize: 10, color: colors.ink }}>normal</T>
            </View>
          </>
        ) : null}
        {totals.map((t) => {
          const h = Math.max(6, (t.m / max) * H);
          const isWorst = t === worst && t.m > 0;
          const label = new Date(t.day).toLocaleDateString('en-GB', { weekday: 'short' });
          return (
            <View key={t.day} style={{ flex: 1, alignItems: 'center', gap: 6 }} accessible accessibilityLabel={`${label}: ${fmt(t.m)}`}>
              {isWorst ? (
                <View style={st.worstTag}>
                  <T v="bodyBold" numberOfLines={1} style={{ fontSize: 11, color: colors.white }}>{fmt(t.m)}</T>
                </View>
              ) : t.off >= 60 ? (
                <T v="bodyBold" style={{ fontSize: 10, color: W80 }}>off {fmt(t.off)}</T>
              ) : null}
              <View style={{ width: '100%', height: h, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderRadius: 2, backgroundColor: isWorst ? colors.red : t.off >= 60 ? 'transparent' : 'rgba(255,255,255,0.88)', overflow: 'hidden' }}>
                {t.off >= 60 ? <Hatch /> : null}
              </View>
              <T v="bodyBold" style={{ fontSize: 11, color: isWorst ? colors.white : W80 }}>{label}</T>
            </View>
          );
        })}
      </View>
      <View style={st.glassCard}>
        <T style={{ fontFamily: fonts.display, fontSize: 17, lineHeight: 22, color: colors.white }}>
          {worst && worst.m > (normal ?? 0) * 1.3 ? `${worstName}, you were a houseplant with Wi-Fi. The other days? Not bad.` : report.roast}
        </T>
        {offDay ? (
          <T v="bodyBold" style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            {new Date(offDay.day).toLocaleDateString('en-GB', { weekday: 'long' })} I was switched off for {fmt(offDay.off)}. I noticed.
          </T>
        ) : null}
      </View>
    </View>
  );
}

function Hatch() {
  return (
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="h" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Rect width={6} height={12} fill="rgba(255,255,255,0.35)" />
          <Rect x={6} width={6} height={12} fill="rgba(255,255,255,0.08)" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#h)" />
    </Svg>
  );
}

/** H7: minutes Endloop was off (phone on) per local day this week. */
function offGapsByDay(): Map<string, number> {
  const out = new Map<string, number>();
  let gaps: { from: number; to: number }[] = [];
  try {
    gaps = JSON.parse(EndloopCore?.offGaps?.() ?? '[]');
  } catch {
    return out;
  }
  for (const g of gaps) {
    if (g.to - g.from < 10 * 60_000) continue;
    const k = localKey(g.from);
    out.set(k, (out.get(k) ?? 0) + Math.round((g.to - g.from) / 60_000));
  }
  return out;
}
const localKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/* ---------- 3 · podium ---------- */

/** Each app this week vs last, most used first, plus the "rebound" line (S25 podium, S21-D card). */
function appSwing(days: HistoryDay[], tracked: TrackedApp[], name = (a: TrackedApp) => a.label) {
  const week = days.slice(-7);
  const last = days.slice(-14, -7);
  const sum = (ds: HistoryDay[], pkg: string) => ds.reduce((n, d) => n + (d.apps[pkg] ?? 0), 0);
  const ranked = tracked
    .map((a) => ({ app: a, m: sum(week, a.packageName), before: sum(last, a.packageName) }))
    .map((x) => ({ ...x, change: x.before > 0 ? Math.round(((x.m - x.before) / x.before) * 100) : null }))
    .sort((a, b) => b.m - a.m);
  const dumped = ranked.find((x) => (x.change ?? 0) <= -15);
  const rebound = ranked.find((x) => (x.change ?? 0) >= 5);
  const line =
    dumped && rebound && dumped !== rebound
      ? `${name(dumped.app)} got dumped. ${name(rebound.app)} noticed and moved in.`
      : ranked[0]
        ? `${name(ranked[0].app)} took most of my week. Again.`
        : '';
  return { ranked, line };
}

function Podium({ days, tracked, face }: { days: HistoryDay[]; tracked: TrackedApp[]; face: number }) {
  const swing = appSwing(days, tracked);
  const ranked = swing.ranked.slice(0, 3);
  if (!ranked.length) return null;
  const [first, second, third] = ranked;
  const line = swing.line.replace('my week', 'your week') + (swing.line.includes('moved in') ? ' Classic rebound.' : '');
  const order = [second, first, third].filter(Boolean) as typeof ranked;
  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      <View style={{ paddingHorizontal: 24, paddingTop: 22, gap: 8 }}>
        <T v="bodyBold" style={{ fontSize: 15, color: '#8A3A2A' }}>And the winner of your attention is…</T>
        <T style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.ink }}>
          {first.app.label}.{(first.change ?? 0) >= 0 ? ' Again. Nobody’s surprised.' : ' Still. But it’s slipping.'}
        </T>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 18 }}>
        {order.map((x) => {
          const place = ranked.indexOf(x) + 1;
          const top = place === 1;
          const h = top ? 200 : place === 2 ? 140 : 96;
          return (
            <Animated.View key={x.app.packageName} entering={FadeInDown.delay(place === 1 ? 500 : place === 2 ? 250 : 0).springify()} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <AppTile label={x.app.label} color={x.app.color} iconUri={x.app.iconUri} size={top ? 54 : 44} />
              <T v="bodyBold" style={{ fontSize: 14, color: colors.ink }} numberOfLines={1}>{x.app.label}</T>
              <T style={{ fontFamily: fonts.display, fontSize: top ? 21 : 17, color: colors.ink }}>{fmt(x.m)}</T>
              {x.change != null ? <T v="bodyBold" style={{ fontSize: 12, color: x.change > 0 ? colors.red : colors.chill }}>{x.change > 0 ? '↑' : '↓'} {Math.abs(x.change)}%</T> : <T v="bodyBold" style={{ fontSize: 12, color: colors.muted }}>new</T>}
              <View style={{ width: '100%', height: h, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: top ? colors.red : colors.ink, alignItems: 'center', paddingTop: 10 }}>
                <T style={{ fontFamily: fonts.display, fontSize: 40, color: colors.white }}>{place}</T>
              </View>
            </Animated.View>
          );
        })}
      </View>
      <View style={{ backgroundColor: colors.ink, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar source={face} size={44} bg={colors.blush} />
        <T v="bodyBold" style={{ flex: 1, fontSize: 14, lineHeight: 19, color: colors.white }}>{line}</T>
      </View>
    </View>
  );
}

/* ---------- 4 · excuse of the week ---------- */

const STAMPS = [
  { x: 6, y: 0, r: -14, o: 0.9 },
  { x: 180, y: 30, r: 9, o: 0.75 },
  { x: 24, y: 210, r: 6, o: 0.6 },
  { x: 170, y: 236, r: -10, o: 0.85 },
];

function Excuse({ excuse, face }: { excuse: { reason: string; count: number }; face: number }) {
  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      <View style={{ paddingHorizontal: 24, paddingTop: 22, gap: 4 }}>
        <T v="bodyBold" style={{ fontSize: 15, color: W80 }}>Excuse of the week</T>
        <T style={{ fontFamily: fonts.display, fontSize: 48, lineHeight: 52, color: colors.white }}>Used {excuse.count} {excuse.count === 1 ? 'time' : 'times'}.</T>
      </View>
      <View style={{ marginHorizontal: 24, marginTop: 18, height: 290 }}>
        <View style={st.excuseCard}>
          <T v="label" style={{ fontSize: 11, color: colors.red }}>You, this week</T>
          <T style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.ink }}>“{excuse.reason}.”</T>
        </View>
        {STAMPS.slice(0, Math.min(4, Math.max(1, excuse.count))).map((p, k) => (
          <Animated.View key={k} entering={FadeIn.delay(400 + k * 280).duration(120)} style={[st.stamp, { left: p.x, top: p.y, opacity: p.o, transform: [{ rotate: `${p.r}deg` }] }]}>
            <T style={{ fontFamily: fonts.display, fontSize: 18, letterSpacing: 2, color: colors.red }}>REJECTED</T>
          </Animated.View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 24, marginTop: 8 }}>
        <Avatar source={face} size={50} bg={colors.blush} />
        <T v="bodyBold" style={{ flex: 1, fontSize: 15, lineHeight: 21, color: colors.white }}>
          {excuse.count >= 3 ? `${excuse.count} times. At this point it’s not an excuse, it’s a ritual.` : 'Noted. Filed. Not believed.'}
        </T>
      </View>
    </View>
  );
}

/* ---------- 5 · time won back receipt ---------- */

function Receipt({ days, tracked, normal, report, face, who }: { days: HistoryDay[]; tracked: TrackedApp[]; normal: number; report: WeeklyReport; face: number; who: string }) {
  const s = useSettings();
  const counted = report.countedDays;
  const lines = tracked.map((a) => {
    const used = days.reduce((n, d) => n + (d.apps[a.packageName] ?? 0), 0);
    return { label: a.label, diff: Math.round(used - a.avgDailyMin * counted) };
  });
  const under = days.filter((d) => tracked.every((a) => (d.apps[a.packageName] ?? 0) <= limitOn(a, s, new Date(d.day)))).length;
  const snoozes = days.reduce((n, d) => n + d.snoozes, 0);
  const won = report.wonBack ?? Math.round(normal * counted - report.total);
  return (
    <View style={{ flex: 1 }} pointerEvents="none">
      <T v="bodyBold" style={{ paddingHorizontal: 24, paddingTop: 18, fontSize: 15, color: '#8A3A2A' }}>{won >= 0 ? "But also. Fine. Here's your receipt." : "Here's your receipt. It's not pretty."}</T>
      <View style={[st.receipt, { transform: [{ rotate: '1.5deg' }] }]}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Wordmark width={96} variant="ink" />
          <T v="bodyBold" style={{ fontSize: 11, letterSpacing: 2, color: '#8A8A8A' }}>TIME WON BACK · {report.dates.toUpperCase()}</T>
        </View>
        <Dash />
        {lines.map((l) => (
          <ReceiptLine key={l.label} a={l.diff > 0 ? `${l.label} (${lines.some((x) => x.diff < 0) ? 'rebound fee' : 'over normal'})` : l.label} b={`${l.diff <= 0 ? '−' : '+'}${fmt(Math.abs(l.diff))}`} color={l.diff > 0 ? colors.red : colors.ink} />
        ))}
        <Dash />
        <ReceiptLine a="Days under every limit" b={`${under} of ${days.length}`} />
        <ReceiptLine a="Closed on the 1st roast" b={`${report.wins} ${report.wins === 1 ? 'time' : 'times'}`} />
        <ReceiptLine a="Snoozes" b={String(snoozes)} />
        <Dash />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T v="bodyBold" style={{ fontSize: 15, color: colors.ink }}>{won >= 0 ? 'TOTAL WON BACK' : 'TOTAL LOST'}</T>
          <T style={{ fontFamily: fonts.display, fontSize: 30, color: won >= 0 ? colors.chill : colors.red }}>{fmt(Math.abs(won))}</T>
        </View>
        <T v="bodyBold" style={{ alignSelf: 'center', fontSize: 11, letterSpacing: 1, color: '#8A8A8A' }}>{won >= 0 ? 'PAID IN: ACTUAL SLEEP' : 'PAID IN: YOUR EVENINGS'}</T>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 18 }}>
        <Character source={face} size={150} alt={`${who} eating popcorn, entertained`} />
        <View style={[st.bubble, { marginBottom: 40 }]}>
          <T v="bodyBold" style={{ fontSize: 15, lineHeight: 20, color: colors.white }}>{won >= 0 ? "Don't let it go to your head." : 'Great show. Terrible numbers.'}</T>
        </View>
      </View>
    </View>
  );
}

function ReceiptLine({ a, b, color = colors.ink }: { a: string; b: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
      <T style={{ flexShrink: 1, fontSize: 15, color }}>{a}</T>
      <T style={{ fontSize: 15, color }}>{b}</T>
    </View>
  );
}
const Dash = () => <View style={{ borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#D9CFC2', marginVertical: 2 }} />;

/* ---------- 6 · Loops last call ---------- */

function Loops({ att, onShare }: { att: ReturnType<typeof useAttendance>; onShare: () => void }) {
  const [left, setLeft] = useState(() => untilMidnightSunday());
  useEffect(() => {
    const t = setInterval(() => setLeft(untilMidnightSunday()), 1000);
    return () => clearInterval(t);
  }, []);
  const enough = att.loops >= LETTER_COST;
  const first = att.firstWeek && !enough;
  const short = LETTER_COST - att.loops;
  const h = Math.floor(left / 3600);
  const clock = `${String(Math.min(99, h)).padStart(2, '0')}:${String(Math.floor((left % 3600) / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  const dow = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View style={{ flex: 1 }} pointerEvents="box-none">
      <View style={{ paddingHorizontal: 24, paddingTop: 22 }} pointerEvents="none">
        <T v="bodyBold" style={{ fontSize: 15, color: '#FFD27A' }}>Loops last call</T>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <T style={{ flex: 1, fontFamily: fonts.display, fontSize: 92, lineHeight: 100, color: colors.white }}>{att.loops}</T>
          <Coins />
        </View>
        <T v="bodyBold" style={{ fontSize: 15, color: W80 }}>Loops in the jar</T>
        <View style={[st.glassPill, { marginTop: 8, backgroundColor: first ? 'rgba(111,224,176,0.16)' : enough ? 'rgba(232,163,23,0.2)' : 'rgba(255,90,106,0.18)' }]}>
          <T v="bodyBold" style={{ fontSize: 13, color: first ? '#6FE0B0' : enough ? '#FFD27A' : '#FF8A96' }}>
            {first ? 'Week one · they carry over' : enough ? `Enough for a leave${att.loops > LETTER_COST ? ` · ${att.loops - LETTER_COST} to spare` : ''}` : `${short} short of a leave`}
          </T>
        </View>
      </View>
      <View style={st.timer} pointerEvents="none">
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <T v="bodyBold" style={{ fontSize: 13, color: W80 }}>{first ? 'Safe until' : 'They vanish in'}</T>
          <T style={{ fontFamily: fonts.display, fontSize: first ? 26 : 34, color: colors.white }}>{first ? 'next Sunday' : clock}</T>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 10 }}>
          <View style={{ width: `${Math.min(100, (att.loops / LETTER_COST) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: '#E8A317' }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <T v="caption" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>0</T>
          <T v="caption" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{LETTER_COST} = one leave</T>
        </View>
      </View>
      <T style={{ marginHorizontal: 24, marginTop: 16, fontFamily: fonts.display, fontSize: 17, lineHeight: 22, color: colors.white }} pointerEvents="none">
        {first
          ? `First week’s on me. Keep these, earn ${short} more, and next Sunday you write your first Leave Letter.`
          : enough
            ? `Write the letter. Or watch ${att.loops} Loops disappear at midnight.`
            : short <= LETTER_COST / 4
              ? 'So close it’s sad. Every Loop clears at midnight. Monday, we go again.'
              : `Not this week. These ${att.loops} clear at midnight. Monday, we go again.`}
      </T>
      <View style={{ flex: 1 }} pointerEvents="none" />
      <View pointerEvents="none" style={{ paddingHorizontal: 24, gap: 8 }}>
        <T v="label" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Where they came from</T>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {att.weekLoops.map((l, k) => (
            <View key={k} style={st.loopDay}>
              <T style={{ fontFamily: fonts.display, fontSize: 14, color: l ? '#FFD27A' : 'rgba(255,255,255,0.4)' }}>{l == null ? '–' : l ? `+${l}` : '0'}</T>
              <T v="caption" style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{dow[k]}</T>
            </View>
          ))}
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 4, gap: 2 }}>
        {enough ? (
          <Button label="Write a Leave Letter" tone="white" onPress={() => router.replace('/leave-letter')} />
        ) : (
          <Pressable accessibilityRole="button" onPress={() => router.replace('/attendance')} style={st.outlineBtn}>
            <T v="bodyBold" style={{ fontSize: 16, color: colors.white }}>See Attendance</T>
          </Pressable>
        )}
        <View style={{ alignItems: 'center' }}>
          <LinkButton label="Share my week" color={colors.white} onPress={onShare} />
        </View>
      </View>
    </View>
  );
}

/** Seconds until Loops clear (Sunday midnight). */
function untilMidnightSunday(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  end.setDate(end.getDate() + ((7 - now.getDay()) % 7));
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}

function Coins() {
  return (
    <Svg width={110} height={110} viewBox="0 0 110 110">
      {[
        [62, 40, 34],
        [86, 74, 20],
        [40, 86, 16],
      ].map(([x, y, r], k) => (
        <Circle key={k} cx={x} cy={y} r={r} fill="#E8A317" stroke="#FFD27A" strokeWidth={4} />
      ))}
      <Circle cx={62} cy={40} r={20} fill="none" stroke="#B87A0A" strokeWidth={3} />
    </Svg>
  );
}

/* ---------- share (S21-D, drawn natively as a 1080×1080 card) ---------- */

const K = 300 / 1080; // preview scale

function Share({ report, days, tracked, onClose, onBack }: { report: WeeklyReport; days: HistoryDay[]; tracked: TrackedApp[]; onClose: () => void; onBack: () => void }) {
  const { roaster } = useSettings();
  const [hide, setHide] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const order = appSwing(days, tracked).ranked.map((x) => x.app.packageName);
  const name = (a: TrackedApp) => (hide ? `App #${order.indexOf(a.packageName) + 1}` : a.label);
  const swing = appSwing(days, tracked, name);
  const apps = swing.ranked
    .filter((x) => x.change != null)
    .sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0))
    .slice(0, 2)
    .map((x) => ({ label: name(x.app), color: x.app.color, change: `${(x.change ?? 0) > 0 ? '↑' : '↓'} ${Math.abs(x.change ?? 0)}%`, up: (x.change ?? 0) > 0 }));
  const won = report.wonBack != null && report.wonBack > 0;
  let roast = swing.line.includes('moved in') ? swing.line : report.roast;
  if (hide) for (const a of tracked) roast = roast.split(a.label).join(name(a));
  const cardPose: Pose = report.type === 'bad' ? 'headShake' : report.type === 'first' ? 'notes' : 'savage';
  const spec = {
    kind: 'weekly' as const,
    dates: `MY WEEK ON ENDLOOP · ${report.dates.toUpperCase()}`,
    label: won ? 'Time won back' : 'Time on my apps',
    total: fmt(won ? report.wonBack! : report.total),
    apps,
    roast,
    character: poseDrawable(roaster, cardPose),
    shareTitle: 'Share your week',
  };
  const text = `My week on Endloop: ${won ? `${fmt(report.wonBack!)} won back` : `${fmt(report.total)} on my apps`}. ${roast}`;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={st.shareHead}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar source={pose(roaster, 'selfie')} size={40} />
          <T v="bodyBold" style={{ fontSize: 20 }}>Share your week</T>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <CloseIcon size={18} color={colors.ink} />
        </Pressable>
      </View>

      {/* Preview of the native card, at 300 / 1080 scale */}
      <View style={{ alignItems: 'center', paddingTop: 16 }}>
        <View style={st.card} accessible accessibilityLabel={`Your week card: ${spec.label} ${spec.total}. ${roast}`}>
          <View style={{ position: 'absolute', right: 10 * K, bottom: 150 * K }} pointerEvents="none">
            <Character source={pose(roaster, cardPose)} size={400 * K} alt="" fadeTo={colors.ink} />
          </View>
          <T v="bodyBold" numberOfLines={1} style={{ fontSize: 30 * K, letterSpacing: 4 * K, color: '#FFB38A' }}>{spec.dates}</T>
          <T v="bodyBold" style={{ marginTop: 30 * K, fontSize: 40 * K, color: 'rgba(255,255,255,0.8)' }}>{spec.label}</T>
          <T numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: fonts.display, fontSize: 200 * K, lineHeight: 220 * K, color: colors.white }}>{spec.total}</T>
          <View style={{ marginTop: 30 * K, width: 560 * K, gap: 18 * K }}>
            {apps.map((a) => (
              <View key={a.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 22 * K, paddingBottom: 18 * K, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                <View style={{ width: 64 * K, height: 64 * K, borderRadius: 18 * K, backgroundColor: a.color, alignItems: 'center', justifyContent: 'center' }}>
                  <T v="bodyBold" style={{ fontSize: 30 * K, color: colors.white }}>{a.label.slice(0, 1)}</T>
                </View>
                <T v="bodyBold" numberOfLines={1} style={{ flex: 1, fontSize: 38 * K, color: colors.white }}>{a.label}</T>
                <T v="bodyBold" style={{ fontSize: 38 * K, color: a.up ? '#FF8A96' : '#6FE0B0' }}>{a.change}</T>
              </View>
            ))}
          </View>
          <T v="bodyBold" style={{ marginTop: 34 * K, maxWidth: 600 * K, fontSize: 40 * K, lineHeight: 46 * K, color: colors.white }}>{roast}</T>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Wordmark width={240 * K} variant="white" />
            <T v="bodyBold" style={{ fontSize: 32 * K, color: 'rgba(255,255,255,0.9)' }}>{SHARE_TAGLINE}</T>
          </View>
        </View>
      </View>
      <View style={st.hideRow}>
        <T v="bodyBold" style={{ fontSize: 15 }}>Hide app names</T>
        <Switch value={hide} onValueChange={setHide} trackColor={{ true: colors.red, false: colors.line }} thumbColor={colors.white} />
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 24, paddingBottom: 20, gap: 4 }}>
        {note ? <T v="caption" style={{ textAlign: 'center' }}>{note}</T> : null}
        <Button label="Share my week" onPress={() => shareCard(spec, text)} />
        <View style={{ alignItems: 'center' }}>
          <LinkButton
            label="Save image"
            color={colors.ink}
            onPress={async () => {
              const ok = await shareCard(spec, text, true);
              setNote(ok ? 'Saved to Pictures › Endloop.' : 'Saving needs the Android app on Android 10 or newer. Share it instead.');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  cover: { fontFamily: fonts.display, fontSize: 72, lineHeight: 70, color: colors.white, letterSpacing: -1 },
  outline: { color: '#9E0B1C', textShadowColor: colors.white, textShadowRadius: 2, textShadowOffset: { width: 0, height: 0 } },
  glassPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)' },
  normalLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.45)' },
  worstTag: { minWidth: 56, alignItems: 'center', marginHorizontal: -12, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 9, backgroundColor: colors.red },
  normalTag: { position: 'absolute', right: -6, zIndex: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.9)' },
  glassCard: { margin: 24, marginTop: 16, marginBottom: 10, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  excuseCard: { position: 'absolute', left: 10, right: 10, top: 30, bottom: 30, transform: [{ rotate: '-3deg' }], borderRadius: 22, backgroundColor: colors.white, padding: 22, justifyContent: 'center', gap: 10, elevation: 10 },
  stamp: { position: 'absolute', borderWidth: 3, borderColor: colors.red, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.88)' },
  receipt: { marginHorizontal: 30, marginTop: 14, backgroundColor: '#FFFDF8', padding: 20, gap: 9, borderRadius: 4, elevation: 8, shadowColor: '#5A2814', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 12 } },
  bubble: { flexShrink: 1, backgroundColor: colors.ink, borderRadius: 16, borderBottomLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 14 },
  timer: { marginHorizontal: 24, marginTop: 18, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  loopDay: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(232,163,23,0.1)', borderWidth: 1, borderColor: 'rgba(232,163,23,0.25)' },
  outlineBtn: { height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  shareHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 12, paddingTop: 8 },
  hideRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16 },
  card: { width: 300, height: 300, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.ink, paddingTop: 84 * K, paddingHorizontal: 84 * K, paddingBottom: 72 * K, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
});
