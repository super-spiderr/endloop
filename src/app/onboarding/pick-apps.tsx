import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { pose } from '@/characters';
import { CheckIcon, SearchIcon } from '@/components/icons';
import { btn, Heading, Label, NudgeSheet, PremiumTag, Quote, StepBar } from '@/components/onboarding-ui';
import { AppTile, Button, Character, Screen, T } from '@/components/ui';
import { OB, say } from '@/content/onboarding';
import { usage, USUAL_SUSPECTS, type InstalledApp } from '@/data/usage';
import { fmt, HEAVY_DAILY_MIN, suggestedLimit } from '@/lib/time';
import { useSettings } from '@/store/settings';
import { colors, fonts, radius } from '@/theme/tokens';

const FREE_APPS = 3;
const PREMIUM_APPS = 6;

const REACTIONS: Record<string, string> = {
  'com.instagram.android': 'Classic.',
  'com.google.android.youtube': "'Just one video.' Sure.",
  'com.snapchat.android': "Streaks don't count as a personality.",
};

/** Screen 3 · The damage / pick apps. */
export default function PickApps() {
  const { roaster, roastLang: lang, hasUsageAccess, premium: isPremium, set } = useSettings();
  const maxApps = isPremium ? PREMIUM_APPS : FREE_APPS;
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [reaction, setReaction] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    usage.listApps().then((all) => {
      const ordered = hasUsageAccess
        ? all
        : [...all.filter((a) => USUAL_SUSPECTS.includes(a.packageName)), ...all.filter((a) => !USUAL_SUSPECTS.includes(a.packageName))];
      setApps(ordered);
      // Pre-tick the top apps, but only ones actually used this week.
      if (hasUsageAccess) setSelected(ordered.filter((a) => a.avgDailyMin > 0).slice(0, FREE_APPS).map((a) => a.packageName));
    });
  }, [hasUsageAccess]);

  const visible = useMemo(() => apps.filter((a) => a.label.toLowerCase().includes(query.trim().toLowerCase())), [apps, query]);

  const toggle = (app: InstalledApp) => {
    if (selected.includes(app.packageName)) {
      Haptics.selectionAsync();
      setSelected(selected.filter((p) => p !== app.packageName));
      return;
    }
    if (selected.length >= maxApps) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      if (!isPremium) setPremium(true);
      return;
    }
    Haptics.selectionAsync();
    setSelected([...selected, app.packageName]);
    setReaction(REACTIONS[app.packageName] ?? 'Interesting choice.');
  };

  const confirm = () => {
    const chosen = apps.filter((a) => selected.includes(a.packageName));
    const heavy = apps.reduce((t, a) => t + a.avgDailyMin, 0) > HEAVY_DAILY_MIN;
    set({
      tracked: chosen.map((a) => ({
        packageName: a.packageName,
        label: a.label,
        color: a.color,
        iconUri: a.iconUri,
        avgDailyMin: a.avgDailyMin,
        weekMin: a.weekMin,
        limitMin: hasUsageAccess ? suggestedLimit(a.avgDailyMin, heavy) : 60,
      })),
      // Stats compares against this: the last 7 days on these apps, before Endloop
      baselineDailyMin: hasUsageAccess && chosen.some((a) => a.avgDailyMin > 0) ? chosen.reduce((s, a) => s + a.avgDailyMin, 0) : undefined,
    });
    router.push('/onboarding/limits');
  };

  return (
    <Screen>
      <StepBar step={4} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 24, paddingTop: 12 }}>
        <View style={{ flex: 1, paddingBottom: 6, gap: 8, alignItems: 'flex-start' }}>
          {isPremium ? <PremiumTag /> : null}
          <Heading
            title={say(hasUsageAccess ? OB.appsTitle : OB.appsBlind, lang)}
            sub={
              hasUsageAccess
                ? isPremium
                  ? 'Your top 3 are picked. Swap any, or add up to 6.'
                  : 'Your top 3 are picked. Swap any. Free watches 3 apps.'
                : `No Usage Access, so I can't see your numbers. Pick up to ${maxApps}.`
            }
          />
        </View>
        <Character source={pose(roaster, hasUsageAccess ? 'present' : 'blind')} size={104} alt={hasUsageAccess ? 'Presenting the damage' : 'Blindfolded'} fadeTo={colors.bg} />
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 14, gap: 10 }}>
        {hasUsageAccess ? null : (
          <View style={st.search}>
            <SearchIcon />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your apps"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Search apps"
              style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, paddingVertical: 0 }}
            />
          </View>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Label>{hasUsageAccess ? 'Your top apps · last 7 days' : 'Installed apps'}</Label>
          <T style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.red }}>{`${selected.length} of ${maxApps}`}</T>
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(a) => a.packageName}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, gap: 8 }}
        renderItem={({ item }) => {
          const on = selected.includes(item.packageName);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${item.label}${hasUsageAccess ? `, ${fmt(item.avgDailyMin)} a day` : ''}`}
              onPress={() => toggle(item)}
              style={[st.row, on ? { backgroundColor: colors.surface, borderColor: colors.red, borderWidth: 2 } : null]}>
              <AppTile label={item.label} color={item.color} iconUri={item.iconUri} />
              <View style={{ flex: 1, gap: 1 }}>
                <T style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.ink }}>{item.label}</T>
                {hasUsageAccess ? <T style={{ fontSize: 13, color: colors.muted }}>{fmt(item.avgDailyMin)} a day</T> : null}
              </View>
              {on ? (
                <View style={[st.check, { backgroundColor: colors.red }]}>
                  <CheckIcon />
                </View>
              ) : (
                <View style={[st.check, { borderWidth: 2, borderColor: colors.line }]} />
              )}
            </Pressable>
          );
        }}
      />

      <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, gap: 14 }}>
        {reaction ? <Quote face={pose(roaster, 'idle')} text={reaction} /> : null}
        <Button label="These ones" disabled={!selected.length} style={btn} onPress={confirm} />
      </View>

      <NudgeSheet
        visible={premium}
        onClose={() => setPremium(false)}
        face={pose(roaster, 'vip')}
        title={say(OB.apps4thTitle, lang)}
        body={say(OB.apps4thBody, lang)}
        onSeePremium={() => {
          setPremium(false);
          router.push('/paywall');
        }}
      />
    </Screen>
  );
}

const st = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1, borderColor: '#EDE3E4', backgroundColor: colors.white },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
