import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { pose, roasterName, type Pose } from '@/characters';
import { BatteryIcon, BellIcon, CheckIcon, LayersIcon, WarnIcon } from '@/components/icons';
import { BrandBar, Button, Character, LinkButton, Screen, T } from '@/components/ui';
import { appIconSupported } from '@/lib/app-icon';
import { useOnReturn } from '@/lib/hooks';
import { batterySteps, checkPermissions, openBatterySettings, openOverlaySettings, requestNotifications } from '@/lib/permissions';
import { localDay, useSettings, type PermissionState } from '@/store/settings';
import { colors, fonts, radius } from '@/theme/tokens';

type Key = 'notifications' | 'overlay' | 'battery';
type CardState = 'waiting' | 'active' | 'done' | 'skipped';

const CARDS: { key: Key; title: string; line: string; button: string; Icon: typeof BellIcon }[] = [
  { key: 'notifications', title: 'Notifications', line: 'So I can warn you before I get mean.', button: 'Allow', Icon: BellIcon },
  { key: 'overlay', title: 'Display over apps', line: 'So I can interrupt you mid-scroll. Rudely.', button: 'Turn on', Icon: LayersIcon },
  { key: 'battery', title: 'Battery', line: "So your phone doesn't put me to sleep on the job.", button: 'Fix it', Icon: BatteryIcon },
];

/** Screen 6 · Final permissions. Easiest first; each card lights up in turn. */
export default function Permissions() {
  const { roaster, permissions, setPermission, set } = useSettings();
  const waitingFor = useRef<Key | null>(null);

  // Check the real state when the user comes back from a Settings page.
  // (Without the native core we can't check, so returning counts as granted.)
  useOnReturn(() => {
    const k = waitingFor.current;
    if (!k) return;
    waitingFor.current = null;
    const real = checkPermissions()[k];
    const ok = real === null ? true : real;
    if (ok) {
      setPermission(k, 'granted');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (k === 'battery') {
      // brand-specific settings can't be verified; let them continue, marked amber
      setPermission('battery', 'skipped');
    }
  });

  // Anything already allowed (reinstall, or granted earlier) is ticked straight away.
  useEffect(() => {
    const now = checkPermissions();
    (['notifications', 'overlay', 'battery'] as Key[]).forEach((k) => {
      if (now[k] === true && useSettings.getState().permissions[k] !== 'granted') setPermission(k, 'granted');
    });
  }, [setPermission]);

  const firstOpen = CARDS.find((c) => permissions[c.key] === 'pending')?.key;
  const stateOf = (k: Key): CardState => {
    const p: PermissionState = permissions[k];
    if (p === 'granted') return 'done';
    if (p === 'skipped') return 'skipped';
    return k === firstOpen ? 'active' : 'waiting';
  };

  const done = CARDS.filter((c) => permissions[c.key] === 'granted').length;
  const allAnswered = CARDS.every((c) => permissions[c.key] !== 'pending');
  const face: Pose = done === 3 ? 'knuckles' : permissions.overlay === 'skipped' ? 'disbelief' : done >= 1 ? 'waiting' : 'clipboard';
  const steps = batterySteps();

  const act = async (k: Key) => {
    if (k === 'notifications') {
      const ok = await requestNotifications();
      setPermission('notifications', ok ? 'granted' : 'skipped');
      return;
    }
    waitingFor.current = k;
    if (k === 'overlay') await openOverlaySettings();
    else await openBatterySettings();
  };

  return (
    <Screen>
      <BrandBar step={6} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {/* Hero: the roaster gets the space, the title sits beside them. */}
        <LinearGradient colors={done === 3 ? [colors.chillTint, '#C4E8D7'] : [colors.surface, colors.blush]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
          <View style={st.heroChar} pointerEvents="none">
            <Character source={pose(roaster, face)} size={210} alt={`${roasterName[roaster]}, getting ready`} />
          </View>
          <View style={{ width: '56%', gap: 12 }}>
            <T v="display" style={{ fontSize: 28, lineHeight: 31 }}>3 quick things and I&apos;m ready.</T>
            <View style={[st.donePill, { backgroundColor: colors.white }]}>
              <View style={[st.doneDot, { backgroundColor: done === 3 ? colors.chill : colors.red }]} />
              <T v="bodyBold" style={{ fontSize: 13, color: done === 3 ? colors.chill : colors.red }}>{done} of 3 done</T>
            </View>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 10 }}>
          {CARDS.map((c) => {
            const s = stateOf(c.key);
            return (
              <PermCard key={c.key} card={c} state={s} onPress={() => act(c.key)} onSkip={c.key === 'overlay' && s === 'active' ? () => setPermission('overlay', 'skipped') : undefined}>
                {c.key === 'battery' && s === 'active' && steps ? (
                  <View style={st.steps}>
                    <T v="bodyBold" style={{ fontSize: 13 }}>On your {steps.brand} phone</T>
                    {steps.steps.map((line, i) => (
                      <T key={i} style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.ink }}>{`${i + 1}. ${line}`}</T>
                    ))}
                  </View>
                ) : null}
              </PermCard>
            );
          })}
          {permissions.overlay === 'skipped' ? (
            <View accessibilityRole="alert" style={st.warn}>
              <WarnIcon />
              <T style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink }}>Without this, I can only send notifications. Be honest, you&apos;ll ignore them.</T>
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1, minHeight: 16 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <Button
            label="I'm ready"
            disabled={!allAnswered}
            onPress={() => {
              // Screen 17: offer the roaster's face as the app icon when this build supports it.
              if (appIconSupported()) return router.push('/onboarding/app-icon');
              set({ onboarded: true, streakDays: 1, startedAt: localDay() });
              router.replace('/today');
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function PermCard({
  card,
  state,
  onPress,
  onSkip,
  children,
}: {
  card: (typeof CARDS)[number];
  state: CardState;
  onPress: () => void;
  onSkip?: () => void;
  children?: ReactNode;
}) {
  const col = { waiting: colors.muted, active: colors.red, done: colors.chill, skipped: colors.heads }[state];
  const { Icon } = card;
  return (
    <View
      style={[
        st.card,
        state === 'active' && { borderColor: colors.red, borderWidth: 2, backgroundColor: colors.white },
        state === 'skipped' && { borderColor: colors.heads, borderWidth: 2, backgroundColor: colors.white },
        state === 'waiting' && { opacity: 0.55 },
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[st.icon, { backgroundColor: state === 'done' ? colors.chillTint : colors.blush }]}>
          <Icon color={col} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="bodyBold">{card.title}</T>
          <T v="caption">{card.line}</T>
        </View>
        {state === 'done' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[st.tick, { backgroundColor: colors.chill }]}>
              <CheckIcon size={16} />
            </View>
            <T v="bodyBold" style={{ fontSize: 14, color: colors.chill }}>Done</T>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={state === 'waiting'}
            onPress={onPress}
            style={[st.btn, state === 'active' ? { backgroundColor: colors.red } : { borderWidth: 1.5, borderColor: col, backgroundColor: colors.white }]}>
            <T v="bodyBold" style={{ fontSize: 14, color: state === 'active' ? colors.white : col }}>{card.button}</T>
          </Pressable>
        )}
      </View>
      {children}
      {onSkip ? (
        <View style={{ alignItems: 'flex-end', marginTop: -6 }}>
          <LinkButton label="Skip for now" onPress={onSkip} />
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  hero: { marginHorizontal: 24, marginTop: 8, minHeight: 210, padding: 20, borderRadius: 28, overflow: 'hidden', justifyContent: 'center' },
  heroChar: { position: 'absolute', right: -34, bottom: 0 },
  donePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 12, borderRadius: 999 },
  doneDot: { width: 8, height: 8, borderRadius: 4 },
  card: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btn: { height: 38, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  steps: { gap: 4, padding: 12, borderRadius: 12, backgroundColor: colors.surface },
  warn: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.headsTint, borderRadius: radius.md - 2, padding: 14 },
});
