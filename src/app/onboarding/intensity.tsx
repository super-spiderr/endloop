import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { LoopMark } from '@/brand/logo';
import { pose, type Pose } from '@/characters';
import { ChilliIcon, LockIcon, StarIcon } from '@/components/icons';
import { btn, FadedPose, Heading, NudgeSheet, PremiumTag, RedStatusBar, StepBar } from '@/components/onboarding-ui';
import { Avatar, Button, T } from '@/components/ui';
import { OB, say } from '@/content/onboarding';
import { fmt } from '@/lib/time';
import { useSettings, type Intensity } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

const LEVELS: { key: Intensity; label: string; heat: number }[] = [
  { key: 'polite', label: 'Polite', heat: 1 },
  { key: 'honest', label: 'Honest', heat: 2 },
  { key: 'savage', label: 'Savage', heat: 3 },
  { key: 'unhinged', label: 'Unhinged', heat: 3 },
];
const POSE: Record<Intensity, Pose> = { polite: 'polite', honest: 'honest', savage: 'savage', unhinged: 'evilGrin' };
const NOTE: Record<Intensity, string> = {
  polite: 'Gentle nudges. I still notice everything.',
  honest: 'Plain facts about your scrolling. No sugar.',
  savage: 'No mercy. About the habit, never about you.',
  unhinged: 'No filter, no mercy. Still never about looks or family.',
};

const GOLD = '#E8A317';
const GOLD_HI = '#F5C451';
const ON_GOLD = '#1A1008';

/** The screen's look follows the level: white for Polite and Honest, red for Savage, black and gold for Unhinged. */
type Look = {
  bg: readonly [string, string, ...string[]];
  light: boolean;
  ink: string;
  muted: string;
  stageBg: string;
  stageBorder: string;
  glow: string;
  loop: string;
  accent: string;
  label: string;
  meterOn: string;
  meterOff: string;
  card: { bg: string; border: string; ink: string; chilli: string };
  cardOn: { bg: string; ink: string; chilli: string };
  bubble: { bg: string; border: string; label: string };
  avatarBg: string;
};

const WHITE: Look = {
  bg: ['#FFFFFF', '#FFFFFF'],
  light: false,
  ink: colors.ink,
  muted: colors.muted,
  stageBg: '#FFF4F5',
  stageBorder: '#F6DDE0',
  glow: '#FFC7CF',
  loop: 'rgba(229,19,43,0.08)',
  accent: colors.red,
  label: '#8C2030',
  meterOn: colors.red,
  meterOff: '#F3C9CF',
  card: { bg: colors.white, border: '#EDE3E4', ink: colors.ink, chilli: colors.red },
  cardOn: { bg: colors.red, ink: colors.white, chilli: colors.white },
  bubble: { bg: '#141414', border: '#141414', label: '#FF8C99' },
  avatarBg: colors.blush,
};
const RED: Look = {
  bg: ['#F0263D', '#C20F24', '#7A0714'],
  light: true,
  ink: colors.white,
  muted: 'rgba(255,255,255,0.82)',
  stageBg: 'rgba(255,255,255,0.12)',
  stageBorder: 'rgba(255,255,255,0.3)',
  glow: '#FF8C78',
  loop: 'rgba(255,255,255,0.1)',
  accent: colors.white,
  label: 'rgba(255,255,255,0.85)',
  meterOn: colors.white,
  meterOff: 'rgba(255,255,255,0.3)',
  card: { bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.32)', ink: colors.white, chilli: colors.white },
  cardOn: { bg: colors.white, ink: colors.red, chilli: colors.red },
  bubble: { bg: 'rgba(61,4,13,0.55)', border: 'rgba(255,255,255,0.18)', label: '#FFD3D9' },
  avatarBg: 'rgba(255,255,255,0.22)',
};
const GOLDEN: Look = {
  bg: ['#1A0E10', '#120A0B', '#0B0607'],
  light: true,
  ink: colors.white,
  muted: 'rgba(255,255,255,0.72)',
  stageBg: '#1C1113',
  stageBorder: 'rgba(245,196,81,0.45)',
  glow: '#E8A317',
  loop: 'rgba(245,196,81,0.08)',
  accent: GOLD_HI,
  label: 'rgba(245,196,81,0.85)',
  meterOn: GOLD_HI,
  meterOff: 'rgba(245,196,81,0.2)',
  card: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(245,196,81,0.28)', ink: colors.white, chilli: GOLD_HI },
  cardOn: { bg: GOLD, ink: ON_GOLD, chilli: ON_GOLD },
  bubble: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(245,196,81,0.3)', label: GOLD_HI },
  avatarBg: '#2A1A1C',
};
const lookOf = (i: Intensity): Look => (i === 'unhinged' ? GOLDEN : i === 'savage' ? RED : WHITE);

/** Onboarding v2 · Step 6a: roast level, with a preview from the user's own numbers. Unhinged is Premium only, never for school. */
export default function IntensityScreen() {
  const { roaster, roastLang: lang, intensity, tracked, hasUsageAccess, group, premium, set } = useSettings();
  const [unhinged, setUnhinged] = useState(false);
  const [schoolNote, setSchoolNote] = useState(false);
  const school = group === 'school';
  const canUnhinged = premium && !school;
  const look = lookOf(intensity);
  const level = LEVELS.find((l) => l.key === intensity) ?? LEVELS[1];
  const levelIdx = LEVELS.indexOf(level);

  const top = [...tracked].sort((a, b) => b.weekMin - a.weekMin)[0];
  const preview = hasUsageAccess && top?.weekMin ? say(OB.preview[intensity], lang, { week_time: fmt(top.weekMin), app: top.label }) : say(OB.previewNoAccess, lang);

  const pick = (k: Intensity) => {
    if (k === 'unhinged' && !canUnhinged) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      if (school) setSchoolNote(true);
      else setUnhinged(true);
      return;
    }
    if (k === 'unhinged' || k === 'savage') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else Haptics.selectionAsync();
    set({ intensity: k });
  };

  return (
    <View style={{ flex: 1, backgroundColor: look.bg[look.bg.length - 1] }}>
      <Animated.View key={`bg-${intensity === 'polite' ? 'honest' : intensity}`} entering={FadeIn.duration(280)} style={StyleSheet.absoluteFill}>
        <LinearGradient colors={look.bg} style={StyleSheet.absoluteFill} />
        {intensity === 'unhinged' ? <TopGlow color={GOLD} /> : null}
      </Animated.View>
      <RedStatusBar light={look.light} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <StepBar step={6} dark={look.light} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 8, alignItems: 'flex-start' }}>
            {premium ? <PremiumTag /> : null}
            <Heading title={say(premium ? OB.levelTitlePremium : OB.levelTitle, lang)} sub="Change it any time in Settings." light={look.light} />
          </View>

          {/* The stage: level name, heat meter and the roaster, big. */}
          <View style={[st.stage, { backgroundColor: look.stageBg, borderColor: look.stageBorder }]}>
            <StageGlow color={look.glow} />
            <View pointerEvents="none" style={st.stageLoop}>
              <LoopMark size={360} color={look.loop} strokeWidth={30} />
            </View>
            <Animated.View key={`name-${intensity}`} entering={FadeIn.duration(220)} style={st.stageText}>
              <T style={[st.eyebrow, { color: look.label }]}>Heat level</T>
              <T style={[st.levelName, { color: look.accent }]}>{level.label}</T>
              <View style={{ flexDirection: 'row', height: 16, alignItems: 'center' }}>
                {intensity === 'unhinged' ? <StarIcon size={15} color={GOLD_HI} /> : null}
                {Array.from({ length: level.heat }, (_, i) => (
                  <ChilliIcon key={i} size={15} color={intensity === 'unhinged' ? '#FF5A4E' : look.accent} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 4, width: 132 }}>
                {LEVELS.map((l, i) =>
                  i === 3 && !canUnhinged && i > levelIdx ? (
                    <View key={l.key} style={[st.seg, { borderWidth: 1.5, borderStyle: 'dashed', borderColor: school ? look.meterOff : GOLD }]} />
                  ) : (
                    <View key={l.key} style={[st.seg, { backgroundColor: i <= levelIdx ? look.meterOn : look.meterOff }]} />
                  ),
                )}
              </View>
              <T style={{ width: 150, fontSize: 12, lineHeight: 16, color: look.muted }}>{NOTE[intensity]}</T>
            </Animated.View>
            <Animated.View key={`pose-${intensity}-${schoolNote}`} entering={FadeIn.duration(220)} style={st.stagePose}>
              <FadedPose source={pose(roaster, school && schoolNote ? 'fingerWag' : POSE[intensity])} size={236} alt={`${level.label} pose`} />
            </Animated.View>
          </View>

          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingTop: 14 }}>
            {LEVELS.map((l) => {
              const on = l.key === intensity;
              if (l.key === 'unhinged' && !canUnhinged) {
                const lockInk = school ? look.muted : look.light ? '#FFD27A' : '#8A5A00';
                return (
                  <Pressable
                    key={l.key}
                    accessibilityRole="button"
                    accessibilityLabel={school ? 'Unhinged, locked' : 'Unhinged, Premium'}
                    onPress={() => pick(l.key)}
                    style={[
                      st.level,
                      { borderStyle: 'dashed', borderWidth: 1.5 },
                      school
                        ? { borderColor: look.light ? 'rgba(255,255,255,0.35)' : '#CFC7C8', backgroundColor: 'transparent' }
                        : { borderColor: look.light ? 'rgba(255,210,122,0.8)' : '#E8C66B', backgroundColor: look.light ? 'rgba(255,210,122,0.12)' : '#FFFBF0' },
                    ]}>
                    <LockIcon size={13} color={lockInk} />
                    <T style={[st.levelText, { color: look.ink }]}>Unhinged</T>
                    <T style={{ fontFamily: fonts.bold, fontSize: 10, color: lockInk }}>{school ? 'LOCKED' : '★ PREMIUM'}</T>
                  </Pressable>
                );
              }
              const c = on ? look.cardOn : look.card;
              return (
                <Pressable
                  key={l.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => pick(l.key)}
                  style={[st.level, { backgroundColor: c.bg, borderColor: on ? c.bg : look.card.border }, on && st.levelOn]}>
                  <View style={{ flexDirection: 'row', height: 14, alignItems: 'center' }}>
                    {l.key === 'unhinged' ? <StarIcon size={12} color={on ? ON_GOLD : GOLD} /> : null}
                    {Array.from({ length: l.heat }, (_, i) => (
                      <ChilliIcon key={i} size={12} color={c.chilli} />
                    ))}
                  </View>
                  <T style={[st.levelText, { color: c.ink }]}>{l.label}</T>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginHorizontal: 24, marginTop: 14 }}>
            <Avatar source={pose(roaster, 'idle')} size={40} bg={look.avatarBg} />
            <View style={[st.bubble, { backgroundColor: look.bubble.bg, borderColor: look.bubble.border }]}>
              <T style={[st.eyebrow, { fontSize: 10, color: look.bubble.label }]}>Your first roast</T>
              <T style={{ fontFamily: fonts.display, fontSize: 15, lineHeight: 20, color: colors.white }}>{preview}</T>
            </View>
          </View>

          {schoolNote ? (
            <View accessibilityRole="alert" style={[st.note, { backgroundColor: look.light ? 'rgba(0,0,0,0.22)' : '#F2F0F0' }]}>
              <LockIcon size={12} color={look.muted} />
              <T style={{ flex: 1, fontSize: 13, lineHeight: 18, color: look.ink }}>{say(OB.school, lang)}</T>
            </View>
          ) : null}

          <View style={{ flex: 1, minHeight: 16 }} />
          <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            {intensity === 'unhinged' ? (
              <GoldButton label="Roast me like that" onPress={() => router.push('/onboarding/goal')} />
            ) : (
              <Button label="Roast me like that" tone={look.light ? 'white' : 'red'} style={btn} onPress={() => router.push('/onboarding/goal')} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <NudgeSheet
        visible={unhinged}
        onClose={() => setUnhinged(false)}
        face={pose(roaster, 'evilGrin')}
        title={say(OB.unhingedTitle, lang)}
        body={say(OB.unhingedBody, lang)}
        onSeePremium={() => {
          setUnhinged(false);
          router.push('/paywall?reason=unhinged');
        }}
      />
    </View>
  );
}

/** Soft light behind the roaster, low on the right of the stage. */
function StageGlow({ color }: { color: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="stageGlow" cx="68%" cy="78%" rx="55%" ry="55%">
          <Stop offset="0" stopColor={color} stopOpacity={0.75} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#stageGlow)" />
    </Svg>
  );
}

/** Gold light from the top of the screen (Unhinged). */
function TopGlow({ color }: { color: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="topGlow" cx="50%" cy="0%" rx="90%" ry="40%">
          <Stop offset="0" stopColor={color} stopOpacity={0.24} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#topGlow)" />
    </Svg>
  );
}

function GoldButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [st.goldBtn, { opacity: pressed ? 0.85 : 1 }]}>
      <LinearGradient colors={[GOLD_HI, GOLD]} style={StyleSheet.absoluteFill} />
      <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: ON_GOLD }}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  stage: { height: 300, marginHorizontal: 24, marginTop: 14, borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  stageLoop: { position: 'absolute', left: 20, top: 70, transform: [{ rotate: '-14deg' }] },
  stageText: { position: 'absolute', left: 20, top: 20, gap: 8, zIndex: 1 },
  stagePose: { position: 'absolute', right: -16, bottom: 0 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  levelName: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48 },
  seg: { flex: 1, height: 8, borderRadius: 4 },
  level: { flex: 1, height: 76, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 2, borderRadius: 16, borderWidth: 1 },
  levelOn: { elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  levelText: { fontFamily: fonts.bold, fontSize: 13 },
  bubble: { flex: 1, gap: 5, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderTopLeftRadius: 4, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginTop: 10, padding: 12, borderRadius: 12 },
  goldBtn: { height: 54, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
