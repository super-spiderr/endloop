import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { pose, roasterName } from '@/characters';
import { BrandBar, Button, Character, LinkButton, Screen, T } from '@/components/ui';
import { AppIconImage, setAppIcon } from '@/lib/app-icon';
import { localDay, useSettings } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

/** Screen 17 · end of onboarding: put the roaster's face on the home-screen icon? */
export default function AppIconAsk() {
  const { roaster, tracked, set } = useSettings();
  const name = roasterName[roaster];
  const app = tracked[0]?.label ?? 'Instagram';

  const copy =
    roaster === 'lupe'
      ? { title: 'Want me on your home screen?', body: "I'll be right there, next to the apps you swore you'd open less." }
      : { title: 'Put my face on your home screen?', body: `Every time your thumb goes looking for ${app}, it walks past me first.` };

  const finish = (useFace: boolean) => {
    setAppIcon(useFace ? roaster : 'default');
    set({ onboarded: true, streakDays: 1, startedAt: localDay() });
    router.replace('/today');
  };

  return (
    <Screen>
      <BrandBar step={6} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ flex: 1, justifyContent: 'center', gap: 18, paddingHorizontal: 28, paddingVertical: 16 }}>
          <View style={{ alignItems: 'center', marginBottom: -22 }}>
            <Character source={pose(roaster, 'frame')} size={230} alt={`${name}, framing a photo with both hands`} fadeTo={colors.bg} />
          </View>
          <View style={st.preview}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <AppIconImage name="default" size={72} />
              <T v="caption" style={{ fontFamily: fonts.bold }}>Now</T>
            </View>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Svg>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <AppIconImage name={roaster} size={96} />
              <T v="bodyBold" style={{ fontSize: 12 }}>With {name}</T>
            </View>
          </View>
          <T v="display" style={{ fontSize: 30, lineHeight: 33 }}>{copy.title}</T>
          <T style={{ fontSize: 16, lineHeight: 23, color: colors.muted }}>{copy.body}</T>
          <View accessibilityRole="text" style={st.note}>
            <T v="bodyBold" style={{ color: colors.red, fontSize: 15 }}>!</T>
            <T style={{ flex: 1, fontSize: 13, lineHeight: 19, color: colors.ink }}>
              Some phones take the icon off your home screen when it changes. If it vanishes, it&apos;s in your app drawer. Drag it back.
            </T>
          </View>
        </View>
        <View style={{ paddingHorizontal: 28, paddingBottom: 16, gap: 4, alignItems: 'center' }}>
          <Button label={`Yes, use ${name}`} onPress={() => finish(true)} />
          <LinkButton label="Keep the red one" onPress={() => finish(false)} />
          <T v="caption" style={{ fontSize: 12 }}>Change it anytime in Settings → App icon</T>
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  preview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 22, borderRadius: 24, backgroundColor: colors.surface },
  note: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line },
});
