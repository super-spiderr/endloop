import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { pose, type Pose } from '@/characters';
import { LimitSlider } from '@/components/limit-slider';
import { AppTile, BrandBar, Button, Character, Screen, T } from '@/components/ui';
import { fmt, fmtLimit, snapLimit, suggestedLimit } from '@/lib/time';
import { useSettings, type TrackedApp } from '@/store/settings';
import { colors, fonts, radius } from '@/theme/tokens';

type Reaction = { text: string; face: Pose };

/** Under 5 minutes a day there's no real habit to compare against. */
const barelyUsed = (app: TrackedApp) => app.avgDailyMin < 5;
const isOver = (app: TrackedApp) => !barelyUsed(app) && app.limitMin > app.avgDailyMin;

function reactionFor(app: TrackedApp): Reaction {
  const suggested = suggestedLimit(app.avgDailyMin);
  if (barelyUsed(app)) return { text: `You barely open ${app.label}. Sure this is the problem?`, face: 'shrug' };
  if (app.limitMin > app.avgDailyMin) return { text: 'Why did you even install me?', face: 'facepalm' };
  if (app.limitMin === snapLimit(app.avgDailyMin)) return { text: 'So… exactly what you already do.', face: 'deadpan' };
  if (app.limitMin < suggested * 0.5) return { text: "Ambitious. I respect it. I don't believe it, but I respect it.", face: 'skeptical' };
  return { text: 'Reasonable. Suspiciously reasonable.', face: 'thinking' };
}

/** Screen 5 · Set limits. */
export default function Limits() {
  const { roaster, tracked, hasUsageAccess, setLimit } = useSettings();
  const [lastTouched, setLastTouched] = useState<string | null>(null);

  const touched = tracked.find((a) => a.packageName === lastTouched) ?? tracked[0];
  const reaction = touched ? reactionFor(touched) : { text: 'Reasonable. Suspiciously reasonable.', face: 'thinking' as Pose };

  const perDay = tracked.reduce((sum, a) => sum + Math.max(0, a.avgDailyMin - a.limitMin), 0);
  const weekHours = Math.round((perDay * 7) / 60);

  const change = (app: TrackedApp, min: number) => {
    setLastTouched(app.packageName);
    setLimit(app.packageName, min);
  };

  return (
    <Screen>
      <BrandBar step={5} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 14 }}>
          <T v="display">How much is too much?</T>
          {tracked.map((app) => {
            const low = !hasUsageAccess || barelyUsed(app);
            const over = hasUsageAccess && isOver(app);
            const suggested = hasUsageAccess ? suggestedLimit(app.avgDailyMin) : 30;
            // Drop chips that land on the same value, so only one can be selected at a time.
            const chips = [
              { label: 'Suggested', value: suggested },
              ...(low ? [] : [{ label: 'Half', value: snapLimit(app.avgDailyMin / 2) }]),
              { label: '30 min', value: 30 },
              { label: '1 hour', value: 60 },
            ].filter((c, i, all) => all.findIndex((o) => o.value === c.value) === i);
            return (
              <View key={app.packageName} style={[st.card, over && { borderColor: colors.heads, borderWidth: 2 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <AppTile label={app.label} color={app.color} iconUri={app.iconUri} size={40} />
                  <View style={{ flex: 1 }}>
                    <T v="bodyBold">{app.label}</T>
                    {!hasUsageAccess ? null : over ? (
                      <T v="caption" style={{ color: colors.heads, fontFamily: fonts.bold }}>Above your {fmt(app.avgDailyMin)} average</T>
                    ) : low ? (
                      <T v="caption">Barely used this week</T>
                    ) : (
                      <T v="caption">You average {fmt(app.avgDailyMin)} a day</T>
                    )}
                  </View>
                  <T style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 30, color: colors.ink }}>{fmtLimit(app.limitMin)}</T>
                </View>
                <LimitSlider
                  value={app.limitMin}
                  average={low ? null : app.avgDailyMin}
                  accent={over ? colors.heads : colors.red}
                  label={`${app.label} daily limit`}
                  onChange={(m) => change(app, m)}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  {chips.map((c) => {
                    const on = app.limitMin === c.value;
                    return (
                      <Pressable
                        key={c.label}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        onPress={() => change(app, c.value)}
                        style={[st.chip, on && { backgroundColor: colors.red, borderColor: colors.red }]}>
                        <T v="bodyBold" style={{ fontSize: 13, color: on ? colors.white : colors.ink }}>{c.label}</T>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
          {hasUsageAccess && !tracked.every(barelyUsed) ? (
            weekHours > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <T>This saves you about</T>
                <T style={{ fontFamily: fonts.display, fontSize: 22, color: colors.red }}>{weekHours} hours a week</T>
              </View>
            ) : (
              <T v="bodyBold" style={{ color: colors.heads }}>This saves you nothing. Zero. Nada.</T>
            )
          ) : null}
        </View>

        <View style={{ flex: 1, minHeight: 16 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 12 }}>
          {/* The roaster reacts as you drag: standing next to the bubble, not shrunk into a dot. */}
          <View accessibilityLiveRegion="polite" style={st.react}>
            <Character source={pose(roaster, reaction.face)} size={128} alt="" fadeTo={colors.bg} />
            <View style={st.bubble}>
              <T v="bodyBold" style={{ fontSize: 16, lineHeight: 21, color: colors.white }}>{reaction.text}</T>
            </View>
          </View>
          <T v="caption" style={{ textAlign: 'center' }}>Limits reset every day at midnight.</T>
          <Button label="Lock it in" onPress={() => router.push('/onboarding/permissions')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  react: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginLeft: -12 },
  bubble: { flex: 1, marginBottom: 24, backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4 },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  chip: { height: 30, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, justifyContent: 'center' },
});
