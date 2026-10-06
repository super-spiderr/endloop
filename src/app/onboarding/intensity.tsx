import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { pose, roasterName, type Roaster } from '@/characters';
import { ChilliIcon, LockIcon } from '@/components/icons';
import { PremiumSheet } from '@/components/premium-sheet';
import { Avatar, BrandBar, Button, Character, Screen, Sheet, T } from '@/components/ui';
import { previewRoast } from '@/roasts';
import { hoursText } from '@/lib/time';
import { useSettings, type Intensity, type RoastLang } from '@/store/settings';
import { colors, fonts, gradients } from '@/theme/tokens';

type Level = Intensity | 'unhinged';
const LEVELS: { key: Level; label: string; heat: number }[] = [
  { key: 'polite', label: 'Polite', heat: 1 },
  { key: 'honest', label: 'Honest', heat: 2 },
  { key: 'savage', label: 'Savage', heat: 3 },
  { key: 'unhinged', label: 'Unhinged', heat: 4 },
];

const ROASTER_LINE: Record<Roaster, string> = {
  loop: 'Deadpan. Has heard every excuse.',
  lupe: 'Unimpressed. Sees right through you.',
};

/** Screen colours heat up with the level. */
function themeFor(level: Intensity) {
  const savage = level === 'savage';
  return {
    savage,
    ink: savage ? colors.white : colors.ink,
    muted: savage ? colors.blush : colors.muted,
    card: savage ? 'rgba(255,255,255,0.14)' : level === 'honest' ? colors.white : colors.surface,
    line: savage ? 'rgba(255,255,255,0.4)' : colors.line,
    accent: savage ? colors.white : colors.red,
    pillOn: savage ? colors.white : colors.red,
    pillOnText: savage ? colors.red : colors.white,
    chip: savage ? 'rgba(255,255,255,0.14)' : colors.white,
    gradient: savage ? gradients.roasted : level === 'honest' ? gradients.honest : ([colors.bg, colors.bg] as const),
    fade: savage ? '#C51027' : level === 'honest' ? '#FFF0F2' : colors.bg,
  };
}

/** Screen 4 · Roast setup: roaster, roast language and heat. */
export default function IntensityScreen() {
  const { roaster, roastLang, intensity, tracked, set } = useSettings();
  const [premium, setPremium] = useState(false);
  const [picking, setPicking] = useState(false);
  const t = themeFor(intensity);

  const top = [...tracked].sort((a, b) => b.weekMin - a.weekMin)[0];
  const appName = top?.label ?? 'Instagram';
  const hours = top ? hoursText(top.weekMin) : '14 hours';

  const bounce = useSharedValue(1);
  const shake = useSharedValue(0);
  const charStyle = useAnimatedStyle(() => ({ transform: [{ scale: bounce.get() }, { translateX: shake.get() }] }));

  const choose = (level: Level) => {
    if (level === 'unhinged') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setPremium(true);
      return;
    }
    if (level === intensity) return;
    if (level === 'savage') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      shake.set(withSequence(withTiming(-6, { duration: 40 }), withTiming(6, { duration: 60 }), withTiming(-4, { duration: 60 }), withTiming(0, { duration: 40 })));
    } else {
      Haptics.selectionAsync();
    }
    bounce.set(withSequence(withTiming(0.94, { duration: 80 }), withSpring(1)));
    set({ intensity: level });
  };

  const imgPose = intensity; // polite | honest | savage poses per roaster

  return (
    <Screen gradient={t.gradient}>
      <StatusBar style={t.savage ? 'light' : 'dark'} />
      <BrandBar step={4} dark={t.savage} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 12 }}>
          <T v="display" style={{ color: t.ink }}>How mean should I be?</T>
          <Row label="Your roaster" muted={t.muted}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Your roaster: ${roasterName[roaster]}. Change`}
              onPress={() => {
                Haptics.selectionAsync();
                setPicking(true);
              }}
              style={[st.chip, { backgroundColor: t.chip, borderColor: t.accent, borderWidth: 2 }]}>
              <Avatar source={pose(roaster, 'idle')} size={32} />
              <T v="bodyBold" style={{ flex: 1, color: t.ink, fontSize: 15 }}>{roasterName[roaster]}</T>
              <T v="bodyBold" style={{ color: t.accent, fontSize: 14 }}>Change</T>
            </Pressable>
          </Row>
          <Row label="Roast in" muted={t.muted}>
            <View accessibilityRole="radiogroup" style={[st.segment, { backgroundColor: t.chip, borderColor: t.line }]}>
              {(['en', 'ta-Latn'] as RoastLang[]).map((l) => {
                const on = roastLang === l;
                return (
                  <Pressable
                    key={l}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      set({ roastLang: l });
                    }}
                    style={[st.segBtn, on && { backgroundColor: t.pillOn }]}>
                    <T v="bodyBold" style={{ fontSize: 14, color: on ? t.pillOnText : t.ink }}>{l === 'en' ? 'English' : 'Tanglish'}</T>
                  </Pressable>
                );
              })}
            </View>
          </Row>
        </View>

        <Animated.View style={[{ alignItems: 'center', paddingTop: 4 }, charStyle]}>
          <Character source={pose(roaster, imgPose)} size={236} alt={`${roasterName[roaster]}, ${intensity}`} fadeTo={t.fade} />
        </Animated.View>

        <View style={{ paddingHorizontal: 24, gap: 14 }}>
          <View accessibilityRole="radiogroup" accessibilityLabel="Roast intensity" style={{ flexDirection: 'row', gap: 8 }}>
            {LEVELS.map(({ key, label, heat }) => {
              const on = key === intensity;
              const locked = key === 'unhinged';
              const chilli = on ? t.pillOnText : locked ? t.muted : t.accent;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${label}${locked ? ', Premium' : ''}`}
                  onPress={() => choose(key)}
                  style={[st.level, { backgroundColor: on ? t.pillOn : t.chip, borderColor: on ? t.pillOn : t.line, opacity: locked ? 0.7 : 1 }]}>
                  <View style={{ flexDirection: 'row', height: 14, alignItems: 'center' }}>
                    {locked ? <LockIcon size={12} color={t.muted} strokeWidth={2.6} /> : Array.from({ length: heat }, (_, i) => <ChilliIcon key={i} color={chilli} />)}
                  </View>
                  <T v="bodyBold" style={{ fontSize: 13, color: on ? t.pillOnText : t.ink }}>{label}</T>
                </Pressable>
              );
            })}
          </View>

          <View style={[st.preview, { backgroundColor: t.card, borderColor: t.line }]}>
            <T v="label" style={{ fontSize: 12, color: t.accent }}>Your first roast</T>
            <T style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 26, color: t.ink }}>
              {previewRoast(intensity, roastLang, appName, hours)}
            </T>
          </View>
        </View>

        <View style={{ flex: 1, minHeight: 16 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 10, alignItems: 'center' }}>
          <T v="caption" style={{ color: t.muted }}>You can change this anytime in Settings.</T>
          <Button label="Roast me like that" tone={t.savage ? 'white' : 'red'} onPress={() => router.push('/onboarding/limits')} />
        </View>
      </ScrollView>

      <PremiumSheet visible={premium} onClose={() => setPremium(false)} roaster={roaster} reason="unhinged" />

      <Sheet visible={picking} onClose={() => setPicking(false)}>
        <T v="title">Pick your roaster</T>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 12 }}>
          {(['loop', 'lupe'] as Roaster[]).map((r) => {
            const on = roaster === r;
            return (
              <Pressable
                key={r}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${roasterName[r]}. ${ROASTER_LINE[r]}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  set({ roaster: r });
                }}
                style={[st.pick, { borderColor: on ? colors.red : colors.line, borderWidth: on ? 2.5 : 1, backgroundColor: on ? colors.blush : colors.white }]}>
                <Character source={pose(r, 'idle')} size={140} alt={roasterName[r]} fadeTo={on ? colors.blush : colors.white} />
                <T v="title">{roasterName[r]}</T>
                <T v="caption" style={{ textAlign: 'center' }}>{ROASTER_LINE[r]}</T>
              </Pressable>
            );
          })}
        </View>
        <Button label={`Roast me, ${roasterName[roaster]}`} onPress={() => setPicking(false)} />
      </Sheet>
    </Screen>
  );
}

function Row({ label, muted, children }: { label: string; muted: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <T style={{ fontFamily: fonts.bold, fontSize: 13, color: muted, width: 84 }}>{label}</T>
      <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>{children}</View>
    </View>
  );
}

const st = StyleSheet.create({
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5, paddingLeft: 5, paddingRight: 12, borderRadius: 999 },
  segment: { flex: 1, flexDirection: 'row', gap: 4, padding: 3, borderRadius: 999, borderWidth: 1 },
  segBtn: { flex: 1, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pick: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 12, paddingBottom: 14, paddingHorizontal: 10, borderRadius: 22 },
  level: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  preview: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16, gap: 8 },
});
