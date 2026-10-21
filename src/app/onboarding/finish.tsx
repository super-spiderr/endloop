import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { pose, type Pose } from '@/characters';
import { btn, FadedPose, SpotlightScreen, StepBar, RedStatusBar } from '@/components/onboarding-ui';
import { Button, T } from '@/components/ui';
import { OB, say } from '@/content/onboarding';
import { fmtLimit } from '@/lib/time';
import { localDay, useSettings, type Intensity } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

const WELCOME_LOOPS = 100;
const WELCOME_LEAVES = 2;
const TEST_POSE: Record<Intensity, Pose> = { polite: 'polite', honest: 'honest', savage: 'savage', unhinged: 'evilGrin' };
const MUTED = 'rgba(255,255,255,0.8)';

/** Onboarding v2 · Step 8: a test roast (in-app, the real look), then the welcome bonus → Today. */
export default function Finish() {
  const { roaster, roastLang: lang, intensity, tracked, name, set } = useSettings();
  const [phase, setPhase] = useState<'test' | 'bonus'>('test');
  const top = [...tracked].sort((a, b) => b.weekMin - a.weekMin)[0];
  const app = top?.label ?? 'your apps';
  const line =
    intensity === 'polite' ? OB.testPolite : intensity === 'honest' ? OB.testHonest : OB.testSavage;
  const roast = say(line, lang, { app, name: name ?? '' }, say(line, lang, { app, name: 'boss' }));

  useEffect(() => {
    if (phase === 'test') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [phase]);

  const start = () => {
    set({ onboarded: true, streakDays: 1, startedAt: localDay(), welcomeBonus: { loops: WELCOME_LOOPS, leaves: WELCOME_LEAVES, on: localDay() } });
    router.replace('/today');
  };

  if (phase === 'test') {
    return (
      <SpotlightScreen loopY={0.34}>
        <RedStatusBar />
        <StepBar step={8} dark />
        <Animated.View entering={FadeIn} style={{ flex: 1 }}>
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <View style={st.chip}>
              <T style={{ fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.white }}>Test roast · this one&apos;s free</T>
            </View>
          </View>
          <Animated.View entering={ZoomIn.duration(350)} style={{ alignItems: 'center', marginTop: 6 }}>
            <FadedPose source={pose(roaster, TEST_POSE[intensity])} size={320} alt="Roasting you" />
          </Animated.View>
          <View style={{ paddingHorizontal: 28, gap: 10 }}>
            <T style={{ fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED }}>Time&apos;s up</T>
            <T accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 31, color: colors.white }}>
              {roast}
            </T>
            {top ? <T style={{ fontSize: 14, color: MUTED }}>{`${top.label} · limit ${fmtLimit(top.limitMin)} · test run`}</T> : null}
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 12, alignItems: 'center' }}>
            <Button label="Fine. Close it." tone="white" style={btn} onPress={() => setPhase('bonus')} />
            <T style={{ fontSize: 12, color: MUTED, textAlign: 'center' }}>The real one also lets you snooze. It&apos;ll cost you.</T>
          </View>
        </Animated.View>
      </SpotlightScreen>
    );
  }

  return (
    <SpotlightScreen loopY={0.3}>
      <RedStatusBar />
      <StepBar step={8} dark />
      <Animated.View entering={FadeIn} style={{ flex: 1 }}>
        <T style={{ textAlign: 'center', marginTop: 16, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED }}>Welcome bonus</T>
        <View style={{ alignItems: 'center' }}>
          <FadedPose source={pose(roaster, 'party')} size={280} alt="Celebrating" />
        </View>
        <T style={{ marginHorizontal: 32, marginTop: -6, fontFamily: fonts.medium, fontStyle: 'italic', fontSize: 15, lineHeight: 21, color: colors.white, textAlign: 'center' }}>
          “{say(OB.bonus, lang, { name: name ?? '' }, say(OB.bonus, lang, { name: 'boss' }))}”
        </T>
        <Animated.View entering={FadeInDown.delay(200)} style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 24, paddingTop: 18 }}>
          <Tile big={String(WELCOME_LOOPS)} small="Loops" icon={<Coin />} />
          <Tile big={String(WELCOME_LEAVES)} small="Leaves" icon={<Letter />} />
        </Animated.View>
        <T style={{ marginHorizontal: 28, marginTop: 16, fontSize: 13, lineHeight: 20, color: MUTED, textAlign: 'center' }}>
          Stay under your limits to earn more Loops. <T style={{ fontFamily: fonts.bold, color: colors.white }}>200 Loops = a Leave Letter</T>: a whole day with no roasts. Short of 200 by your first Sunday? Your Loops carry over, this once.
        </T>
        <View style={{ flex: 1 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <Button label="Day 1 starts now" tone="white" style={btn} onPress={start} />
        </View>
      </Animated.View>
    </SpotlightScreen>
  );
}

function Tile({ big, small, icon }: { big: string; small: string; icon: React.ReactNode }) {
  return (
    <View accessible accessibilityLabel={`${big} ${small}`} style={st.tile}>
      {icon}
      <T style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 34, color: colors.white }}>{big}</T>
      <T style={{ fontFamily: fonts.bold, fontSize: 12, color: MUTED }}>{small}</T>
    </View>
  );
}

const Coin = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={10} fill="#FFC94D" />
    <Circle cx={12} cy={12} r={6.5} fill="none" stroke="#FFFFFF" strokeWidth={2} />
  </Svg>
);
const Letter = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round">
    <Rect x={5} y={3} width={14} height={18} rx={2} fill="rgba(255,255,255,0.2)" />
    <Path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" />
  </Svg>
);

const st = StyleSheet.create({
  chip: { height: 26, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center' },
  tile: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
});
