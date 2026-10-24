/**
 * Shared pieces of the snooze ladder (canvas Screen 23): the arcade background, the game header,
 * the roaster's heckle bubble, the countdown ring and the step dots.
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Wordmark } from '@/brand/logo';
import { StarIcon } from '@/components/icons';
import { RedStatusBar } from '@/components/onboarding-ui';
import { Avatar, T } from '@/components/ui';
import { colors, fonts } from '@/theme/tokens';

export const W80 = 'rgba(255,255,255,0.82)';
export const GOLD = '#FFD27A';
export const LADDER_STEPS = 5;

/** Dark arcade background with red light from the top (canvas ARCADE_BG). */
export function ArcadeScreen({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={{ flex: 1, backgroundColor: '#14020A' }}>
      <LinearGradient colors={['#2A050B', '#14020A']} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="aTop" cx="50%" cy="8%" rx="80%" ry="40%">
            <Stop offset="0" stopColor="#E5132B" stopOpacity={0.75} />
            <Stop offset="1" stopColor="#E5132B" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="aBottom" cx="50%" cy="100%" rx="70%" ry="30%">
            <Stop offset="0" stopColor="#E5132B" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#E5132B" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#aTop)" />
        <Rect width={width} height={height} fill="url(#aBottom)" />
      </Svg>
      <RedStatusBar />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/** Five dashes: which snooze this is today. */
export function LadderDots({ step }: { step: number }) {
  return (
    <View accessibilityLabel={`Snooze ${Math.min(step, LADDER_STEPS)} of ${LADDER_STEPS}`} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: LADDER_STEPS }, (_, i) => (
        <View key={i} style={{ width: i + 1 === Math.min(step, LADDER_STEPS) ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i < step ? colors.white : 'rgba(255,255,255,0.3)' }} />
      ))}
    </View>
  );
}

export function TopBar({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 }}>
      <Wordmark width={88} variant="white" />
      <LadderDots step={step} />
    </View>
  );
}

/** "CATCH LOOP": a solid word and an outlined one (outline drawn as a stroke-coloured shadow stack). */
export function GameTitle({ eyebrow, a, b, stake }: { eyebrow: string; a: string; b: string; stake: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 6, paddingTop: 14, paddingHorizontal: 20 }}>
      <T v="bodyBold" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: W80 }}>{eyebrow}</T>
      <View accessible accessibilityRole="header" accessibilityLabel={`${a} ${b}`} style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
        <T style={st.title}>{a}</T>
        <T style={[st.title, st.outline]}>{b}</T>
      </View>
      <View style={st.stake}>
        <StarIcon size={12} color={GOLD} />
        <T v="bodyBold" style={{ fontSize: 12, color: GOLD }}>{stake}</T>
      </View>
    </View>
  );
}

/** The roaster's heckle, bottom of the game. */
export function Heckle({ face, text }: { face: number; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 22 }}>
      <Avatar source={face} size={46} bg={colors.blush} />
      <View style={st.bubble}>
        <T v="bodyBold" style={{ fontSize: 14, lineHeight: 19, color: colors.ink }}>{text}</T>
      </View>
    </View>
  );
}

export function GiveUp({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ alignSelf: 'center', paddingTop: 12, paddingBottom: 14, paddingHorizontal: 8 }}>
      <T v="bodyBold" style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', textDecorationLine: 'underline' }}>{label}</T>
    </Pressable>
  );
}

/** A stat column in the game HUD. */
export function Hud({ label, value, color = colors.white, align = 'flex-start' }: { label: string; value: string; color?: string; align?: 'flex-start' | 'center' | 'flex-end' }) {
  return (
    <View style={{ alignItems: align, gap: 4 }}>
      <T v="bodyBold" style={{ fontSize: 11, letterSpacing: 1, color: W80 }}>{label}</T>
      <T style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color }}>{value}</T>
    </View>
  );
}

/** Countdown ring: `left` of `total` seconds, the label inside. */
export function Ring({ left, total, size = 170, label, sub }: { left: number; total: number; size?: number; label: string; sub?: string }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  return (
    <View accessible accessibilityRole="timer" accessibilityLabel={`${label} ${sub ?? ''}`} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.white}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <T style={{ fontFamily: fonts.display, fontSize: size * 0.24, lineHeight: size * 0.28, color: colors.white }}>{label}</T>
      {sub ? <T v="bodyBold" style={{ fontSize: 12, color: W80 }}>{sub}</T> : null}
    </View>
  );
}

/** m:ss */
export const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;

const st = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 42, lineHeight: 46, color: colors.white, letterSpacing: -0.5 },
  outline: { color: '#2A050B', textShadowColor: colors.white, textShadowRadius: 1.5, textShadowOffset: { width: 0, height: 0 } },
  stake: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(232,163,23,0.18)' },
  bubble: { flexShrink: 1, backgroundColor: colors.white, borderRadius: 18, borderBottomLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 14 },
});
