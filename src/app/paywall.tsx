import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { pose, roasterName, type Pose } from '@/characters';
import { CloseIcon } from '@/components/icons';
import { Button, Character, LinkButton, T } from '@/components/ui';
import { FOUNDING, FOUNDING_PLAN, PLAN_TERMS, PLANS, TEST_BUILD, type PlanId } from '@/lib/plans';
import { useSettings } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

export type PaywallReason = 'apps' | 'unhinged' | 'stats' | 'archive' | 'strict' | 'worst-hour' | 'half-day' | 'game' | 'ended';

/** Headline and pose per entry point (Product Book C9). Fun first, in the roaster's voice. */
const ENTRY: Record<PaywallReason, { title: string; pose: Pose }> = {
  apps: { title: "Three apps? You've got at least six problems.", pose: 'savage' },
  unhinged: { title: 'You want it meaner? Respect.', pose: 'evilGrin' },
  stats: { title: 'The long game is Premium.', pose: 'chess' },
  archive: { title: 'Every roast, kept forever? Premium.', pose: 'chess' },
  strict: { title: 'Want me stricter? Say less.', pose: 'padlock' },
  'worst-hour': { title: 'I know the hour you crack. Want to see it?', pose: 'magnifier' },
  'half-day': { title: 'Half a day off? Classy. That’s Premium.', pose: 'vip' },
  game: { title: 'That game’s Premium. So is Hard mode.', pose: 'controller' },
  ended: { title: 'Premium ended. I’ll still roast you for free.', pose: 'goodbye' },
};

const BENEFITS: [string, string][] = [
  ['Watch up to 6 apps', 'Free watches 3. Weekday and weekend limits too.'],
  ['Unhinged mode', 'The meanest level. Still never about looks or family.'],
  ['Every snooze game, Hard mode, Strict mode', 'Plus a 2-minute snooze and your own words shown back to you.'],
  ['Month view and your weakest hour', 'Find out exactly when you crack.'],
  ['Half-day and one-app leaves', 'Same Loops, more ways to spend them.'],
];

/**
 * Screen 20 · Premium paywall v2. Only ever opened from a Premium feature (never on the roast screen, never a fake countdown).
 * Launch prices, the founding lifetime offer and a 7-day trial on yearly. No Play Billing yet: test builds flip a switch
 * so the Premium screens can be checked, and show the welcome / ended states.
 */
export default function Paywall() {
  const { reason: r = 'apps' } = useLocalSearchParams<{ reason?: PaywallReason }>();
  const reason: PaywallReason = r in ENTRY ? r : 'apps';
  const roaster = useSettings((s) => s.roaster);
  const premium = useSettings((s) => s.premium);
  const setSettings = useSettings((s) => s.set);
  const [plan, setPlan] = useState<PlanId>('yearly');
  const [touched, setTouched] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [state, setState] = useState<'offer' | 'welcome' | 'ended'>(reason === 'ended' && !premium ? 'ended' : 'offer');
  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));

  if (state === 'welcome') return <Welcome onClose={close} />;

  const ended = state === 'ended';
  const dark = reason === 'unhinged' && !ended;
  const ink = dark ? colors.white : colors.ink;
  const muted = dark ? 'rgba(255,255,255,0.7)' : colors.muted;
  // Picking a plan swaps the pose: a key for the trial, a crown for the founding lifetime.
  const face: Pose = ended ? 'goodbye' : touched && plan === 'yearly' ? 'key' : touched && plan === 'lifetime' && FOUNDING ? 'crown' : ENTRY[reason].pose;
  const title = ended ? ENTRY.ended.title : ENTRY[reason].title;

  const buy = () => {
    if (TEST_BUILD) {
      if (premium) {
        // Turning test Premium off takes Unhinged away too, and shows the "Premium ended" state.
        setSettings({ premium: false, ...(useSettings.getState().intensity === 'unhinged' ? { intensity: 'savage' as const } : {}) });
        setState('ended');
      } else {
        setSettings({ premium: true });
        setState('welcome');
      }
      return;
    }
    setNote('Purchases open when Endloop launches on the Play Store. Nothing was charged.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.darkBg : colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={[st.close, { backgroundColor: dark ? 'rgba(255,255,255,0.14)' : colors.surface }]}>
            <CloseIcon size={20} color={ink} />
          </Pressable>
          <View style={[st.launch, dark && { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
            <T v="bodyBold" style={{ fontSize: 11, letterSpacing: 1, color: dark ? colors.white : colors.red }}>LAUNCH PRICE</T>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingLeft: 12, paddingRight: 20 }}>
          <Animated.View key={face} entering={FadeIn.duration(200)}>
            <Character source={pose(roaster, face)} size={130} alt={`${roasterName[roaster]}, ${ALT[face] ?? 'smug'}`} fadeTo={dark ? colors.darkBg : colors.bg} />
          </Animated.View>
          <T style={{ flex: 1, paddingBottom: 18, fontFamily: fonts.display, fontSize: 28, lineHeight: 30, color: ink }}>{title}</T>
        </View>
        {ended ? (
          <T style={{ paddingHorizontal: 24, paddingTop: 4, color: muted }}>
            Free still roasts 3 apps, keeps your Loops and leaves, and the week view. Your history stays on this phone. Come back any time.
          </T>
        ) : null}

        <View style={{ gap: 12, paddingHorizontal: 24, paddingTop: 14 }}>
          {ended ? <T v="label" style={{ fontSize: 11, color: muted }}>What you had</T> : null}
          {BENEFITS.map(([t, d]) => (
            <View key={t} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[st.tick, ended && { backgroundColor: colors.line }]}>
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
        </View>

        <View accessibilityRole="radiogroup" style={{ gap: 12, paddingHorizontal: 24, paddingTop: 22 }}>
          {PLANS.map((p) => {
            const on = p.id === plan;
            const founding = p.id === 'lifetime' && FOUNDING;
            const cardInk = dark && !on ? colors.white : colors.ink;
            const cardMuted = dark && !on ? 'rgba(255,255,255,0.7)' : colors.muted;
            const badge = founding ? FOUNDING_PLAN.badge : p.badge;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${p.name}, ${founding ? FOUNDING_PLAN.price : p.price}`}
                onPress={() => {
                  setPlan(p.id);
                  setTouched(true);
                }}
                style={[
                  st.plan,
                  { borderColor: on ? colors.red : dark ? 'transparent' : colors.line, backgroundColor: on || !dark ? colors.white : 'rgba(255,255,255,0.12)' },
                  founding && !dark && { backgroundColor: '#FFF3E0' },
                ]}>
                {badge ? (
                  <View style={[st.badge, founding && { backgroundColor: colors.ink }]}>
                    <T v="bodyBold" style={{ fontSize: 11, color: colors.white }}>{badge}</T>
                  </View>
                ) : null}
                <View style={[st.radio, on ? { borderWidth: 7, borderColor: colors.red } : { borderColor: dark ? 'rgba(255,255,255,0.4)' : colors.line }]} />
                <View style={{ flex: 1 }}>
                  <T v="bodyBold" style={{ color: cardInk }}>{p.name}</T>
                  <T v="caption" style={{ fontSize: 12, color: cardMuted }}>{founding ? FOUNDING_PLAN.sub : p.sub}</T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {founding ? <T v="caption" style={{ fontSize: 12, color: cardMuted, textDecorationLine: 'line-through' }}>{FOUNDING_PLAN.was}</T> : null}
                  <T v="bodyBold" style={{ fontSize: 15, color: cardInk }}>{founding ? FOUNDING_PLAN.price : p.price}</T>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 10, paddingHorizontal: 24, paddingTop: 18 }}>
          <Button label={TEST_BUILD && premium ? 'Turn off test Premium' : ended ? 'Come back to Premium' : PLAN_TERMS[plan].cta} onPress={buy} />
          {TEST_BUILD ? (
            <T v="caption" style={{ fontSize: 12, textAlign: 'center', color: muted }}>
              {premium ? 'Test build: test Premium is on.' : 'Test build: this turns on test Premium. Nothing is charged.'}
            </T>
          ) : null}
          {note ? <T v="bodyBold" style={{ fontSize: 13, textAlign: 'center', color: colors.heads }}>{note}</T> : null}
          <T v="caption" style={{ fontSize: 12, textAlign: 'center', color: muted }}>
            {PLAN_TERMS[plan].terms} Launch prices may go up later; you keep yours.
          </T>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <T v="caption" style={{ fontSize: 12, color: muted }}>Restore purchase</T>
            <T v="caption" style={{ fontSize: 12, color: muted }}>·</T>
            <Pressable accessibilityRole="link" onPress={() => router.push('/privacy')}>
              <T v="caption" style={{ fontSize: 12, color: muted, textDecorationLine: 'underline' }}>Privacy</T>
            </Pressable>
          </View>
        </View>

        <T v="bodyBold" style={{ textAlign: 'center', paddingTop: 16, paddingHorizontal: 24, fontSize: 15, color: ink }}>
          {ended ? '“Same app. Fewer toys. I’m still watching.”' : '“₹17 a month to scroll less. Cheaper than your next impulse buy.”'}
        </T>
      </ScrollView>
    </SafeAreaView>
  );
}

const ALT: Partial<Record<Pose, string>> = {
  savage: 'smug in pixel sunglasses',
  evilGrin: 'grinning wickedly',
  chess: 'moving a chess piece',
  padlock: 'holding a gold padlock',
  magnifier: 'peering through a magnifying glass',
  vip: 'holding a gold card',
  controller: 'holding a game controller',
  goodbye: 'waving goodbye',
  key: 'handing over a key',
  crown: 'wearing a crown',
};

/* ---------- welcome to Premium ---------- */

const TRY: { label: string; sub: string; to: Href }[] = [
  { label: 'Add more apps', sub: 'Up to 6 now.', to: '/prefs/limits' },
  { label: 'Snooze and Strict mode', sub: '2-minute snooze, Hard mode, your own words.', to: '/prefs/snooze' },
  { label: 'Report Card · Month', sub: 'And the hour you crack.', to: '/stats' },
];

function Welcome({ onClose }: { onClose: () => void }) {
  const roaster = useSettings((s) => s.roaster);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}>
        <View style={{ alignItems: 'center', paddingTop: 24 }}>
          <Character source={pose(roaster, 'bow')} size={220} alt={`${roasterName[roaster]} taking a bow`} fadeTo={colors.bg} />
        </View>
        <T style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.ink, textAlign: 'center' }}>Welcome to Premium.</T>
        <T style={{ paddingTop: 6, color: colors.muted, textAlign: 'center' }}>I bowed once. Don&apos;t get used to it. Premium only makes me stricter, never softer.</T>
        <View style={{ gap: 10, paddingTop: 24 }}>
          <T v="label" style={{ fontSize: 11, color: colors.muted }}>Try these first</T>
          {TRY.map((x) => (
            <Pressable key={x.label} accessibilityRole="button" onPress={() => router.replace(x.to)} style={st.tryRow}>
              <View style={{ flex: 1 }}>
                <T v="bodyBold" style={{ fontSize: 15 }}>{x.label}</T>
                <T v="caption">{x.sub}</T>
              </View>
              <T v="bodyBold" style={{ fontSize: 20, color: colors.red }}>›</T>
            </Pressable>
          ))}
        </View>
        <View style={{ flex: 1, minHeight: 24 }} />
        <Button label="Let’s go" onPress={onClose} />
        <View style={{ alignItems: 'center' }}>
          <LinkButton label="Manage subscription in Play Store" onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions').catch(() => {})} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  launch: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#FFE1E5' },
  tick: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2 },
  badge: { position: 'absolute', top: -10, right: 14, backgroundColor: colors.red, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  tryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.surface },
});
