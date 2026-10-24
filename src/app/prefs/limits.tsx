import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PremiumSheet } from '@/components/premium-sheet';
import { BEDTIMES, Chevron, Group, NavRow, Row, SubScreen, bedtimeLabel, settingsStyles } from '@/components/settings-ui';
import { LoopsIcon, StarIcon } from '@/components/icons';
import { AppTile, Sheet, T } from '@/components/ui';
import { usage, type TodayUsage } from '@/data/usage';
import { earns } from '@/lib/attendance';
import { fmt, fmtLimit } from '@/lib/time';
import { FREE_APPS, PREMIUM_APPS } from '@/lib/plans';
import { limitOn, useSettings, watchedApps } from '@/store/settings';
import { colors } from '@/theme/tokens';

/**
 * Settings → Apps and limits (canvas S24-A): each app with today's use, its normal, how far the limit
 * cuts it and whether it earns Loops; tap one for its detail screen. Then bedtime and the weekly roast time.
 */
export default function LimitPrefs() {
  const s = useSettings();
  const [bedtime, setBedtime] = useState(false);
  const [premium, setPremium] = useState(false);
  const [today, setToday] = useState<TodayUsage>({});
  const pkgs = s.tracked.map((a) => a.packageName).join(',');
  useEffect(() => {
    if (pkgs) usage.today(pkgs.split(',')).then(setToday).catch(() => {});
  }, [pkgs]);
  const max = s.premium ? PREMIUM_APPS : FREE_APPS;
  const watched = new Set(watchedApps(s).map((a) => a.packageName));

  return (
    <SubScreen title="Apps and limits" intro="Stay under a limit to earn Loops for that app. Your normal comes from your last 7 days.">
      <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 10 }}>
        {watched.size < s.tracked.length ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/keep-apps')} style={st.ended}>
            <T v="bodyBold" style={{ fontSize: 15, color: colors.ink }}>Premium ended. Pick 3 apps to keep.</T>
            <T v="caption">Till then only your 3 most used are watched. Faded ones aren&apos;t.</T>
          </Pressable>
        ) : null}
        {s.tracked.map((a) => {
          const limit = limitOn(a, s);
          const used = today[a.packageName] ?? 0;
          const over = used > limit;
          const cut = a.avgDailyMin > 0 ? Math.round(((limit - a.avgDailyMin) / a.avgDailyMin) * 100) : null;
          const earning = earns(a);
          return (
            <Pressable key={a.packageName} accessibilityRole="button" accessibilityLabel={`${a.label}, ${fmt(used)} of ${fmtLimit(limit)} today`} onPress={() => router.push(`/app/${encodeURIComponent(a.packageName)}`)} style={[st.card, !watched.has(a.packageName) && { opacity: 0.45 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <AppTile label={a.label} color={a.color} iconUri={a.iconUri} size={38} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="bodyBold" style={{ fontSize: 16 }}>{a.label}</T>
                  <T v="caption" style={{ fontSize: 13 }}>
                    Today <T v="caption" style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>{fmt(used)}</T> of {fmtLimit(limit)}
                    {a.nextLimitMin != null ? ` · ${fmtLimit(a.nextLimitMin)} from tomorrow` : ''}
                    {a.removeFrom ? ' · stops tomorrow' : ''}
                  </T>
                </View>
                <Chevron />
              </View>
              <View style={st.track}>
                <View style={{ width: `${Math.max(2, Math.min(100, (used / Math.max(1, limit)) * 100))}%`, height: 6, borderRadius: 3, backgroundColor: over ? colors.red : colors.chill }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <T v="caption" style={{ fontSize: 12 }}>
                  Normal {fmtLimit(a.avgDailyMin)}{cut != null ? ` · limit ${cut <= 0 ? '−' : '+'}${Math.abs(cut)}%` : ''}
                  {s.premium && a.weekendLimitMin != null ? ` · weekends ${fmtLimit(a.weekendLimitMin)}` : ''}
                </T>
                <View style={[st.pill, { backgroundColor: earning ? '#FFF6E0' : colors.surface }]}>
                  {earning ? <LoopsIcon size={11} /> : null}
                  <T v="bodyBold" style={{ fontSize: 11, color: earning ? '#8A5A00' : colors.muted }}>{earning ? 'Earning Loops' : 'Not earning'}</T>
                </View>
              </View>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => (s.tracked.length >= max ? setPremium(true) : router.push('/onboarding/pick-apps'))}
          style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12, borderStyle: 'dashed' }]}>
          <View style={st.plus}>
            <T v="bodyBold" style={{ fontSize: 20, color: colors.red }}>+</T>
          </View>
          <View style={{ flex: 1 }}>
            <T v="bodyBold" style={{ fontSize: 15 }}>{s.tracked.length ? 'Add an app' : 'Pick the apps I should watch'}</T>
            <T v="caption" style={{ fontSize: 12 }}>{s.tracked.length} of {max} {s.premium ? '' : 'free '}apps used</T>
          </View>
          {!s.premium ? (
            <View style={[st.pill, { backgroundColor: '#FFF6E0' }]}>
              <StarIcon size={10} />
              <T v="bodyBold" style={{ fontSize: 11, color: '#8A5A00' }}>Up to 6</T>
            </View>
          ) : null}
        </Pressable>
        <View style={st.note}>
          <T v="bodyBold" style={{ fontSize: 13, color: colors.red }}>Lowering a limit works right away. Raising one waits for tomorrow.</T>
        </View>
      </View>

      <Group title="Timing">
        <NavRow first label="Bedtime" value={bedtimeLabel(s.bedtimeMin)} onPress={() => setBedtime(true)} />
        <Row label="Weekly roast" sub="Your report card" right={<T v="bodyBold" style={{ fontSize: 15, color: colors.muted }}>Sun, 7 pm</T>} />
      </Group>

      <Sheet visible={bedtime} onClose={() => setBedtime(false)}>
        <T v="title">Bedtime</T>
        <T>After this, opening a tracked app gets one late-night nudge.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {BEDTIMES.map((m) => {
            const on = s.bedtimeMin === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  s.set({ bedtimeMin: m });
                  setBedtime(false);
                }}
                style={[settingsStyles.chip, on && { backgroundColor: colors.red, borderColor: colors.red }]}>
                <T v="bodyBold" style={{ fontSize: 14, color: on ? colors.white : colors.ink }}>{bedtimeLabel(m)}</T>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
      <PremiumSheet visible={premium} onClose={() => setPremium(false)} roaster={s.roaster} reason="apps" />
    </SubScreen>
  );
}

const st = StyleSheet.create({
  ended: { gap: 4, padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: colors.red, backgroundColor: colors.blush },
  card: { gap: 10, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: 999 },
  plus: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  note: { padding: 12, borderRadius: 14, backgroundColor: colors.blush },
});
