import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { pose } from '@/characters';
import { btn, Heading, PremiumTag, Quote, StepBar } from '@/components/onboarding-ui';
import { Button, Character, Screen, T } from '@/components/ui';
import { OB, say } from '@/content/onboarding';
import { useSettings, type Goal } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

const GOALS: { key: Goal; label: string }[] = [
  { key: 'exams', label: 'Exams / studies' },
  { key: 'sleep', label: 'Better sleep' },
  { key: 'focus', label: 'Focus at work' },
  { key: 'family', label: 'Family time' },
  { key: 'checking', label: 'Just checking how bad it is' },
  { key: 'own', label: 'In my own words' },
];

/** Own words: trimmed, no braces or control characters (they can end up in roast lines), 60 chars max. */
const cleanGoal = (raw: string) => raw.replace(/[{}\p{Cc}]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60);

/** Onboarding v2 · Step 6b: "Why are you here?" (asked of everyone; steers some roasts, shown at snooze for Premium). */
export default function GoalScreen() {
  const { roaster, roastLang: lang, goal, goalText, premium, set } = useSettings();
  const [text, setText] = useState(goalText ?? '');
  const own = cleanGoal(text);
  const ready = goal != null && (goal !== 'own' || own.length > 0);

  const pick = (g: Goal) => {
    Haptics.selectionAsync();
    set({ goal: g });
  };

  return (
    <Screen>
      <StepBar step={6} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 24, paddingTop: 14 }}>
            <View style={{ flex: 1, paddingBottom: 6, gap: 8, alignItems: 'flex-start' }}>
              {premium ? <PremiumTag /> : null}
              <Heading title={say(OB.goalTitle, lang)} sub="Pick one. I'll bring it up when it matters." />
            </View>
            <Character source={pose(roaster, 'thinking')} size={92} alt="Thinking" fadeTo={colors.bg} />
          </View>
          <View accessibilityRole="radiogroup" style={{ gap: 8, paddingHorizontal: 24, paddingTop: 14 }}>
            {GOALS.map((g) => {
              const on = goal === g.key;
              return (
                <Pressable key={g.key} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => pick(g.key)} style={[st.row, on && { backgroundColor: colors.surface, borderColor: colors.red, borderWidth: 2 }]}>
                  <View style={[st.radio, on && { borderWidth: 6, borderColor: colors.red }]} />
                  <T style={{ fontFamily: on ? fonts.bold : fonts.medium, fontSize: 14, color: colors.ink }}>{g.label}</T>
                </Pressable>
              );
            })}
            {goal === 'own' ? (
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="e.g. Clear my CA exam"
                placeholderTextColor={colors.muted}
                maxLength={60}
                autoFocus
                accessibilityLabel="Your own words"
                style={st.input}
              />
            ) : null}
          </View>
          {goal ? (
            <Quote
              face={pose(roaster, 'idle')}
              text={goal === 'own' && premium && own ? say(OB.goalOwnPremium, lang, { goal: own }, say(OB.goal.own, lang)) : say(OB.goal[goal], lang)}
              style={{ marginHorizontal: 24, marginTop: 16 }}
            />
          ) : null}
          <View style={{ flex: 1, minHeight: 16 }} />
          <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 10, alignItems: 'center' }}>
            {premium ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={st.on}>
                  <T style={{ fontFamily: fonts.bold, fontSize: 10, color: colors.white }}>★ ON</T>
                </View>
                <T style={{ flexShrink: 1, fontSize: 12, color: '#8A5A00' }}>I&apos;ll show this to you every time you try to snooze.</T>
              </View>
            ) : (
              <T style={{ fontSize: 12, color: '#8A5A00', textAlign: 'center' }}>★ Premium: I&apos;ll throw this back at you when you try to snooze.</T>
            )}
            <Button
              label="That's why"
              disabled={!ready}
              style={btn}
              onPress={() => {
                set({ goalText: goal === 'own' ? own : undefined });
                router.push('/onboarding/permissions');
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 46, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EDE3E4', backgroundColor: colors.white },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#CFC7C8', backgroundColor: colors.white },
  input: { height: 44, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#EDE3E4', backgroundColor: colors.white, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  on: { backgroundColor: '#E8A317', borderRadius: 999, paddingHorizontal: 7, height: 18, justifyContent: 'center' },
});
