import { useState } from 'react';
import { View } from 'react-native';

import { PremiumSheet } from '@/components/premium-sheet';
import { Group, Row, Segment, SubScreen, Toggle } from '@/components/settings-ui';
import { T } from '@/components/ui';
import { useSettings, type Intensity, type RoastLang } from '@/store/settings';

const LEVEL_NOTE: Record<string, string> = {
  polite: 'Gentle nudges. I still notice everything.',
  honest: 'Plain facts about your scrolling. No sugar.',
  savage: 'No mercy. About the habit, never about you.',
};

/** Settings → Roasting: level, language, sound. */
export default function RoastingPrefs() {
  const s = useSettings();
  const [premium, setPremium] = useState(false);
  return (
    <SubScreen title="Roasting" intro="How hard, and in which language.">
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
