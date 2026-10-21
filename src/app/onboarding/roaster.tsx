import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { pose, roasterName, type Roaster } from '@/characters';
import { btn, Heading, Label, Quote, SpotlightScreen, StepBar, RedStatusBar } from '@/components/onboarding-ui';
import { Button, Character, Sheet, T } from '@/components/ui';
import { OB, say } from '@/content/onboarding';
import { useSettings, type RoastLang, type UserGroup } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

const DESC: Record<Roaster, string> = { loop: 'Deadpan. Has heard every excuse.', lupe: 'Unimpressed. Sees right through you.' };
const GROUPS: { key: UserGroup; label: string }[] = [
  { key: 'school', label: 'School student' },
  { key: 'college', label: 'College student' },
  { key: 'working', label: 'Working' },
  { key: 'other', label: 'Other' },
];

/** Onboarding v2 · Step 1: full-screen roaster chooser (animated), then the "A bit about you" sheet. */
export default function RoasterPick() {
  const { width, height } = useWindowDimensions();
  const { roaster, roastLang, group, set } = useSettings();
  const [sheet, setSheet] = useState(false);
  const [lastLine, setLastLine] = useState<string | null>(null);
  const pickLine = say(roaster === 'loop' ? OB.pickLoop : OB.pickLupe, roastLang);
  const imgH = Math.min(height * 0.48, width);

  const choose = (r: Roaster) => {
    if (r === roaster) return;
    Haptics.selectionAsync();
    set({ roaster: r });
  };
  const setLang = (l: RoastLang) => {
    set({ roastLang: l });
    setLastLine(l === 'ta-Latn' ? say(OB.langTa, l) : say(OB.langEn, l));
  };
  const setGroup = (g: UserGroup) => {
    Haptics.selectionAsync();
    const next = group === g ? undefined : g;
    set({ group: next, ...(next === 'school' ? { intensity: 'honest' as const } : {}) });
    setLastLine(next ? say(OB.group[next], roastLang) : null);
  };

  return (
    <SpotlightScreen loopY={0.38}>
      <RedStatusBar />
      <StepBar step={1} dark />
      <T style={st.eyebrow}>Pick your roaster</T>
      <Animated.View key={roaster} entering={FadeIn.duration(250)} style={{ alignItems: 'center' }}>
        <Character source={pose(roaster, 'choose')} size={{ width: imgH * 0.82, height: imgH * 0.82 }} alt={roasterName[roaster]} />
      </Animated.View>
      <View style={{ alignItems: 'center', paddingHorizontal: 32, gap: 6, marginTop: -8 }}>
        <T accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 42, color: colors.white }}>
          {roasterName[roaster]}
        </T>
        <T style={{ fontFamily: fonts.medium, fontSize: 15, color: 'rgba(255,255,255,0.88)', textAlign: 'center' }}>{DESC[roaster]}</T>
        <T style={{ fontFamily: fonts.medium, fontStyle: 'italic', fontSize: 14, lineHeight: 20, color: colors.white, textAlign: 'center', marginTop: 8 }}>“{pickLine}”</T>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 14 }}>
        <View accessibilityRole="radiogroup" style={st.switch}>
          {(['loop', 'lupe'] as Roaster[]).map((r) => (
            <Pressable key={r} accessibilityRole="radio" accessibilityState={{ selected: roaster === r }} onPress={() => choose(r)} style={[st.switchBtn, roaster === r && { backgroundColor: colors.white }]}>
              <T style={{ fontFamily: fonts.bold, fontSize: 15, color: roaster === r ? colors.red : colors.white }}>{roasterName[r]}</T>
            </Pressable>
          ))}
        </View>
        <Button label={`Roast me, ${roasterName[roaster]}`} tone="white" style={btn} onPress={() => setSheet(true)} />
      </View>

      <Sheet visible={sheet} onClose={() => setSheet(false)}>
        <Heading title="A bit about you" sub="So the roasts actually land." size={20} />
        <View style={{ gap: 8 }}>
          <Label>Roast me in</Label>
          <View accessibilityRole="radiogroup" style={st.seg}>
            {(['en', 'ta-Latn'] as RoastLang[]).map((l) => (
              <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: roastLang === l }} onPress={() => setLang(l)} style={[st.segBtn, roastLang === l && st.segOn]}>
                <T style={{ fontFamily: fonts.bold, fontSize: 14, color: roastLang === l ? colors.ink : colors.muted }}>{l === 'en' ? 'English' : 'Tanglish'}</T>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Label extra="Optional">Which one are you?</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GROUPS.map((g) => {
              const on = group === g.key;
              return (
                <Pressable key={g.key} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setGroup(g.key)} style={[st.chip, on && st.chipOn]}>
                  <T style={{ fontFamily: fonts.medium, fontSize: 14, color: on ? colors.red : colors.ink }}>{g.label}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Quote face={pose(roaster, 'idle')} text={lastLine ?? pickLine} />
        <Button
          label="Let's go"
          style={btn}
          onPress={() => {
            setSheet(false);
            router.push('/onboarding/usage-access');
          }}
        />
      </Sheet>
    </SpotlightScreen>
  );
}

const st = StyleSheet.create({
  eyebrow: { textAlign: 'center', marginTop: 16, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' },
  switch: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  switchBtn: { flex: 1, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  seg: { flexDirection: 'row', gap: 4, padding: 3, borderRadius: 13, backgroundColor: '#F4ECED' },
  segBtn: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  chip: { width: '48.5%', height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#EDE3E4', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  chipOn: { borderWidth: 1.5, borderColor: colors.red, backgroundColor: '#FFF1F2' },
});
