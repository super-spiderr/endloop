import { useEffect, useState } from 'react';
import { EndloopCore } from 'endloop-core';
import { router } from 'expo-router';
import { AppState, Modal, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Wordmark } from '@/brand/logo';
import { pose, roasterName, type Pose } from '@/characters';
import { CloseIcon, FlameIcon } from '@/components/icons';
import { PremiumSheet } from '@/components/premium-sheet';
import { AppTile, Avatar, Button, Character, Pill, T } from '@/components/ui';
import { usage, type TodayUsage } from '@/data/usage';
import { fill, pickRoast } from '@/roasts';
import { comparison, fmt } from '@/lib/time';
import { batterySteps, openBatterySettings, openUsageAccessSettings } from '@/lib/permissions';
import { watcherLooksDead } from '@/lib/watcher';
import { localDay, useSettings } from '@/store/settings';
import { colors, fonts, gradients, radius, stateStyle, usageState } from '@/theme/tokens';

/** Screen 7 · Home ("Today" tab). */
/** Placeholders Home can fill today; lines needing more ({opens}, {streak}…) wait until we track that. */
const VARS = ['app', 'time', 'limit'] as const;

export default function Today() {
  const { roaster, roastLang, intensity, tracked, hasUsageAccess, howItWorksDismissed, streakDays, startedAt, pausedOn, perfectSeen, set } = useSettings();
  const [today, setToday] = useState<TodayUsage>({});
  const [demo, setDemo] = useState(false);
  const [premium, setPremium] = useState(false);
  const [killed, setKilled] = useState(false);
  const [gone, setGone] = useState<string | null>(null);
  const [perfectYesterday, setPerfectYesterday] = useState(false);

  // Refresh on open and every time the app comes back to the front.
  useEffect(() => {
    const refresh = () => {
      const pkgs = tracked.map((a) => a.packageName);
      usage.today(pkgs).then(setToday);
      usage.hasUsageAccess().then((ok) => set({ hasUsageAccess: ok }));
      useSettings.getState().applyScheduled();
      // Screen 16: the phone killed the watcher → say so (and restart it)
      if (watcherLooksDead()) {
        setKilled(true);
        EndloopCore?.startWatcher();
      }
      // Screen 16: a tracked app was uninstalled → drop it quietly, free the slot
      if (EndloopCore && pkgs.length) {
        const still = new Set(EndloopCore.installed(pkgs));
        const removed = tracked.filter((a) => !still.has(a.packageName));
        if (removed.length) {
          set({ tracked: tracked.filter((a) => still.has(a.packageName)) });
          setGone(removed[0].label);
        }
      }
      // Screen 16: yesterday under every limit → a perfect-day card, once
      if (pkgs.length && useSettings.getState().perfectSeen !== localDay()) {
        usage.history(2, pkgs).then((days) => {
          const y = days[0];
          const started = useSettings.getState().startedAt;
          const counted = !!y && (!started || y.day >= new Date(`${started}T00:00:00`).getTime());
          setPerfectYesterday(counted && tracked.every((a) => (y.apps[a.packageName] ?? 0) <= a.limitMin) && Object.values(y.apps).some((m) => m > 0));
        });
      }
    };
    refresh();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && refresh());
    return () => sub.remove();
  }, [tracked, set]);

  const firstVisit = !howItWorksDismissed;
  const paused = pausedOn === localDay();
  const dayOne = !firstVisit && (!startedAt || startedAt === localDay());
  const rows = tracked.map((a) => ({ ...a, used: today[a.packageName] ?? 0, state: usageState(today[a.packageName] ?? 0, a.limitMin) }));
  const total = rows.reduce((s, r) => s + r.used, 0);
  const over = rows.filter((r) => r.state === 'roasted');
  const close = rows.filter((r) => r.state === 'heads');

  const mood = (() => {
    const seed = new Date().getDate();
    const vars = (r?: (typeof rows)[number]) => ({ app: r?.label ?? '', time: fmt(r?.used ?? 0), limit: fmt(r?.limitMin ?? 0), streak: streakDays });
    if (!hasUsageAccess) return { label: 'Blind', pose: 'unplugged' as Pose, tint: colors.blush, color: colors.red, line: "Usage Access is off. I'm guessing now." };
    if (!tracked.length) return { label: 'Bored', pose: 'bored' as Pose, tint: colors.blush, color: colors.red, line: 'Nothing to watch. Suspicious.' };
    if (paused) return { label: 'Day off', pose: 'stretching' as Pose, tint: '#EDEDED', color: colors.muted, line: "I'm judging silently." };
    if (firstVisit) return { label: 'Setup done', pose: 'binoculars' as Pose, tint: colors.blush, color: colors.red, line: "Go live your life. I'll be watching." };
    if (over.length && over.length === rows.length)
      return { label: 'Fuming', pose: 'fuming' as Pose, tint: colors.blush, color: colors.red, line: 'Roasted on every app. Go outside. Seriously.' };
    if (over.length)
      return { label: 'Disgusted', pose: 'disgusted' as Pose, tint: colors.blush, color: colors.red, line: fill(pickRoast({ category: 'home_over', lang: roastLang, intensity, roaster, seed, vars: VARS, packageName: over[0].packageName, appLabel: over[0].label }) ?? "I'm not angry. I'm disappointed.", vars(over[0])) };
    if (close.length) {
      const pct = Math.round((close[0].used / close[0].limitMin) * 100);
      return { label: 'Suspicious', pose: 'eyesOnYou' as Pose, tint: colors.headsTint, color: colors.heads, line: fill(pickRoast({ category: 'home_close', lang: roastLang, intensity, roaster, seed, vars: VARS, packageName: close[0].packageName, appLabel: close[0].label }) ?? `${close[0].label}'s at ${pct}%. I see you.`, vars(close[0])) };
    }
    if (dayOne && total === 0) return { label: 'Day one', pose: 'notes' as Pose, tint: colors.headsTint, color: colors.heads, line: "I'm taking notes. Check back tonight." };
    return { label: 'Chill', pose: 'chill' as Pose, tint: colors.chillTint, color: colors.chill, line: fill(pickRoast({ category: 'home_under', lang: roastLang, intensity, roaster, seed, vars: VARS }) ?? 'Under every limit. Who are you?', vars(rows[0])) };
  })();

  const streakAtRisk = over.length > 0;
  // Under the total: say what matters. Never praise the total while an app is over its limit.
  const totalNote = killed
    ? 'Last known. I missed a few hours.'
    : over.length === 1
      ? `${fmt(over[0].used - over[0].limitMin)} over on ${over[0].label}.`
      : over.length > 1
        ? `${over.length} apps over their limit.`
        : comparison(total);
  const showTotal = !!tracked.length && !paused && !firstVisit && !(dayOne && total === 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={st.header}>
        <Wordmark width={100} />
        <View style={[st.streak, streakAtRisk && { backgroundColor: colors.red }]}>
          <FlameIcon color={streakAtRisk ? colors.white : colors.red} />
          <T v="bodyBold" style={{ fontSize: 13, color: streakAtRisk ? colors.white : colors.red }}>
            {streakAtRisk ? 'Streak at risk' : streakDays <= 1 ? 'Day 1' : `${streakDays}-day streak`}
          </T>
        </View>
      </View>

      {!hasUsageAccess ? (
        <View accessibilityRole="alert" style={st.banner}>
          <T v="bodyBold" style={{ flex: 1, color: colors.white, fontSize: 15 }}>I can&apos;t see anything. Did you turn me off?</T>
          <Pressable accessibilityRole="button" onPress={openUsageAccessSettings} style={st.bannerBtn}>
            <T v="bodyBold" style={{ fontSize: 14, color: colors.red }}>Fix it</T>
          </Pressable>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 16, gap: 16 }}>
        {/* Hero: the roaster is the star of this screen, so they get the space. */}
        <LinearGradient colors={[mood.tint, deeper(mood.tint)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
          <View style={st.heroChar} pointerEvents="none">
            <Character source={pose(roaster, mood.pose)} size={250} alt={`${roasterName[roaster]}, ${mood.label.toLowerCase()}`} />
          </View>
          <View style={st.heroText}>
            <View style={[st.moodPill, { backgroundColor: colors.white }]}>
              <View style={[st.moodDot, { backgroundColor: mood.color }]} />
              <T v="bodyBold" style={{ fontSize: 12, color: mood.color }}>{mood.label}</T>
            </View>
            <T v="bodyBold" style={{ fontSize: 20, lineHeight: 26 }}>{mood.line}</T>
          </View>
          {showTotal ? (
            <View style={st.heroTotal}>
              <T v="label" style={{ fontSize: 11, color: colors.ink, opacity: 0.6 }}>Today</T>
              <T style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: colors.ink }}>{fmt(total)}</T>
              <T v="caption" style={{ color: colors.ink, opacity: 0.7 }} numberOfLines={2}>{totalNote}</T>
            </View>
          ) : null}
        </LinearGradient>

        {gone ? (
          <View accessibilityRole="alert" style={st.toast}>
            <Avatar source={pose(roaster, 'impressed')} size={36} />
            <T v="bodyBold" style={{ flex: 1, fontSize: 14, color: colors.white }}>{gone}&apos;s gone. Bold move. Slot freed.</T>
            <Pressable accessibilityLabel="Dismiss" onPress={() => setGone(null)} hitSlop={8}>
              <CloseIcon color={colors.white} />
            </Pressable>
          </View>
        ) : null}

        {killed ? <KilledCard face={pose(roaster, 'asleep')} name={roasterName[roaster]} onClose={() => setKilled(false)} /> : null}

        {!tracked.length ? <Button label="Pick apps" onPress={() => router.push('/onboarding/pick-apps')} /> : null}
        {paused ? <Button label="Resume now" tone="outline" onPress={() => set({ pausedOn: undefined })} /> : null}

        {perfectYesterday && perfectSeen !== localDay() ? (
          <LinearGradient colors={gradients.proud} style={st.perfect}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Character source={pose(roaster, 'party')} size={64} alt={`${roasterName[roaster]}, setting off a party popper`} />
              <T v="label" style={{ flex: 1, fontSize: 12, color: '#8A4A20' }}>Yesterday · perfect day</T>
              <Pressable accessibilityLabel="Dismiss" onPress={() => set({ perfectSeen: localDay() })} hitSlop={8}>
                <CloseIcon color="#8A4A20" />
              </Pressable>
            </View>
            <T style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 27, color: colors.ink }}>All under limits. I&apos;m… proud? Weird feeling.</T>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                set({ perfectSeen: localDay() });
                Share.share({ message: 'Yesterday: every app under its limit. My screen-time app is proud of me. Weird. Get roasted too → endloop app' });
              }}
              style={st.shareBtn}>
              <T v="bodyBold" style={{ fontSize: 14, color: colors.white }}>Share it</T>
            </Pressable>
          </LinearGradient>
        ) : null}

        {!tracked.length || paused ? null : firstVisit ? (
          <View style={st.how}>
            <Pressable accessibilityLabel="Dismiss" onPress={() => set({ howItWorksDismissed: true })} style={st.dismiss} hitSlop={8}>
              <CloseIcon />
            </Pressable>
            <T v="bodyBold">Here&apos;s how it works</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                ['75%', 'Heads up', colors.heads],
                ['90%', 'Last call', colors.heads],
                ['100%', 'I take over', colors.red],
              ].map(([p, t, c]) => (
                <View key={p} style={st.howStep}>
                  <T style={{ fontFamily: fonts.display, fontSize: 20, color: c }}>{p}</T>
                  <T v="bodyBold" style={{ fontSize: 12, lineHeight: 16 }}>{t}</T>
                </View>
              ))}
            </View>
            <Button label="Test the roast" tone="outline" style={{ height: 44, borderRadius: 14 }} onPress={() => setDemo(true)} />
          </View>
        ) : dayOne && total === 0 ? (
          <View style={st.dayOne}>
            <T v="label" style={{ fontSize: 11 }}>Watching</T>
            <T v="bodyBold">{tracked.map((a) => a.label).join(', ').replace(/, ([^,]*)$/, ' and $1')}</T>
            <T v="caption" style={{ fontSize: 14, lineHeight: 20 }}>Your first numbers show up after you use them a little. Warnings at 75% and 90%, then I take over.</T>
          </View>
        ) : null}

        <View style={{ gap: 10, opacity: paused ? 0.5 : 1 }}>
          {rows.length ? <T v="label" style={{ paddingTop: 4 }}>Your apps</T> : null}
          {rows.map((r) => {
            const ss = stateStyle[r.state];
            return (
              <Pressable
                key={r.packageName}
                accessibilityRole="button"
                accessibilityLabel={`${r.label}, ${fmt(r.used)} of ${fmt(r.limitMin)}, ${ss.label}`}
                onPress={() => router.push(`/app/${encodeURIComponent(r.packageName)}`)}
                style={st.appCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <AppTile label={r.label} color={r.color} iconUri={r.iconUri} size={44} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="bodyBold" style={{ fontSize: 17 }}>{r.label}</T>
                    <T v="caption" style={{ fontSize: 14 }}>
                      <T v="caption" style={{ fontSize: 14, fontFamily: fonts.bold, color: colors.ink }}>{fmt(r.used)}</T> of {fmt(r.limitMin)}
                    </T>
                  </View>
                  <Pill text={ss.label} color={ss.color} bg={ss.tint} />
                </View>
                <View style={st.track}>
                  <View style={{ width: `${Math.max(2, Math.min(100, (r.used / r.limitMin) * 100))}%`, height: 8, borderRadius: 4, backgroundColor: ss.color }} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {tracked.length >= 3 ? (
          <Pressable accessibilityRole="button" onPress={() => setPremium(true)} style={st.upsell}>
            <T v="caption" style={{ flex: 1, fontSize: 14 }}>All 3 free apps in use</T>
            <T v="bodyBold" style={{ fontSize: 14, color: colors.red }}>Watch more →</T>
          </Pressable>
        ) : (
          <T v="caption" style={{ textAlign: 'center' }}>{tracked.length} of 3 free apps in use</T>
        )}
      </ScrollView>

      <PremiumSheet visible={premium} onClose={() => setPremium(false)} roaster={roaster} reason="apps" />
      <RoastDemo visible={demo} onClose={() => setDemo(false)} text={fill(pickRoast({ category: 'limit_hit', lang: roastLang, intensity, roaster, vars: ['app', 'time'], packageName: rows[0]?.packageName, appLabel: rows[0]?.label }) ?? 'Time.', { app: rows[0]?.label ?? 'Instagram', time: fmt(rows[0]?.used ?? 92) })} face={pose(roaster, 'savage')} />
    </SafeAreaView>
  );
}

/** Screen 16: the phone put the watcher to sleep. Brand-specific steps so it doesn't happen again. */
function KilledCard({ face, name, onClose }: { face: number; name: string; onClose: () => void }) {
  const steps = batterySteps();
  return (
    <View accessibilityRole="alert" style={st.killed}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar source={face} size={48} bg="#3A3A3A" />
        <T v="bodyBold" style={{ flex: 1, fontSize: 17, lineHeight: 22, color: colors.white }} accessibilityLabel={`${name}, asleep. Your phone put me to sleep. Let's stop that from happening again.`}>Your phone put me to sleep. Let&apos;s stop that from happening again.</T>
        <Pressable accessibilityLabel="Dismiss" onPress={onClose} hitSlop={8}>
          <CloseIcon color={colors.white} />
        </Pressable>
      </View>
      {steps ? (
        <>
          <T v="bodyBold" style={{ fontSize: 13, color: '#FFB38A' }}>On {steps.brand} phones:</T>
          {steps.steps.map((x, i) => (
            <T key={x} style={{ fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.85)' }}>{i + 1}. {x}</T>
          ))}
        </>
      ) : (
        <T style={{ fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.85)' }}>Set Endloop&apos;s battery use to Unrestricted so I stay awake.</T>
      )}
      <Pressable accessibilityRole="button" onPress={openBatterySettings} style={st.killedBtn}>
        <T v="bodyBold" style={{ fontSize: 15 }}>Open battery settings</T>
      </Pressable>
    </View>
  );
}

/** Preview of the roast overlay (the real one is native, Screen 9). */
function RoastDemo({ visible, onClose, text, face }: { visible: boolean; onClose: () => void; text: string; face: number }) {
  // A Modal is its own window: pad for the status and navigation bars explicitly.
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <LinearGradient colors={gradients.roasted} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 + insets.top, paddingBottom: 24 + insets.bottom, justifyContent: 'center', gap: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <Character source={face} size={220} alt="Loop" fadeTo="#C20F24" />
          </View>
          <T style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.white }}>{text}</T>
          <Button label="Close it" tone="white" onPress={onClose} />
          <T v="caption" style={{ color: colors.blush, textAlign: 'center' }}>This is a test. The real one shows up at 100%.</T>
        </View>
      </LinearGradient>
    </Modal>
  );
}

/** A slightly deeper shade of the mood tint, for the hero gradient. */
function deeper(tint: string): string {
  const map: Record<string, string> = { [colors.blush]: '#FFC9D0', [colors.headsTint]: '#FFDDA8', [colors.chillTint]: '#C4E8D7', '#EDEDED': '#D9D9D9' };
  return map[tint] ?? tint;
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.blush },
  banner: { marginHorizontal: 24, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.red, borderRadius: 16, paddingVertical: 12, paddingLeft: 16, paddingRight: 12 },
  bannerBtn: { height: 38, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.white, justifyContent: 'center' },
  hero: { borderRadius: 28, overflow: 'hidden', minHeight: 270, padding: 20, justifyContent: 'space-between' },
  heroChar: { position: 'absolute', right: -58, bottom: 0 },
  heroText: { width: '50%', gap: 12 },
  heroTotal: { width: '46%', gap: 2, paddingTop: 16 },
  moodPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: 999 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  how: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 16, gap: 10 },
  dismiss: { position: 'absolute', right: 12, top: 12, zIndex: 1 },
  howStep: { flex: 1, gap: 4, padding: 10, borderRadius: 14, backgroundColor: colors.white },
  appCard: { gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surface },
  upsell: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.surface },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.ink },
  killed: { gap: 10, padding: 16, borderRadius: 18, backgroundColor: colors.ink },
  killedBtn: { height: 44, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  perfect: { gap: 12, padding: 18, borderRadius: 22 },
  shareBtn: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.ink, justifyContent: 'center' },
  dayOne: { gap: 6, padding: 16, borderRadius: 20, backgroundColor: colors.surface },
});
