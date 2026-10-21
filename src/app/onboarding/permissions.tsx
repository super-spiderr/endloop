import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { pose, roasterName, type Pose } from '@/characters';
import { BatteryIcon, BellIcon, CheckIcon, LayersIcon, WarnIcon } from '@/components/icons';
import { RestrictedHelp } from '@/components/restricted-help';
import { btn, Heading, StepBar } from '@/components/onboarding-ui';
import { Button, Character, LinkButton, Screen, T } from '@/components/ui';
import { useOnReturn } from '@/lib/hooks';
import { batteryNeededUpfront, batterySteps, checkPermissions, openBatterySettings, openBrandBackgroundSettings, openOverlaySettings, requestNotifications, restrictedSettingsLikely } from '@/lib/permissions';
import { useSettings, type PermissionState } from '@/store/settings';
import { colors, fonts, radius } from '@/theme/tokens';

type Key = 'notifications' | 'overlay' | 'battery';
const MORE: Record<number, string> = { 1: 'One more thing', 2: 'Two more things', 3: 'Three more things' };
type CardState = 'waiting' | 'active' | 'done' | 'skipped';

const CARDS: { key: Key; title: string; line: string; button: string; Icon: typeof BellIcon }[] = [
  { key: 'overlay', title: 'Display over other apps', line: 'So I can roast you right on top of {app}.', button: 'Allow', Icon: LayersIcon },
  { key: 'notifications', title: 'Notifications', line: "So I can warn you before I get mean. You'll also see a small one that keeps me awake. Swipe it away if you like.", button: 'Allow', Icon: BellIcon },
  { key: 'battery', title: "Don't put me to sleep", line: "Your phone puts apps to sleep to save battery. I don't nap. 2 taps.", button: 'Fix it', Icon: BatteryIcon },
];

/**
 * Screen 6 · Final permissions. Easiest first; each card lights up in turn.
 * Battery is only asked here on brands that kill background apps; on other phones the
 * foreground service is enough, and Today asks just-in-time if the watcher ever gets killed.
 */
export default function Permissions() {
  const { roaster, permissions, setPermission, name, tracked } = useSettings();
  const topApp = [...tracked].sort((a, b) => b.weekMin - a.weekMin)[0]?.label;
  const waitingFor = useRef<Key | null>(null);
  const cards = (batteryNeededUpfront() ? CARDS : CARDS.filter((c) => c.key !== 'battery')).map((c) => ({ ...c, line: c.line.replace('{app}', topApp ?? 'your apps') }));
  const total = cards.length;

  // Match the stored state to the phone: anything already allowed (reinstall, granted earlier) is
  // ticked straight away, and anything switched off since (replay) is asked again.
  const sync = useCallback(() => {
    const now = checkPermissions();
    const stored = useSettings.getState().permissions;
    (['notifications', 'overlay', 'battery'] as Key[]).forEach((k) => {
      if (now[k] === true && stored[k] !== 'granted') setPermission(k, 'granted');
      else if (now[k] === false && stored[k] === 'granted') setPermission(k, 'pending');
    });
  }, [setPermission]);
  useEffect(sync, [sync]);

  // Check the real state when the user comes back from a Settings page.
  // (Without the native core we can't check, so returning counts as granted.)
  useOnReturn(() => {
    const k = waitingFor.current;
    if (!k) return sync();
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

  const firstOpen = cards.find((c) => permissions[c.key] === 'pending')?.key;
  const stateOf = (k: Key): CardState => {
    const p: PermissionState = permissions[k];
    if (p === 'granted') return 'done';
    if (p === 'skipped') return 'skipped';
    return k === firstOpen ? 'active' : 'waiting';
  };

  const done = cards.filter((c) => permissions[c.key] === 'granted').length;
  const allAnswered = cards.every((c) => permissions[c.key] !== 'pending');
  const face: Pose = done === total ? 'knuckles' : permissions.overlay === 'skipped' ? 'disbelief' : done >= 1 ? 'waiting' : 'clipboard';
  const steps = batterySteps();
  // Sideloaded on Android 13+ and Usage access wasn't granted (that unlock covers both): the overlay
  // switch will be greyed out until "Allow restricted settings", so say so before the first trip.
  const restricted = restrictedSettingsLikely() && checkPermissions().usage === false;

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
      <StepBar step={7} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 24, paddingTop: 12 }}>
          <View style={{ flex: 1, paddingBottom: 6 }}>
            <Heading
              title={done === total ? (name ? `All set, ${name}. Let's test it.` : "All set. Let's test it.") : permissions.overlay === 'skipped' ? 'You skipped the main one?' : `${MORE[total - done] ?? 'A few more things'}, then I'm in.`}
              sub={
                done === total
                  ? "Everything's on. Next: your first roast, on purpose."
                  : permissions.overlay === 'skipped'
                    ? "The roast can't show up without it. That's kind of my whole thing."
                    : total === 3
                      ? 'Your phone needs one more. Sorry, not my rule.'
                      : 'Each one has a reason. Nothing else gets asked.'
              }
            />
          </View>
          <Character source={pose(roaster, face)} size={110} alt={`${roasterName[roaster]}, getting ready`} fadeTo={colors.bg} />
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 10 }}>
          {cards.map((c) => {
            const s = stateOf(c.key);
            return (
              <PermCard key={c.key} card={c} state={s} onPress={() => act(c.key)} onSkip={c.key === 'overlay' && s === 'active' ? () => setPermission('overlay', 'skipped') : undefined}>
                {c.key === 'overlay' && s === 'active' && restricted ? <RestrictedHelp upfront then={c.button} /> : null}
                {c.key === 'battery' && s === 'active' && steps ? (
                  <View style={st.steps}>
                    <T v="bodyBold" style={{ fontSize: 13 }}>On your phone</T>
                    {steps.steps.map((line, i) => (
                      <T key={i} style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.ink }}>{`${i + 1}. ${line}`}</T>
                    ))}
                    <View style={{ alignItems: 'flex-start' }}>
                      <LinkButton label={`${steps.brandPage} →`} onPress={() => openBrandBackgroundSettings()} />
                    </View>
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
          {done === total ? (
            <T style={{ textAlign: 'center', fontStyle: 'italic', fontSize: 14, color: colors.ink, marginBottom: 12 }}>“Knuckles cracked. Let&apos;s see if you can take it.”</T>
          ) : null}
          {allAnswered && permissions.overlay === 'skipped' ? (
            // Overlay skipped: push once more for it, but let them through on notifications alone.
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Button label="Fine, allow it" style={btn} onPress={() => act('overlay')} />
              <LinkButton
                label={permissions.notifications === 'granted' ? 'Continue with notifications only' : 'Continue anyway'}
                onPress={() => router.push('/onboarding/finish')}
              />
            </View>
          ) : (
            <Button
              label={allAnswered ? 'Roast me now' : `${done} of ${total} done`}
              disabled={!allAnswered}
              style={btn}
              onPress={() => router.push('/onboarding/finish')}
            />
          )}
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
  card: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btn: { height: 38, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  steps: { gap: 4, padding: 12, borderRadius: 12, backgroundColor: colors.surface },
  warn: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.headsTint, borderRadius: radius.md - 2, padding: 14 },
});
