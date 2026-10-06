import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { pose } from '@/characters';
import { CheckIcon, SearchIcon } from '@/components/icons';
import { PremiumSheet } from '@/components/premium-sheet';
import { AppTile, BrandBar, Button, Character, Pill, Screen, SpeechBubble, T } from '@/components/ui';
import { usage, USUAL_SUSPECTS, type InstalledApp } from '@/data/usage';
import { fmt, suggestedLimit } from '@/lib/time';
import { useSettings } from '@/store/settings';
import { colors, fonts, radius } from '@/theme/tokens';

const FREE_APPS = 3;

const REACTIONS: Record<string, string> = {
  'com.instagram.android': 'Classic.',
  'com.google.android.youtube': "'Just one video.' Sure.",
  'com.snapchat.android': "Streaks don't count as a personality.",
};

/** Screen 3 · The damage / pick apps. */
export default function PickApps() {
  const { roaster, hasUsageAccess, set } = useSettings();
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [reaction, setReaction] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    usage.listApps().then((list) => {
      const ordered = hasUsageAccess
        ? list
        : [...list.filter((a) => USUAL_SUSPECTS.includes(a.packageName)), ...list.filter((a) => !USUAL_SUSPECTS.includes(a.packageName))];
      setApps(ordered);
      if (hasUsageAccess) setSelected(ordered.slice(0, FREE_APPS).map((a) => a.packageName));
    });
  }, [hasUsageAccess]);

  const visible = useMemo(() => apps.filter((a) => a.label.toLowerCase().includes(query.trim().toLowerCase())), [apps, query]);

  const toggle = (app: InstalledApp) => {
    if (selected.includes(app.packageName)) {
      Haptics.selectionAsync();
      setSelected(selected.filter((p) => p !== app.packageName));
      return;
    }
    if (selected.length >= FREE_APPS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setReaction('Interesting choice.');
      setPremium(true);
      return;
    }
    Haptics.selectionAsync();
    setSelected([...selected, app.packageName]);
    setReaction(REACTIONS[app.packageName] ?? 'Interesting choice.');
  };

  const confirm = () => {
    const chosen = apps.filter((a) => selected.includes(a.packageName));
    set({
      tracked: chosen.map((a) => ({
        packageName: a.packageName,
        label: a.label,
        color: a.color,
        iconUri: a.iconUri,
        avgDailyMin: a.avgDailyMin,
        weekMin: a.weekMin,
        limitMin: hasUsageAccess ? suggestedLimit(a.avgDailyMin) : 60,
      })),
      // Stats compares against this: the last 7 days on these apps, before Endloop
      baselineDailyMin: hasUsageAccess && chosen.some((a) => a.avgDailyMin > 0) ? chosen.reduce((s, a) => s + a.avgDailyMin, 0) : undefined,
    });
    router.push('/onboarding/intensity');
  };

  return (
    <Screen>
      <BrandBar step={3} />
      <View style={{ alignItems: 'center', paddingHorizontal: 24, gap: 6 }}>
        <Character source={pose(roaster, hasUsageAccess ? 'present' : 'blind')} size={{ width: 250, height: 188 }} alt={hasUsageAccess ? 'Loop, palms up, presenting the damage' : "Loop, blindfolded: can't see your usage"} fadeTo={colors.bg} position="top" />
        <T v="display" style={{ fontSize: 30, lineHeight: 33, textAlign: 'center' }}>
          {hasUsageAccess ? "Okay. Here's the damage." : 'Which apps are ruining your life?'}
        </T>
        <T style={{ textAlign: 'center' }}>Pick up to 3. I&apos;ll keep an eye on them.</T>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 12 }}>
        <View style={st.search}>
          <SearchIcon />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search apps"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Search apps"
            style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, paddingVertical: 0 }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: hasUsageAccess ? 'space-between' : 'flex-end', alignItems: 'center' }}>
          {hasUsageAccess ? <T v="label">Last 7 days</T> : null}
          <Pill text={`${selected.length} of ${FREE_APPS} free`} color={colors.red} bg={colors.blush} />
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(a) => a.packageName}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 10, gap: 10 }}
        renderItem={({ item }) => {
          const on = selected.includes(item.packageName);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${item.label}${hasUsageAccess ? `, ${fmt(item.weekMin)} last week` : ''}`}
              onPress={() => toggle(item)}
              style={[st.row, on ? { backgroundColor: colors.surface, borderColor: colors.red, borderWidth: 2 } : null]}>
              <AppTile label={item.label} color={item.color} iconUri={item.iconUri} />
              <T v="bodyBold" style={{ flex: 1 }}>{item.label}</T>
              {hasUsageAccess ? <T v="bodyBold" style={{ fontSize: 15 }}>{fmt(item.weekMin)}</T> : null}
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
        {reaction ? <SpeechBubble face={pose(roaster, 'armsCrossed')} text={reaction} /> : null}
        <Button label="Watch these" disabled={!selected.length} onPress={confirm} />
      </View>

      <PremiumSheet visible={premium} onClose={() => setPremium(false)} roaster={roaster} reason="apps" />
    </Screen>
  );
}

const st = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
