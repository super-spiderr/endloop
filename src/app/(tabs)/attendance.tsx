import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Wordmark } from '@/brand/logo';
import { pose, roasterName } from '@/characters';
import { AttendanceIntro, MilestoneMoment, SaverMoment } from '@/components/attendance-moments';
import { FlameIcon, LeafIcon, LoopsIcon, StarIcon } from '@/components/icons';
import { RedStatusBar } from '@/components/onboarding-ui';
import { CORAL, GLASS, PREMIUM_BOTTOM, PremiumBackdrop, usePremiumLook } from '@/components/premium-ui';
import { AppTile, Button, Character, LinkButton, T } from '@/components/ui';
import { cancelLeave, earns, fmtDay, LETTER_COST, letterRules, MILESTONES, spendSaver, useAttendance, type AppStatus, type DayMark } from '@/lib/attendance';
import { MILESTONE_SHARE, poseDrawable, shareCard } from '@/lib/share-cards';
import { useSettings } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

const STATUS: Record<AppStatus, { color: string; pColor: string; label: string }> = {
  clean: { color: colors.chill, pColor: '#5BD6A0', label: 'Present' },
  risk: { color: colors.heads, pColor: '#FFB547', label: 'At risk' },
  bunk: { color: colors.red, pColor: '#FF5A6A', label: 'Bunked' },
  learn: { color: colors.muted, pColor: '#BDBDBD', label: 'Learning' },
};
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Attendance tab (canvas "Attendance v2"): streaks as attendance, Loops this week, Leave Letters, savers, milestones. */
export default function Attendance() {
  const s = useSettings();
  const a = useAttendance();
  const P = usePremiumLook();
  const ink = P ? colors.white : colors.ink;
  const soft = P ? 'rgba(255,255,255,0.72)' : colors.muted;
  const rules = letterRules(s, a);
  const [introAgain, setIntroAgain] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const introOpen = s.tracked.length > 0 && (!s.attendanceIntroSeen || introAgain);
  const seen = s.milestonesSeen ?? [];
  const milestone = a.ready && !introOpen && !saved ? [...MILESTONES].reverse().find((m) => a.streak >= m && !seen.includes(m)) : undefined;
  const closeMilestone = () => s.set({ milestonesSeen: [...new Set([...seen, ...MILESTONES.filter((m) => m <= a.streak)])] });

  if (!s.tracked.length) return <NoApps />;

  const next = MILESTONES.find((m) => m > a.streak) ?? 100;
  const prev = [...MILESTONES].reverse().find((m) => m <= a.streak) ?? 0;
  const toLetter = Math.max(0, LETTER_COST - a.loops);
  const line = a.onLeaveToday
    ? "On leave. I'm still counting, though."
    : a.streak === 0
      ? "Day zero. Everyone starts somewhere. Usually lower."
      : a.streak < 3
        ? `Day ${a.streak}. I have notes. Mostly good ones.`
        : a.streak < 14
          ? 'Suspiciously good. Keep going.'
          : "Fine. I'm a little impressed.";

  const box = P ? st.glassCard : st.card;
  const markStyle = (m: DayMark) => {
    if (m === 'present') return { backgroundColor: P ? '#5BD6A0' : colors.chill };
    if (m === 'bunk') return { backgroundColor: colors.red };
    if (m === 'leave') return { backgroundColor: '#2D5FA8' };
    if (m === 'today') return { borderWidth: 2, borderStyle: 'dashed' as const, borderColor: P ? 'rgba(255,255,255,0.6)' : colors.red };
    return { backgroundColor: P ? 'rgba(255,255,255,0.08)' : '#F2F0F0' };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: P ? PREMIUM_BOTTOM : colors.bg }} edges={['top']}>
      <RedStatusBar light={P} />
      {P ? <PremiumBackdrop /> : null}
      <View style={st.header}>
        <Wordmark width={88} variant={P ? 'white' : 'ink'} />
        <T v="bodyBold" style={{ fontSize: 13, color: soft }}>{a.firstWeek ? 'Week 1' : `Week of ${fmtDay(a.week[0]?.day, false)}`}</T>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 10, paddingBottom: 32, gap: 14 }}>
        <T style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: ink }}>Attendance</T>

        {/* All-apps streak, shown as attendance. */}
        {/* The gradient is a background layer, not a wrapper: wrapped content sometimes doesn't paint on Android. */}
        <View style={[st.hero, P && st.heroPremium]}>
          <LinearGradient colors={P ? ['#FF3048', '#E5132B', '#9E0B1C'] : ['#FFE3E6', '#FFC9D0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={st.heroChar} pointerEvents="none">
            <Character source={pose(s.roaster, a.onLeaveToday ? 'couch' : a.streak >= 7 ? 'flex' : 'calendar')} size={200} alt={`${roasterName[s.roaster]}, keeping the register`} />
          </View>
          <View style={{ width: '56%', gap: 4 }}>
            <T v="label" style={{ fontSize: 11, color: ink, opacity: 0.75 }}>All apps · attendance</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FlameIcon size={28} color={P ? colors.white : colors.red} />
              <T style={{ fontFamily: fonts.display, fontSize: 52, lineHeight: 58, color: P ? colors.white : colors.red }}>{a.streak}</T>
            </View>
            <T v="bodyBold" style={{ fontSize: 15, color: ink }}>{a.streak === 1 ? 'day present' : 'days present'}</T>
            <T style={{ fontSize: 13, lineHeight: 18, fontStyle: 'italic', color: ink, opacity: 0.85 }}>“{line}”</T>
            <View style={[st.track, { marginTop: 6, backgroundColor: P ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.7)' }]}>
              <View style={{ width: `${Math.max(4, ((a.streak - prev) / Math.max(1, next - prev)) * 100)}%`, height: 6, borderRadius: 3, backgroundColor: P ? colors.white : colors.red }} />
            </View>
            <T v="bodyBold" style={{ fontSize: 12, color: ink }}>
              {next - a.streak} more {next - a.streak === 1 ? 'day' : 'days'} to the {next}-day badge{next === 30 ? ' (+1 Streak saver)' : ''}
            </T>
          </View>
        </View>

        {/* This week's register. */}
        <View accessibilityLabel="This week" style={{ flexDirection: 'row' }}>
          {a.week.map((w, i) => (
            <View key={w.day} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <T v="bodyBold" style={{ fontSize: 11, color: soft }}>{DOW[i]}</T>
              <View style={[st.dot, markStyle(w.mark)]} accessibilityLabel={`${w.day}: ${w.mark}`}>
                {w.mark === 'present' ? <Tick /> : w.mark === 'bunk' ? <Cross /> : w.mark === 'leave' ? <T v="bodyBold" style={{ fontSize: 11, color: colors.white }}>L</T> : null}
              </View>
            </View>
          ))}
        </View>

        {a.canSave ? (
          <View style={[box, { gap: 10 }]}>
            <T v="bodyBold" style={{ color: ink }}>Yesterday broke your streak.</T>
            <T style={{ fontSize: 13, lineHeight: 19, color: soft }}>Use a Streak saver and yesterday counts as present. You have {a.savers.free + a.savers.premium}.</T>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const by = a.brokeBy;
                setSaved(by ? `${by.label} went ${by.overMin} ${by.overMin === 1 ? 'minute' : 'minutes'} over yesterday. A Streak saver caught it, so your streak lives.` : 'Yesterday slipped. A Streak saver caught it, so your streak lives.');
                spendSaver(a.canSave!, a);
              }}
              style={[st.btn, { backgroundColor: colors.red }]}>
              <T v="bodyBold" style={{ color: colors.white }}>Use a Streak saver</T>
            </Pressable>
          </View>
        ) : null}

        {/* Loops this week + the Leave Letter. */}
        <View style={[box, { gap: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ gap: 2 }}>
              <T v="label" style={{ fontSize: 11, color: soft }}>Loops this week</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <LoopsIcon size={26} color={P ? CORAL : undefined} />
                <T style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 40, color: ink }}>{a.loops}</T>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={[st.pill, { backgroundColor: P ? GLASS : colors.blush }]}>
                <T v="bodyBold" style={{ fontSize: 12, color: P ? colors.white : colors.red }}>
                  {a.firstWeek && a.loops < LETTER_COST ? 'Week 1 · no clearing' : a.clearsInDays <= 1 ? 'Clear tonight, midnight' : `Clear in ${a.clearsInDays} days`}
                </T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <LeafIcon size={12} color={soft} />
                <T v="bodyBold" style={{ fontSize: 12, color: soft }}>{a.freeLeavesLeft} free {a.freeLeavesLeft === 1 ? 'leave' : 'leaves'} left this month</T>
              </View>
            </View>
          </View>
          <View style={[st.bar, { backgroundColor: P ? 'rgba(255,255,255,0.12)' : '#FFF0C8' }]}>
            <View style={{ width: `${Math.min(100, (a.loops / LETTER_COST) * 100)}%`, height: 10, borderRadius: 5, backgroundColor: P ? CORAL : '#E8A317' }} />
          </View>
          <T v="bodyBold" style={{ fontSize: 12, color: soft }}>
            {toLetter > 0 ? `${toLetter} more Loops for a Leave Letter` : `Enough for a Leave Letter${a.loops > LETTER_COST ? `, ${a.loops - LETTER_COST} to spare` : ''}`}
          </T>
          {a.firstWeek && a.loops < LETTER_COST ? (
            <T v="bodyBold" style={{ fontSize: 12, lineHeight: 17, color: P ? '#FFD3D9' : '#8A5A00' }}>Not enough for a leave yet? Your Loops carry over to next week, this once.</T>
          ) : null}
          {rules.open && rules.pay ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/leave-letter')} style={[st.btn, { backgroundColor: colors.red, flexDirection: 'row', gap: 8 }]}>
              <LeafIcon size={16} color={colors.white} />
              <T v="bodyBold" style={{ color: colors.white }}>Write a Leave Letter · {rules.pay === 'loops' ? `${LETTER_COST} Loops` : '1 free leave'}</T>
            </Pressable>
          ) : (
            <View style={[st.btn, st.btnOff, P && { borderColor: 'rgba(255,255,255,0.3)' }]}>
              <T v="bodyBold" style={{ color: soft }}>{rules.open ? 'Not enough Loops or free leaves' : 'Write a Leave Letter · opens Saturday'}</T>
            </View>
          )}
          {rules.weekendOnly ? <T style={{ fontSize: 11, color: soft, textAlign: 'center' }}>Dev build: letters open every day for testing.</T> : null}
        </View>

        {/* Per app. */}
        <T v="label" style={{ fontSize: 11, color: soft, marginTop: 4 }}>{P ? `Per app · ${s.tracked.length} of 6` : 'Per app'}</T>
        {s.tracked.map((app) => {
          const p = a.perApp[app.packageName];
          const sc = p ? STATUS[p.status] : STATUS.clean;
          const col = P ? sc.pColor : sc.color;
          const sub = !p
            ? ''
            : p.status === 'learn'
              ? 'Learning your habits · no Loops yet'
              : p.status === 'bunk'
                ? 'Bunked today · streak resets tonight'
                : p.status === 'risk'
                  ? `${p.minutesLeft} min from losing it`
                  : earns(app)
                    ? 'Earning Loops · clean today'
                    : 'Clean today';
          return (
            <Pressable key={app.packageName} accessibilityRole="button" accessibilityLabel={`${app.label}, ${p?.streak ?? 0} days present, ${sc.label}`} onPress={() => router.push(`/app/${encodeURIComponent(app.packageName)}`)} style={[box, st.row]}>
              <AppTile label={app.label} color={app.color} iconUri={app.iconUri} size={38} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="bodyBold" style={{ fontSize: 15, color: ink }}>{app.label}</T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {earns(app) && p?.status !== 'learn' ? <LoopsIcon size={11} color={P ? CORAL : undefined} /> : null}
                  <T style={{ flexShrink: 1, fontSize: 12, color: soft }} numberOfLines={1}>{sub}</T>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <FlameIcon size={13} color={p?.streak ? (P ? CORAL : colors.red) : '#8A8A8A'} />
                  <T style={{ fontFamily: fonts.display, fontSize: 16, color: p?.streak ? (P ? CORAL : colors.red) : soft }}>{p?.streak ?? 0}</T>
                </View>
                <View style={[st.pill, { height: 20, paddingHorizontal: 8, backgroundColor: `${col}22` }]}>
                  <T v="bodyBold" style={{ fontSize: 11, color: col }}>{sc.label}</T>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Booked leaves + Streak savers. */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[box, st.tile]}>
            <T v="label" style={{ fontSize: 11, color: soft }}>Booked leave</T>
            {a.bookings.length ? (
              a.bookings.map((b) => (
                <View key={b.day} style={{ gap: 2 }}>
                  <T v="bodyBold" style={{ fontSize: 15, color: ink }}>{fmtDay(b.day, true)}</T>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() =>
                      Alert.alert('Cancel this leave?', b.paidWith === 'loops' ? `You get your ${LETTER_COST} Loops back.` : 'You get the free leave back.', [
                        { text: 'Keep it', style: 'cancel' },
                        { text: 'Cancel leave', style: 'destructive', onPress: () => cancelLeave(b.day) },
                      ])
                    }>
                    <T v="bodyBold" style={{ fontSize: 12, color: P ? CORAL : colors.red }}>Cancel · refund</T>
                  </Pressable>
                </View>
              ))
            ) : (
              <>
                <T v="bodyBold" style={{ fontSize: 15, color: ink }}>None yet</T>
                <T style={{ fontSize: 12, color: soft }}>Book one at the weekend</T>
              </>
            )}
          </View>
          <View style={[box, st.tile]}>
            <T v="label" style={{ fontSize: 11, color: soft }}>Streak savers</T>
            <T v="bodyBold" style={{ fontSize: 15, color: ink }}>{a.savers.free + a.savers.premium}</T>
            <T style={{ fontSize: 12, color: soft }}>{s.premium ? '1 every month with Premium' : '1 for every 30-day streak'}</T>
          </View>
        </View>

        {/* Milestones. */}
        <T v="label" style={{ fontSize: 11, color: soft, marginTop: 4 }}>Milestones</T>
        <View style={{ flexDirection: 'row' }}>
          {MILESTONES.map((m) => {
            const got = a.best >= m;
            return (
              <View key={m} style={{ flex: 1, alignItems: 'center', gap: 4 }} accessibilityLabel={`${m} days${got ? ', reached' : ''}`}>
                <View style={[st.badge, got ? { backgroundColor: colors.red } : { borderWidth: 1.5, borderStyle: 'dashed', borderColor: P ? 'rgba(255,255,255,0.25)' : '#D9CFD0' }]}>
                  <T style={{ fontFamily: fonts.display, fontSize: 16, color: got ? colors.white : soft }}>{m}</T>
                </View>
                <T v="bodyBold" style={{ fontSize: 11, color: got ? (P ? colors.white : colors.red) : soft }}>{got ? 'days' : m === 30 ? '+ saver' : 'days'}</T>
              </View>
            );
          })}
        </View>

        {!s.premium ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
            <StarIcon size={12} />
            <T style={{ fontSize: 12, color: soft }}>Premium: 6 apps, a Streak saver every month, book 30 days ahead</T>
          </View>
        ) : null}
        <View style={{ alignItems: 'center' }}>
          <LinkButton label="How Attendance works" onPress={() => setIntroAgain(true)} color={soft} />
        </View>
      </ScrollView>

      <AttendanceIntro
        visible={introOpen}
        roaster={s.roaster}
        onDone={() => {
          setIntroAgain(false);
          if (!s.attendanceIntroSeen) s.set({ attendanceIntroSeen: true });
        }}
      />
      <SaverMoment visible={!!saved} roaster={s.roaster} streak={a.streak} saversLeft={a.savers.free + a.savers.premium} detail={saved ?? ''} onClose={() => setSaved(null)} />
      <MilestoneMoment
        visible={!!milestone}
        roaster={s.roaster}
        days={milestone ?? 7}
        onClose={closeMilestone}
        onShare={() => {
          const days = milestone ?? 7;
          const line = MILESTONE_SHARE[days] ?? MILESTONE_SHARE[7];
          shareCard(
            { kind: 'milestone', days: String(days), line, character: poseDrawable(s.roaster, 'rareSmile'), shareTitle: 'Share your streak' },
            `${days} days present on Endloop. ${line}`,
          );
          closeMilestone();
        }}
      />
    </SafeAreaView>
  );
}

/** Attendance with no tracked apps (canvas AT2-G). */
function NoApps() {
  const roaster = useSettings((x) => x.roaster);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <RedStatusBar light={false} />
      <View style={st.header}>
        <Wordmark width={88} variant="ink" />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
        <T style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.ink }}>Attendance</T>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 110, gap: 10 }}>
        <Character source={pose(roaster, 'chinOnHand')} size={220} alt={`${roasterName[roaster]}, chin on hand, curious`} />
        <T style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, textAlign: 'center' }}>No apps, no attendance.</T>
        <T style={{ fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' }}>Pick the apps I should watch. Streaks, Loops and Leave Letters start the moment you do.</T>
        <Button label="Pick my apps" style={{ alignSelf: 'stretch', marginTop: 10 }} onPress={() => router.push('/onboarding/pick-apps')} />
      </View>
    </SafeAreaView>
  );
}

function Tick() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M5 12l5 5 9-10" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function Cross() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 },
  hero: { borderRadius: 28, overflow: 'hidden', minHeight: 236, padding: 20 },
  heroPremium: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', elevation: 12, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 12 } },
  heroChar: { position: 'absolute', right: -30, bottom: 0 },
  track: { height: 6, borderRadius: 3 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 16, borderRadius: 22, borderWidth: 1, borderColor: '#EDE3E4', backgroundColor: colors.white },
  glassCard: { padding: 16, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)' },
  pill: { flexDirection: 'row', alignItems: 'center', height: 26, paddingHorizontal: 10, borderRadius: 999 },
  bar: { height: 10, borderRadius: 5 },
  btn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnOff: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D9CFD0' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  tile: { flex: 1, gap: 4, padding: 14 },
  badge: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
});
