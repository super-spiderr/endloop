import { Linking, StyleSheet, View } from 'react-native';

import { Button, T } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';

/**
 * Android 13+: apps installed outside the Play Store can't get Usage access or Display over other
 * apps until the user allows "restricted settings" once in App info (the switch is greyed out,
 * "App was denied access"). Shown up front when we know the install is affected, or after a failed try.
 */
export function RestrictedHelp({ upfront, then }: { upfront: boolean; then: string }) {
  return (
    <View style={st.help} accessibilityRole="summary">
      <T v="bodyBold" style={{ fontSize: 15 }}>{upfront ? 'One extra step first' : 'Switch greyed out? "App was denied access"?'}</T>
      <T style={{ fontSize: 14, lineHeight: 20 }}>
        {upfront
          ? 'Installed outside the Play Store, so Android asks for one extra step. Once, then never again:'
          : 'Android blocks this for apps not installed from the Play Store. Unlock it once:'}
      </T>
      {["Open Endloop's App info (button below)", 'Tap ⋮ at the top right → Allow restricted settings', `Come back and tap “${then}”`].map((t, i) => (
        <T key={t} style={{ fontSize: 14, lineHeight: 20, color: colors.ink }}>{`${i + 1}. ${t}`}</T>
      ))}
      <Button label="Open App info" tone="outline" style={{ height: 46, borderRadius: 14, marginTop: 4 }} onPress={() => Linking.openSettings()} />
    </View>
  );
}

const st = StyleSheet.create({
  help: { gap: 6, padding: 16, borderRadius: radius.lg, backgroundColor: colors.headsTint },
});
