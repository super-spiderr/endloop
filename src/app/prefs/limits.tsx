import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { PremiumSheet } from '@/components/premium-sheet';
import { BEDTIMES, Chevron, Group, NavRow, Row, SubScreen, bedtimeLabel, settingsStyles } from '@/components/settings-ui';
import { AppTile, LinkButton, Sheet, T } from '@/components/ui';
import { fmtLimit } from '@/lib/time';
import { useSettings } from '@/store/settings';
import { colors } from '@/theme/tokens';

/** Settings → Apps and limits: tracked apps (tap one for its detail screen), bedtime, weekly roast time. */
export default function LimitPrefs() {
  const s = useSettings();
  const [bedtime, setBedtime] = useState(false);
  const [premium, setPremium] = useState(false);
  return (
    <SubScreen title="Apps and limits" intro="Lowering a limit is instant. Raising it waits for tomorrow.">
      <Group title={`Watching ${s.tracked.length} ${s.tracked.length === 1 ? 'app' : 'apps'}`}>
        {s.tracked.length ? (
          s.tracked.map((a, i) => (
            <Row
              key={a.packageName}
              first={i === 0}
              icon={<AppTile label={a.label} color={a.color} iconUri={a.iconUri} size={36} />}
              label={a.label}
              sub={`${fmtLimit(a.limitMin)} a day${a.nextLimitMin != null ? ` · ${fmtLimit(a.nextLimitMin)} from tomorrow` : ''}${a.removeFrom ? ' · stops tomorrow' : ''}`}
              right={<Chevron />}
              onPress={() => router.push(`/app/${encodeURIComponent(a.packageName)}`)}
            />
          ))
        ) : (
          <Row first label="No apps yet" sub="Pick the ones you want me to watch" right={<Chevron />} onPress={() => router.push('/onboarding/pick-apps')} />
        )}
      </Group>
      {s.tracked.length >= 3 ? (
        <View style={{ alignItems: 'center', paddingTop: 4 }}>
          <LinkButton label="Watch more apps with Premium" color={colors.red} onPress={() => setPremium(true)} />
        </View>
      ) : null}

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
