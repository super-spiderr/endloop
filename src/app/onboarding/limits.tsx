import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { pose } from '@/characters';
import { InfoIcon, LockIcon } from '@/components/icons';
import { LimitSlider } from '@/components/limit-slider';
import { Segment, Toggle } from '@/components/settings-ui';
import { btn, Heading, NudgeSheet, PremiumTag, Quote, StepBar } from '@/components/onboarding-ui';
import { AppTile, Button, Character, Screen, Sheet, T } from '@/components/ui';
import { OB, say } from '@/content/onboarding';
import { fmt, fmtLimit, HEAVY_DAILY_MIN, snapLimit } from '@/lib/time';
import { useSettings, type TrackedApp } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

/** Under 5 minutes a day there's no real habit to compare against. */
const barelyUsed = (app: TrackedApp) => app.avgDailyMin < 5;
const earning = (app: TrackedApp, limit: number) => !barelyUsed(app) && limit < app.avgDailyMin;

type Days = 'weekdays' | 'weekends';

/** Onboarding v2 · Step 5: limits, with the Earning Loops pill, the Loops explainer and the weekend Premium nudge. */
export default function Limits() {
  const { roaster, roastLang: lang, tracked, hasUsageAccess, revealDailyMin, premium, weekendLimits, setLimit, set } = useSettings();
  const [days, setDays] = useState<Days>('weekdays');
  const weekends = premium && weekendLimits && days === 'weekends';
  const limitOf = (app: TrackedApp) => (weekends ? (app.weekendLimitMin ?? app.limitMin) : app.limitMin);
  const changeLimit = (app: TrackedApp, m: number) => {
    if (weekends) set({ tracked: tracked.map((a) => (a.packageName === app.packageName ? { ...a, weekendLimitMin: m } : a)) });
    else setLimit(app.packageName, m);
  };
  const [lastTouched, setLastTouched] = useState<string | null>(null);
  const [loopsInfo, setLoopsInfo] = useState(false);
  const [weekend, setWeekend] = useState(false);
  const heavy = (revealDailyMin ?? 0) > HEAVY_DAILY_MIN;

  const touched = tracked.find((a) => a.packageName === lastTouched) ?? tracked[0];
  const reaction = touched ? reactionFor(touched) : say(OB.limReasonable, lang);

  function reactionFor(app: TrackedApp): string {
    if (barelyUsed(app)) return `You barely use ${app.label}. Bold pick.`;
    const limit = limitOf(app);
    if (limit > app.avgDailyMin) return limit >= 180 ? say(OB.limLifestyle, lang, { limit: fmt(limit) }) : say(OB.limAbove, lang);
    if (limit === snapLimit(app.avgDailyMin)) return say(OB.limSame, lang);
    if (limit < app.avgDailyMin * 0.6) return say(OB.limLow, lang);
    return say(OB.limReasonable, lang);
  }

  return (
    <Screen>
      <StepBar step={5} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 24, paddingTop: 12 }}>
          <View style={{ flex: 1, paddingBottom: 6, gap: 8, alignItems: 'flex-start' }}>
            {premium ? <PremiumTag /> : null}
            <Heading
              title={say(premium && tracked.length > 3 ? OB.limitsTitlePremium : OB.limitsTitle, lang)}
              sub={!hasUsageAccess ? 'Drag to set a daily limit.' : heavy ? "Suggested: 20% under your normal. You're over 4 h a day, so we start gentle." : 'Suggested: 30% under your normal. Drag to change.'}
            />
          </View>
          <Character source={pose(roaster, premium ? 'vip' : 'thinking')} size={92} alt={premium ? 'Holding a gold card' : 'Thinking'} fadeTo={colors.bg} />
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 14, gap: 10 }}>
          {premium ? (
            <>
              <View style={st.weekendOn}>
                <T style={{ flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink }}>Different limits on weekends</T>
                <Toggle
                  label="Different limits on weekends"
                  value={!!weekendLimits}
                  onChange={(v) => {
                    set({ weekendLimits: v });
                    if (!v) setDays('weekdays');
                  }}
                />
              </View>
              {weekendLimits ? (
                <Segment<Days>
                  options={[
                    ['weekdays', 'Weekdays'],
                    ['weekends', 'Weekends'],
                  ]}
                  value={days}
                  onChange={setDays}
                  style={{ marginHorizontal: 0, marginBottom: 0 }}
                />
              ) : null}
            </>
          ) : null}
          {tracked.map((app) => (
            <LimitCard
              key={`${days}-${app.packageName}`}
              app={app}
              limit={limitOf(app)}
              showNormal={hasUsageAccess && !barelyUsed(app)}
              onChange={(m) => {
                setLastTouched(app.packageName);
                changeLimit(app, m);
              }}
            />
          ))}
          {premium ? null : (
            <Pressable accessibilityRole="button" accessibilityLabel="Different limits on weekends, Premium" onPress={() => setWeekend(true)} style={st.weekend}>
              <LockIcon size={14} color="#8A5A00" />
              <T style={{ flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink }}>Different limits on weekends</T>
              <PremiumTag small />
            </Pressable>
          )}
        </View>

        <Quote text={reaction} style={{ marginHorizontal: 24, marginTop: 12 }} />
        <View style={{ flex: 1, minHeight: 16 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 10, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <T style={{ fontSize: 12, color: '#8A8A8A' }}>Limits reset at midnight.</T>
            <Pressable accessibilityRole="button" onPress={() => setLoopsInfo(true)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <InfoIcon size={14} />
              <T style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.red }}>What are Loops?</T>
            </Pressable>
          </View>
          <Button label="Set my limits" style={btn} onPress={() => router.push('/onboarding/intensity')} />
        </View>
      </ScrollView>

      <Sheet visible={loopsInfo} onClose={() => setLoopsInfo(false)}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Character source={pose(roaster, 'notes')} size={140} alt="" />
          <T accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink }}>What are Loops?</T>
          <T style={{ fontStyle: 'italic', fontSize: 14, color: colors.ink }}>“{say(OB.loopsLine, lang)}”</T>
        </View>
        <T style={st.sheetBody}>
          Set a limit <T style={st.strong}>below your normal</T> and stay under it: you earn Loops every day, up to 40.
        </T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['20', '2 of 3 apps under'],
            ['40', 'Every app under'],
            ['200', '= 1 Leave Letter'],
          ].map(([n, l]) => (
            <View key={n} style={st.tile}>
              <T style={{ fontFamily: fonts.display, fontSize: 20, color: '#8A5A00' }}>{n}</T>
              <T style={{ fontSize: 11, lineHeight: 14, color: colors.muted, textAlign: 'center' }}>{l}</T>
            </View>
          ))}
        </View>
        <T style={st.sheetBody}>
          A Leave Letter buys a whole day with <T style={st.strong}>no roasts</T>. Loops clear every Sunday at midnight, so use them.
        </T>
        <Button label="Got it" style={btn} onPress={() => setLoopsInfo(false)} />
      </Sheet>

      <NudgeSheet
        visible={weekend}
        onClose={() => setWeekend(false)}
        face={pose(roaster, 'vip')}
        title={say(OB.weekendTitle, lang)}
        body={say(OB.weekendBody, lang)}
        onSeePremium={() => {
          setWeekend(false);
          router.push('/paywall');
        }}
      />
    </Screen>
  );
}

function LimitCard({ app, limit, showNormal, onChange }: { app: TrackedApp; limit: number; showNormal: boolean; onChange: (m: number) => void }) {
  const on = earning(app, limit);
  return (
    <View style={st.card}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <AppTile label={app.label} color={app.color} iconUri={app.iconUri} size={34} />
        <View style={{ flex: 1, gap: 2 }}>
          <T style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.ink }}>{app.label}</T>
          <T style={{ fontSize: 12, color: colors.muted }}>{showNormal ? `Your normal ${fmt(app.avgDailyMin)} a day` : 'Barely used this week'}</T>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <T style={{ fontFamily: fonts.display, fontSize: 20, lineHeight: 22, color: colors.ink }}>{fmtLimit(limit)}</T>
          {showNormal ? (
            <View style={[st.pill, { backgroundColor: on ? '#FFF6E0' : '#F2F0F0' }]}>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Circle cx={12} cy={12} r={10} fill={on ? '#E8A317' : '#8A8A8A'} />
              </Svg>
              <T style={{ fontFamily: fonts.bold, fontSize: 12, color: on ? '#8A5A00' : colors.muted }}>{on ? 'Earning Loops' : 'Not earning'}</T>
            </View>
          ) : null}
        </View>
      </View>
      <LimitSlider value={limit} average={showNormal ? app.avgDailyMin : null} accent={on || !showNormal ? colors.red : '#8A8A8A'} label={`${app.label} daily limit`} onChange={onChange} />
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderColor: '#EDE3E4', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 10, backgroundColor: colors.white },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 24, paddingHorizontal: 9, borderRadius: 999 },
  weekendOn: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E8C66B', backgroundColor: '#FFFBF0' },
  weekend: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#E8C66B', backgroundColor: '#FFFBF0' },
  tile: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12, backgroundColor: '#FFF6E0' },
  sheetBody: { fontSize: 14, lineHeight: 21, color: colors.muted },
  strong: { fontFamily: fonts.bold, color: colors.ink },
});
