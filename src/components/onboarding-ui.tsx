/** Shared pieces for onboarding v2 (designs: canvas "Onboarding v2", docs/handoff/09-onboarding-v2.md). */
import type { ReactNode } from 'react';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Image as SvgImage, LinearGradient as SvgLinear, Mask, RadialGradient, Rect, Stop } from 'react-native-svg';

import { LoopMark } from '@/brand/logo';
import { colors, fonts } from '@/theme/tokens';

import { Avatar, BrandBar, Button, Character, LinkButton, Sheet, T } from './ui';

export const OB_STEPS = 8;
export const btn = { height: 54, borderRadius: 16 } as const;

/**
 * Light status bar icons for red screens. Stack screens stay mounted under the next one, so this
 * turns dark when the screen loses focus; otherwise white screens pushed on top inherit white icons.
 */
export function RedStatusBar({ light = true }: { light?: boolean }) {
  const focused = useIsFocused();
  return <StatusBar style={focused && light ? 'light' : 'dark'} />;
}

/**
 * The red onboarding background (canvas "OB2-BG-3-Motif" loop): deep maroon, red light from the top
 * and one big faint infinity loop, centred at `loopY` (0..1 of the height), bleeding off both sides.
 */
export function SpotlightScreen({ children, loopY = 0.45, loop: showLoop = true }: { children: ReactNode; loopY?: number; loop?: boolean }) {
  const { width, height } = useWindowDimensions();
  // The mark's loop fills ~72% of its box; this makes the loop itself ~1.7x the screen width.
  const loop = width * 2.33;
  return (
    <View style={{ flex: 1, backgroundColor: '#5C0714', overflow: 'hidden' }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgLinear id="base" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7A0A1A" />
            <Stop offset="0.6" stopColor="#5C0714" />
            <Stop offset="1" stopColor="#3D040D" />
          </SvgLinear>
          <RadialGradient id="top" cx="50%" cy="0%" rx="60%" ry="30%">
            <Stop offset="0" stopColor="#E5132B" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#E5132B" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#base)" />
        <Rect width={width} height={height} fill="url(#top)" />
      </Svg>
      {showLoop ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: (width - loop) / 2, top: height * loopY - loop / 2, opacity: 0.1, transform: [{ rotate: '-14deg' }] }}
        >
          <LoopMark size={loop} color={colors.white} strokeWidth={30} />
        </View>
      ) : null}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

export function StepBar({ step, dark = false }: { step: number; dark?: boolean }) {
  return <BrandBar step={step} total={OB_STEPS} dark={dark} />;
}

/** Small grey uppercase section label. */
export function Label({ children, extra, light = false }: { children: string; extra?: string; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
      <T style={{ fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: light ? 'rgba(255,255,255,0.78)' : colors.muted }}>{children}</T>
      {extra ? <T style={{ fontFamily: fonts.medium, fontSize: 11, color: light ? 'rgba(255,255,255,0.6)' : '#8A8A8A' }}>{extra}</T> : null}
    </View>
  );
}

/** Title (a roaster line, so it may be Tanglish) + grey subtitle. */
export function Heading({ title, sub, light = false, size = 22, center = false }: { title: string; sub?: string; light?: boolean; size?: number; center?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <T accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.2, color: light ? colors.white : colors.ink, textAlign: center ? 'center' : 'left' }}>
        {title}
      </T>
      {sub ? <T style={{ fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: light ? 'rgba(255,255,255,0.78)' : colors.muted, textAlign: center ? 'center' : 'left' }}>{sub}</T> : null}
    </View>
  );
}

/** The roaster's reaction: small round face + italic line. */
export function Quote({ face, text, light = false, style }: { face?: number; text: string; light?: boolean; style?: StyleProp<ViewStyle> }) {
  if (!text) return null;
  return (
    <View accessibilityLiveRegion="polite" style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
      {face != null ? <Avatar source={face} size={40} bg={light ? 'rgba(255,255,255,0.2)' : colors.blush} /> : null}
      <T style={{ flex: 1, fontFamily: fonts.medium, fontStyle: 'italic', fontSize: 14, lineHeight: 20, color: light ? colors.white : colors.ink, textAlign: face == null ? 'center' : 'left' }}>
        “{text}”
      </T>
    </View>
  );
}

/** Gold "★ Premium" tag. */
export function PremiumTag({ small = false }: { small?: boolean }) {
  return (
    <View style={{ backgroundColor: '#E8A317', borderRadius: 999, paddingHorizontal: small ? 6 : 8, height: small ? 18 : 22, justifyContent: 'center' }}>
      <T style={{ fontFamily: fonts.bold, fontSize: small ? 10 : 11, lineHeight: small ? 13 : 15, color: colors.white }}>★ Premium</T>
    </View>
  );
}

/**
 * Soft Premium nudge (never a hard paywall mid-setup): roaster pose, roaster copy,
 * "See Premium" opens the paywall, "Maybe later" closes.
 */
export function NudgeSheet({ visible, onClose, face, title, body, onSeePremium }: { visible: boolean; onClose: () => void; face: number; title: string; body: string; onSeePremium: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Character source={face} size={160} alt="" />
        <T accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 20, lineHeight: 25, color: colors.ink, textAlign: 'center' }}>
          {title}
        </T>
        <T style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink, textAlign: 'center' }}>{body}</T>
      </View>
      <Button label="See Premium" style={btn} onPress={onSeePremium} />
      <View style={{ alignItems: 'center' }}>
        <LinkButton label="Maybe later" onPress={onClose} />
      </View>
    </Sheet>
  );
}

/**
 * A static pose that fades to transparent at the bottom (an SVG mask), so it sits on the red
 * spotlight background without a seam. Animated poses have the fade baked in instead.
 */
export function FadedPose({ source, size, alt }: { source: number; size: number; alt: string }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={alt} style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinear id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.72" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </SvgLinear>
          <Mask id="m" x="0" y="0" width={size} height={size} maskUnits="userSpaceOnUse">
            <Rect width={size} height={size} fill="url(#fade)" />
          </Mask>
        </Defs>
        <SvgImage href={source} width={size} height={size} preserveAspectRatio="xMidYMin slice" mask="url(#m)" />
      </Svg>
    </View>
  );
}
