/**
 * Attendance moments (canvas "Attendance v2" D–F): the first-visit walkthrough, the Streak saver
 * catch and the milestone celebration. Full-screen modals so they sit over the tab bar.
 */
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pose, roasterName, type Pose, type Roaster } from '@/characters';
import { CloseIcon, FlameIcon } from '@/components/icons';
import { btn, FadedPose, SpotlightScreen } from '@/components/onboarding-ui';
import { Button, Character, LinkButton, T } from '@/components/ui';
import { colors, fonts } from '@/theme/tokens';

/* ---------- AT2-D: first visit ---------- */

const STEPS = [
  { title: 'Streaks.', body: "Every day all your apps stay under, you're present." },
  { title: 'Loops.', body: 'Up to 40 a day when your apps stay under. They clear every Sunday midnight.' },
  { title: 'Your chips.', body: 'Streak, Loops and leaves, always on Today. Tap them to come here.' },
];

export function AttendanceIntro({ visible, roaster, onDone }: { visible: boolean; roaster: Roaster; onDone: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDone}>
      <View style={st.dim}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }} edges={['top', 'bottom']}>
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {STEPS.map((s, i) => (
              <Animated.View key={s.title} entering={FadeInDown.delay(250 + i * 450).duration(350)} style={st.callout}>
                <View style={st.num}>
                  <T style={{ fontFamily: fonts.display, fontSize: 14, color: colors.white }}>{i + 1}</T>
                </View>
                <T style={{ flex: 1, fontSize: 15, lineHeight: 21, color: colors.ink }}>
                  <T v="bodyBold" style={{ fontSize: 15, color: colors.ink }}>{s.title} </T>
                  {s.body}
                </T>
              </Animated.View>
            ))}
            <Animated.View entering={FadeIn.delay(1700).duration(400)} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
              <Character source={pose(roaster, 'drumroll')} size={120} alt={`${roasterName[roaster]} with a drumroll`} />
              <View style={[st.callout, { flex: 1, marginBottom: 18 }]}>
                <T v="bodyBold" style={{ flex: 1, fontSize: 15, lineHeight: 21, color: colors.ink }}>200 Loops = a Leave Letter. A real day off. I sign it.</T>
              </View>
            </Animated.View>
            <Button label="Got it. Start earning" style={[btn, { marginTop: 4, marginBottom: 12 }]} onPress={onDone} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/* ---------- AT2-E: Streak saver caught it ---------- */

export function SaverMoment({ visible, roaster, streak, saversLeft, detail, onClose }: { visible: boolean; roaster: Roaster; streak: number; saversLeft: number; detail: string; onClose: () => void }) {
  useEffect(() => {
    if (visible) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [visible]);
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <SpotlightScreen loopY={0.32}>
        <View style={st.topRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10} style={st.round}>
            <CloseIcon color={colors.white} size={18} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 24 }}>
          <Animated.View entering={ZoomIn.springify().damping(12)}>
            <FadedPose source={pose(roaster, 'lifebuoy')} size={270} alt={`${roasterName[roaster]} throwing you a lifebuoy`} />
          </Animated.View>
          <View style={st.tag}>
            <T v="bodyBold" style={{ fontSize: 11, letterSpacing: 1.2, color: colors.white }}>STREAK SAVER USED</T>
          </View>
          <T style={{ marginTop: 12, fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.white, textAlign: 'center' }}>Streak saved. Barely.</T>
          <T style={{ marginTop: 10, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.88)', textAlign: 'center' }}>{detail}</T>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' }}>
            <View style={st.stat}>
              <T v="label" style={st.statLabel}>Streak</T>
              <T style={st.statValue}>{streak} {streak === 1 ? 'day' : 'days'}</T>
            </View>
            <View style={st.stat}>
              <T v="label" style={st.statLabel}>Savers left</T>
              <T style={st.statValue}>{saversLeft}</T>
            </View>
          </View>
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <Button label="Don't make me do that again" tone="white" style={btn} onPress={onClose} />
        </View>
      </SpotlightScreen>
    </Modal>
  );
}

/* ---------- AT2-F: milestone ---------- */

export const MILESTONE_MOMENT: Record<number, { pose: Pose; line: string; alt: string }> = {
  3: { pose: 'thumbsUp', line: 'Three days. Could be luck. Prove me wrong.', alt: 'thumbs up, unconvinced' },
  7: { pose: 'rareSmile', line: "A whole week. I'm smiling. Don't tell anyone.", alt: 'smiling, a bit embarrassed about it' },
  14: { pose: 'highFive', line: "Two weeks. I've stopped checking on you. Mostly.", alt: 'going for a high five' },
  30: { pose: 'party', line: 'Thirty days. You earned a Streak saver. I earned a rest.', alt: 'celebrating' },
  100: { pose: 'crown', line: "A hundred days. I'm out of roasts. For now.", alt: 'wearing a crown' },
};

const CONFETTI = ['#E5132B', '#141414', '#16895F', '#E8A317'];

export function MilestoneMoment({ visible, roaster, days, onShare, onClose }: { visible: boolean; roaster: Roaster; days: number; onShare: () => void; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const m = MILESTONE_MOMENT[days] ?? MILESTONE_MOMENT[7];
  const pop = useSharedValue(0.4);
  useEffect(() => {
    if (!visible) return;
    pop.value = 0.4;
    pop.value = withDelay(150, withSpring(1, { damping: 7, stiffness: 140 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [visible, pop]);
  const big = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }], opacity: pop.value > 0.5 ? 1 : 0 }));
  // A fixed scatter (no randomness, so it doesn't jump between renders).
  const bits = Array.from({ length: 22 }, (_, i) => ({ x: ((i * 73) % 100) / 100, y: ((i * 41) % 60) / 100, r: (i * 37) % 180, c: CONFETTI[i % 4] }));
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#FFF4EA' }}>
        <LinearGradient colors={['#FFFFFF', '#FFF1E6', '#FFE2CF']} style={StyleSheet.absoluteFill} />
        {bits.map((b, i) => (
          <Animated.View key={i} entering={FadeIn.delay(200 + i * 25)} style={{ position: 'absolute', left: b.x * width, top: 70 + b.y * 520, width: 6, height: 14, borderRadius: 2, backgroundColor: b.c, transform: [{ rotate: `${b.r}deg` }] }} />
        ))}
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={st.topRow}>
            <View style={[st.tag, { backgroundColor: colors.blush, marginTop: 0 }]}>
              <FlameIcon size={12} />
              <T v="bodyBold" style={{ fontSize: 12, color: colors.red }}>All apps streak</T>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10} style={[st.round, { backgroundColor: 'transparent' }]}>
              <CloseIcon color={colors.ink} size={18} />
            </Pressable>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Animated.View style={big}>
              <T style={{ fontFamily: fonts.display, fontSize: days >= 100 ? 120 : 150, lineHeight: days >= 100 ? 130 : 160, color: colors.red }}>{days}</T>
            </Animated.View>
            <T style={{ marginTop: -10, fontFamily: fonts.display, fontSize: 30, color: colors.ink }}>days present.</T>
            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
              <Character source={pose(roaster, m.pose)} size={250} alt={`${roasterName[roaster]}, ${m.alt}`} />
              <Animated.View entering={FadeInDown.delay(700)} style={st.bubble}>
                <T v="bodyBold" style={{ fontSize: 15, lineHeight: 21, color: colors.white, textAlign: 'center' }}>{m.line}</T>
              </Animated.View>
            </View>
          </View>
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12, alignItems: 'center', gap: 2 }}>
            <Button label={`Share my ${days} days`} style={[btn, { alignSelf: 'stretch' }]} onPress={onShare} />
            <LinkButton label="Keep going" onPress={onClose} color={colors.ink} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(10,10,12,0.72)' },
  callout: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.white },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, minHeight: 52 },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, height: 28, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  stat: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.22)', gap: 2 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  statValue: { fontFamily: fonts.display, fontSize: 24, color: colors.white },
  bubble: { marginTop: -8, maxWidth: 300, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 18, backgroundColor: colors.ink },
});
