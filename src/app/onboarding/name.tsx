import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { pose } from '@/characters';
import { BrandBar, Button, Character, LinkButton, Screen, T } from '@/components/ui';
import { cleanName, useSettings } from '@/store/settings';
import { colors, fonts, radius } from '@/theme/tokens';

/** Screen 1b · Name. Optional: Loop / Lupe use it now and then in roasts ({name}). Editable in Settings → Roasting. */
export default function Name() {
  const roaster = useSettings((s) => s.roaster);
  const set = useSettings((s) => s.set);
  const [text, setText] = useState(useSettings.getState().name ?? '');
  const name = cleanName(text);

  const next = (save: boolean) => {
    set({ name: save && name ? name : undefined });
    router.push('/onboarding/usage-access');
  };

  return (
    <Screen>
      <BrandBar step={1} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Character source={pose(roaster, 'notes')} size={180} alt="Loop, notepad ready" fadeTo={colors.bg} />
            </View>
            <T v="display">And you are…?</T>
            <T>So I know who I&apos;m talking to. I&apos;ll use it now and then. Usually mid-scroll.</T>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="First name or nickname"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              autoComplete="name-given"
              autoCorrect={false}
              maxLength={24}
              returnKeyType="done"
              onSubmitEditing={() => name && next(true)}
              accessibilityLabel="Your name"
              style={st.input}
            />
            <T v="caption">Stays on this phone. Change it any time in Settings.</T>
          </View>
          <View style={{ flex: 1, minHeight: 24 }} />
          <View style={{ paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center', gap: 4 }}>
            <Button label="That's me" disabled={!name} onPress={() => next(true)} />
            <LinkButton label="Skip" onPress={() => next(false)} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const st = StyleSheet.create({
  input: {
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
  },
});
