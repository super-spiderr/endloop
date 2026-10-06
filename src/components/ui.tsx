import * as Haptics from 'expo-haptics';
import { Image, type ImageContentPosition } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/brand/logo';
import { colors, fonts, radius } from '@/theme/tokens';

/* ---------- text ---------- */

type Variant = 'display' | 'title' | 'body' | 'bodyBold' | 'label' | 'caption';
const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 35, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 21, lineHeight: 26, color: colors.ink },
  body: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.muted },
  bodyBold: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.muted },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
};

export function T({ v = 'body', style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[variants[v], style]} />;
}

/* ---------- layout ---------- */

export function Screen({ children, bg = colors.bg, gradient, style }: { children: ReactNode; bg?: string; gradient?: readonly [string, string, ...string[]]; style?: StyleProp<ViewStyle> }) {
  const body = (
    <SafeAreaView style={[{ flex: 1 }, style]} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
  if (gradient) return <LinearGradient colors={gradient} style={{ flex: 1 }}>{body}</LinearGradient>;
  return <View style={{ flex: 1, backgroundColor: bg }}>{body}</View>;
}

/** Wordmark left, onboarding progress right (screens 2–6). */
export function BrandBar({ step, total = 6, dark = false }: { step: number; total?: number; dark?: boolean }) {
  const on = dark ? colors.white : colors.red;
  const off = dark ? 'rgba(255,255,255,0.35)' : colors.line;
  return (
    <View style={s.brandBar}>
      <Wordmark width={92} variant={dark ? 'white' : 'ink'} />
      <View accessibilityLabel={`Step ${step} of ${total}`} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ width: i + 1 === step ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i + 1 <= step ? on : off }} />
        ))}
      </View>
    </View>
  );
}

/* ---------- buttons ---------- */

type BtnProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: 'red' | 'white' | 'outline';
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

export function Button({ label, onPress, disabled, tone = 'red', style, haptic = true }: BtnProps) {
  const bg = disabled ? colors.line : tone === 'red' ? colors.red : colors.white;
  const fg = disabled ? colors.muted : tone === 'red' ? colors.white : colors.red;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        if (haptic) Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        tone === 'outline' && !disabled && { borderWidth: 1.5, borderColor: colors.red },
        style,
      ]}>
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function LinkButton({ label, onPress, color = colors.muted }: { label: string; onPress?: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 15, color }}>{label}</Text>
    </Pressable>
  );
}

/* ---------- characters ---------- */

/** A character cut-out. `fadeTo` paints a soft fade over the bottom edge (chest) in the background colour. */
export function Character({ source, size, alt, fadeTo, position = 'top' }: { source: number; size: number | { width: number; height: number }; alt: string; fadeTo?: string; position?: ImageContentPosition }) {
  const w = typeof size === 'number' ? size : size.width;
  const h = typeof size === 'number' ? size : size.height;
  return (
    <View style={{ width: w, height: h }}>
      <Image source={source} style={{ width: w, height: h }} contentFit="cover" contentPosition={position} accessibilityLabel={alt} />
      {fadeTo ? <LinearGradient colors={['transparent', fadeTo]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h * 0.22 }} /> : null}
    </View>
  );
}

/** Round face crop for chips, bubbles and sheets. */
export function Avatar({ source, size = 40, bg = colors.blush }: { source: number; size?: number; bg?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: bg }}>
      <Image source={source} style={{ width: size * 1.7, height: size * 1.7, marginLeft: -size * 0.35, marginTop: -size * 0.05 }} contentFit="cover" />
    </View>
  );
}

export function SpeechBubble({ face, text }: { face: number; text: string }) {
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Avatar source={face} size={44} />
      <View style={s.bubble}>
        <Text style={s.bubbleText}>{text}</Text>
      </View>
    </View>
  );
}

/* ---------- misc ---------- */

export function AppTile({ label, color, size = 44, iconUri }: { label: string; color: string; size?: number; iconUri?: string | null }) {
  if (iconUri) return <Image source={{ uri: iconUri }} style={{ width: size, height: size, borderRadius: size * 0.27 }} accessibilityIgnoresInvertColors />;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.white, fontFamily: fonts.bold, fontSize: size * 0.4 }}>{label[0]}</Text>
    </View>
  );
}

export function Pill({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }}>
      <Text style={{ color, fontFamily: fonts.bold, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

export function Sheet({ visible, onClose, children, dark = false }: { visible: boolean; onClose: () => void; children: ReactNode; dark?: boolean }) {
  // The app draws edge to edge: keep the sheet's buttons above the 3-button / gesture navigation bar.
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* A Modal renders outside the app's root, so gestures inside it (the limit slider) need their own root on Android. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable accessibilityLabel="Close" style={s.scrim} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: dark ? colors.darkBg : colors.white, paddingBottom: 24 + insets.bottom }]}>
          <View style={[s.grabber, { backgroundColor: dark ? 'rgba(255,255,255,0.25)' : colors.line }]} />
          {children}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const s = StyleSheet.create({
  brandBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 },
  btn: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  btnText: { fontFamily: fonts.bold, fontSize: 18 },
  bubble: { flexShrink: 1, backgroundColor: colors.ink, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderBottomLeftRadius: 4 },
  bubbleText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,20,20,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, gap: 16 },
  grabber: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center' },
});
