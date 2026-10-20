import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { PremiumSheet } from '@/components/premium-sheet';
import { Group, Row, Segment, SubScreen, Toggle } from '@/components/settings-ui';
import { T } from '@/components/ui';
import { cleanName, useSettings, type Intensity, type RoastLang } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

const LEVEL_NOTE: Record<string, string> = {
  polite: 'Gentle nudges. I still notice everything.',
  honest: 'Plain facts about your scrolling. No sugar.',
  savage: 'No mercy. About the habit, never about you.',
};

/** Settings → Roasting: name, level, language, sound. */
export default function RoastingPrefs() {
  const s = useSettings();
  const [premium, setPremium] = useState(false);
  const [name, setName] = useState(s.name ?? '');
  const saveName = () => {
    const clean = cleanName(name);
    setName(clean);
    s.set({ name: clean || undefined });
  };
  return (
    <SubScreen title="Roasting" intro="How hard, and in which language.">
      <Group title="What I call you" note="Used now and then in roasts. Leave it empty and I won't use a name. Stays on this phone.">
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={saveName}
          onSubmitEditing={saveName}
          placeholder="First name or nickname"
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          autoComplete="name-given"
          autoCorrect={false}
          maxLength={24}
          returnKeyType="done"
          accessibilityLabel="Your name"
          style={st.input}
        />
      </Group>

      <Group title="Roast level" note={LEVEL_NOTE[s.intensity]}>
        <View style={{ paddingTop: 12 }}>
          <Segment<Intensity | 'unhinged'>
            options={[
              ['polite', 'Polite'],
              ['honest', 'Honest'],
              ['savage', 'Savage'],
              ['unhinged', 'Unhinged'],
            ]}
            value={s.intensity}
            locked={['unhinged']}
            onChange={(v) => (v === 'unhinged' ? setPremium(true) : s.set({ intensity: v }))}
          />
        </View>
      </Group>

      <Group title="Language">
        <View style={{ paddingTop: 12 }}>
          <Segment<RoastLang>
            options={[
              ['en', 'English'],
              ['ta-Latn', 'Tanglish'],
            ]}
            value={s.roastLang}
            onChange={(v) => s.set({ roastLang: v })}
          />
        </View>
      </Group>

      <Group>
        <Row first label="Roast sound" sub="Off by default. Your roasts, your volume." right={<Toggle value={s.roastSound} onChange={(v) => s.set({ roastSound: v })} label="Roast sound" />} />
      </Group>

      <T v="caption" style={{ paddingHorizontal: 28, paddingTop: 14 }}>Changes apply to the next roast.</T>
      <PremiumSheet visible={premium} onClose={() => setPremium(false)} roaster={s.roaster} reason="unhinged" />
    </SubScreen>
  );
}

const st = StyleSheet.create({
  input: { height: 52, paddingHorizontal: 4, fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
});
