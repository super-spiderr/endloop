import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { pose } from '@/characters';
import { CloseIcon } from '@/components/icons';
import { Button, Character, T } from '@/components/ui';
import { PLAN_TERMS, PLANS, type PlanId } from '@/lib/plans';
import { useSettings } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

type Reason = 'apps' | 'unhinged' | 'stats' | 'archive';

const HEADLINES: Record<Reason, string> = {
  apps: 'Watching more than 3 apps? Go unlimited.',
  unhinged: 'You want it meaner? Respect.',
  stats: 'The long game is Premium.',
  archive: 'Every roast, kept forever? Premium.',
};

const BENEFITS: [string, string][] = [
  ['Unlimited apps', 'Free watches 3.'],
  ['Unhinged mode', 'The meanest level. Still never about looks or family.'],
  ['Month view and full history', 'Plus every past weekly roast.'],
];

/** Screen 15 · Premium paywall. Only ever opened from a Premium feature; never a fake countdown. */
export default function Paywall() {
  const { reason = 'apps' } = useLocalSearchParams<{ reason?: Reason }>();
  const roaster = useSettings((s) => s.roaster);
  const [plan, setPlan] = useState<PlanId>('yearly');
  const [note, setNote] = useState<string | null>(null);
  const dark = reason === 'unhinged';
  const ink = dark ? colors.white : colors.ink;
  const muted = dark ? 'rgba(255,255,255,0.7)' : colors.muted;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.darkBg : colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={[st.close, { backgroundColor: dark ? 'rgba(255,255,255,0.14)' : colors.surface }]}>
            <CloseIcon size={20} color={ink} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingLeft: 12, paddingRight: 20 }}>
          <Character source={pose(roaster, reason === 'unhinged' ? 'evilGrin' : reason === 'stats' ? 'chess' : 'savage')} size={130} alt="Loop, smug" fadeTo={dark ? colors.darkBg : colors.bg} />
          <T style={{ flex: 1, paddingBottom: 18, fontFamily: fonts.display, fontSize: 28, lineHeight: 30, color: ink }}>{HEADLINES[reason] ?? HEADLINES.apps}</T>
        </View>

        <View style={{ gap: 12, paddingHorizontal: 24, paddingTop: 14 }}>
          {BENEFITS.map(([t, d]) => (
            <View key={t} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={st.tick}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12l5 5 9-10" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <T v="bodyBold" style={{ fontSize: 15, color: ink }}>{t}</T>
                <T v="caption" style={{ color: muted }}>{d}</T>
              </View>
            </View>
          ))}
          <View style={[st.soon, { borderColor: dark ? 'rgba(255,255,255,0.3)' : colors.line }]}>
            <T v="label" style={{ fontSize: 11, color: muted }}>Coming soon</T>
            <T v="bodyBold" style={{ fontSize: 14, color: ink }}>AI roasts about your habits · more roasters · weekday and weekend limits</T>
          </View>
        </View>

        <View accessibilityRole="radiogroup" style={{ gap: 10, paddingHorizontal: 24, paddingTop: 20 }}>
          {PLANS.map((p) => {
            const on = p.id === plan;
            const cardInk = dark && !on ? colors.white : colors.ink;
            const cardMuted = dark && !on ? 'rgba(255,255,255,0.7)' : colors.muted;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setPlan(p.id)}
                style={[st.plan, { borderColor: on ? colors.red : dark ? 'transparent' : colors.line, backgroundColor: on || !dark ? colors.white : 'rgba(255,255,255,0.12)' }]}>
                {p.badge ? (
                  <View style={st.badge}>
                    <T v="bodyBold" style={{ fontSize: 11, color: colors.white }}>{p.badge}</T>
                  </View>
                ) : null}
                <View style={[st.radio, on ? { borderWidth: 7, borderColor: colors.red } : { borderColor: dark ? 'rgba(255,255,255,0.4)' : colors.line }]} />
                <View style={{ flex: 1 }}>
                  <T v="bodyBold" style={{ color: cardInk }}>{p.name}</T>
                  <T v="caption" style={{ fontSize: 12, color: cardMuted }}>{p.sub}</T>
                </View>
                <T v="bodyBold" style={{ fontSize: 15, color: cardInk }}>{p.price}</T>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 10, paddingHorizontal: 24, paddingTop: 18 }}>
          <Button
            label={PLAN_TERMS[plan].cta}
            onPress={() => setNote('Purchases open when Endloop launches on the Play Store. Nothing was charged.')}
          />
          {note ? <T v="bodyBold" style={{ fontSize: 13, textAlign: 'center', color: colors.heads }}>{note}</T> : null}
          <T v="caption" style={{ fontSize: 12, textAlign: 'center', color: muted }}>{PLAN_TERMS[plan].terms}</T>
          <T v="caption" style={{ fontSize: 12, textAlign: 'center', color: muted }}>Restore purchase · Terms · Privacy</T>
        </View>

        <T v="bodyBold" style={{ textAlign: 'center', paddingTop: 16, paddingHorizontal: 24, fontSize: 15, color: ink }}>
          &quot;Paying to scroll less. Honestly? That&apos;s growth.&quot;
        </T>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  soon: { gap: 4, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2 },
  badge: { position: 'absolute', top: -10, right: 14, backgroundColor: colors.red, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
});
