import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { pose, roasterName } from '@/characters';
import { CloseIcon } from '@/components/icons';
import { AppTile, Button, Character, LinkButton, T } from '@/components/ui';
import { FREE_APPS } from '@/lib/plans';
import { fmt } from '@/lib/time';
import { useSettings, watchedApps } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

/**
 * S16-H · Premium ended → pick 3 apps to keep. The rest stop being watched (their history stays on the phone).
 * Until this is done the watcher keeps the 3 most-used apps.
 */
export default function KeepApps() {
  const s = useSettings();
  // Starts on the 3 being watched now; follows the stored settings until the first tap.
  const [chosen, setChosen] = useState<string[] | null>(null);
  const picked = chosen ?? watchedApps(s).map((a) => a.packageName);
  const who = roasterName[s.roaster];
  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));
  const sorted = [...s.tracked].sort((a, b) => b.avgDailyMin - a.avgDailyMin);

  // Premium came back, or they already have 3 or fewer: nothing to pick.
  if (s.premium || s.tracked.length <= FREE_APPS) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 24, gap: 16, justifyContent: 'center' }}>
        <T v="title">Nothing to pick.</T>
        <T>{s.premium ? 'Premium is on, so all your apps are watched.' : `You watch ${s.tracked.length} ${s.tracked.length === 1 ? 'app' : 'apps'}. Free covers ${FREE_APPS}.`}</T>
        <Button label="Back" onPress={close} />
      </SafeAreaView>
    );
  }

  const toggle = (pkg: string) => setChosen(picked.includes(pkg) ? picked.filter((x) => x !== pkg) : picked.length >= FREE_APPS ? picked : [...picked, pkg]);
  const ready = picked.length === FREE_APPS;
  const dropped = s.tracked.filter((a) => !picked.includes(a.packageName));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={st.close}>
            <CloseIcon size={20} color={colors.ink} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingLeft: 12, paddingRight: 20 }}>
          <Character source={pose(s.roaster, 'goodbye')} size={120} alt={`${who} waving goodbye`} fadeTo={colors.bg} />
          <T style={{ flex: 1, paddingBottom: 14, fontFamily: fonts.display, fontSize: 26, lineHeight: 29, color: colors.ink }}>Premium ended. Pick 3 to keep.</T>
        </View>
        <T style={{ paddingHorizontal: 24, paddingTop: 6, color: colors.muted }}>
          Free watches {FREE_APPS} apps. Until you pick, I&apos;m watching your 3 most used. The others keep their history; I just stop roasting them.
        </T>

        <View accessibilityRole="list" style={{ gap: 10, paddingHorizontal: 24, paddingTop: 18 }}>
          {sorted.map((a) => {
            const on = picked.includes(a.packageName);
            const full = !on && picked.length >= FREE_APPS;
            return (
              <Pressable
                key={a.packageName}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on, disabled: full }}
                accessibilityLabel={`${a.label}, about ${fmt(a.avgDailyMin)} a day`}
                onPress={() => toggle(a.packageName)}
                style={[st.row, on && { borderColor: colors.red }, full && { opacity: 0.5 }]}>
                <AppTile label={a.label} color={a.color} iconUri={a.iconUri} size={40} />
                <View style={{ flex: 1 }}>
                  <T v="bodyBold" style={{ fontSize: 15 }}>{a.label}</T>
                  <T v="caption">About {fmt(a.avgDailyMin)} a day · limit {fmt(a.limitMin)}</T>
                </View>
                <View style={[st.check, on && { backgroundColor: colors.red, borderColor: colors.red }]}>
                  {on ? (
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M5 12l5 5 9-10" />
                    </Svg>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <T v="bodyBold" style={{ textAlign: 'center', paddingTop: 12, fontSize: 13, color: ready ? colors.muted : colors.red }}>
          {picked.length} of {FREE_APPS} picked
        </T>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 4 }}>
        <Button
          label={ready ? `Keep these ${FREE_APPS}` : `Pick ${FREE_APPS - picked.length} more`}
          disabled={!ready}
          onPress={() => {
            s.set({ tracked: s.tracked.filter((a) => picked.includes(a.packageName)) });
            close();
          }}
        />
        {ready && dropped.length ? (
          <T v="caption" style={{ textAlign: 'center' }}>
            {dropped.map((a) => a.label).join(', ').replace(/, ([^,]*)$/, ' and $1')} {dropped.length === 1 ? 'goes' : 'go'} unwatched. Add {dropped.length === 1 ? 'it' : 'them'} back any time with Premium.
          </T>
        ) : null}
        <View style={{ alignItems: 'center' }}>
          <LinkButton label="Get Premium back" onPress={() => router.replace({ pathname: '/paywall', params: { reason: 'ended' } })} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.white },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
});
