import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { pose, roasterName } from '@/characters';
import { Character, T } from '@/components/ui';
import { useSettings } from '@/store/settings';
import { colors } from '@/theme/tokens';

const ROWS: [string, string][] = [
  ['Which apps you open and for how long', "From Android's Usage Access. Stays on your phone."],
  ['When you open them', 'To warn you at 75% and 90%, and to count opens.'],
  ['Your snooze reasons and roasts', 'Stored on your phone for Stats and your weekly roast.'],
  ['Nothing inside your apps', 'No messages, no photos, no what-you-watched. I only see the clock.'],
  ['No account, no ads', 'Nothing leaves your phone unless you share a card.'],
];

/** Settings → What Endloop can see (plain words). */
export default function Privacy() {
  const roaster = useSettings((s) => s.roaster);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 12, paddingRight: 24, paddingTop: 8, paddingBottom: 4 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 5l-7 7 7 7" />
          </Svg>
        </Pressable>
        <T v="display" accessibilityRole="header" numberOfLines={1} style={{ flex: 1, fontSize: 26, lineHeight: 32 }}>What I can see</T>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 6 }}>
        <View style={{ alignItems: 'center' }}>
          <Character source={pose(roaster, 'shh')} size={150} alt={`${roasterName[roaster]}, finger on lips: your secret's safe`} />
        </View>
        <T>I watch the clock, not your content.</T>
        {ROWS.map(([t, d]) => (
          <View key={t} style={{ gap: 4, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <T v="bodyBold">{t}</T>
            <T v="caption" style={{ fontSize: 14, lineHeight: 20 }}>{d}</T>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
