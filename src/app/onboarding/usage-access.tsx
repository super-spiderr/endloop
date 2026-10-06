import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { pose } from '@/characters';
import { InfoIcon } from '@/components/icons';
import { AppTile, BrandBar, Button, Character, LinkButton, Screen, T } from '@/components/ui';
import { LoopMark } from '@/brand/logo';
import { usage } from '@/data/usage';
import { useOnReturn } from '@/lib/hooks';
import { openUsageAccessSettings } from '@/lib/permissions';
import { useSettings } from '@/store/settings';
import { colors, fonts, radius } from '@/theme/tokens';

type Phase = 'ask' | 'notFound' | 'granted';

/** Screen 2 · Usage Access. Checks again every time the user comes back from Settings. */
export default function UsageAccess() {
  const roaster = useSettings((s) => s.roaster);
  const set = useSettings((s) => s.set);
  const [phase, setPhase] = useState<Phase>('ask');

  // Only react to a trip to Settings that this screen started.
  const waiting = useRef(false);
  useOnReturn(async () => {
    if (!waiting.current) return;
    waiting.current = false;
    const ok = await usage.hasUsageAccess();
    if (!ok) return setPhase('notFound');
    set({ hasUsageAccess: true });
    setPhase('granted');
    setTimeout(() => router.replace('/onboarding/pick-apps'), 1600);
  });

  if (phase === 'granted') {
    return (
      <Screen>
        <BrandBar step={2} />
        <Animated.View entering={FadeIn} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 24 }}>
          <Character source={pose(roaster, 'ohNo')} size={280} alt="Loop, hand over his mouth" fadeTo={colors.bg} />
          <T style={{ fontFamily: fonts.display, fontSize: 52, lineHeight: 54, color: colors.ink }}>…oh no.</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={colors.red} />
            <T>Counting your hours…</T>
          </View>
        </Animated.View>
      </Screen>
    );
  }

  const notFound = phase === 'notFound';
  return (
    <Screen>
      <BrandBar step={2} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <Character
              source={pose(roaster, notFound ? 'armsCrossed' : 'peer')}
              size={200}
              alt={notFound ? 'Loop, arms crossed, unimpressed' : 'Loop, peering over his glasses'}
              fadeTo={colors.bg}
            />
          </View>
          <T v="display">{notFound ? "Nice try. Still can't see anything." : 'Let me see how bad it is.'}</T>
          <T>
            I need Usage Access to count your screen time. I only see how long you use each app.{' '}
            <T v="bodyBold">Never your messages, photos or what you watch.</T>
          </T>
          {notFound ? <NotFoundNudge /> : <SettingsPreview />}
        </View>
        <View style={{ flex: 1, minHeight: 24 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center', gap: 4 }}>
          <Button
            label="Show me the damage"
            onPress={() => {
              waiting.current = true;
              openUsageAccessSettings();
            }}
          />
          <LinkButton
            label="Not now"
            onPress={() => {
              set({ hasUsageAccess: false });
              router.push('/onboarding/pick-apps');
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function SettingsRow({ name, on, hi }: { name: string; on: boolean; hi?: boolean }) {
  return (
    <View style={[st.row, hi && { borderColor: colors.red, backgroundColor: colors.white }]}>
      {hi ? (
        <View style={[st.dot, { backgroundColor: colors.red }]}>
          <LoopMark size={22} color={colors.white} />
        </View>
      ) : (
        <AppTile label=" " color="#C9C3C4" size={34} />
      )}
      <T style={{ flex: 1, fontFamily: hi ? fonts.bold : fonts.medium, fontSize: 15, color: hi ? colors.ink : colors.muted }}>{name}</T>
      <View style={[st.toggle, { backgroundColor: on ? colors.red : '#D9D4D5', alignItems: on ? 'flex-end' : 'flex-start' }]}>
        <View style={st.knob} />
      </View>
    </View>
  
  );
}

/** Static picture of the Settings list (becomes a short looping animation later). */
function SettingsPreview() {
  return (
    <View accessible accessibilityLabel="In Settings, find Endloop under Usage access and switch it on" style={st.card}>
      <T v="label" style={{ fontSize: 12, paddingHorizontal: 10, paddingBottom: 6 }}>Settings › Usage access</T>
      <SettingsRow name="Chrome" on={false} />
      <SettingsRow name="Endloop" on hi />
      <SettingsRow name="Files" on={false} />
    </View>
  );
}

function NotFoundNudge() {
  return (
    <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 12, backgroundColor: colors.blush, borderRadius: 16, padding: 16 }}>
      <InfoIcon />
      <View style={{ flex: 1, gap: 4 }}>
        <T v="bodyBold">Didn&apos;t find it?</T>
        <T style={{ color: colors.ink, fontSize: 15 }}>
          It&apos;s under <T v="bodyBold" style={{ fontSize: 15 }}>Endloop</T> → <T v="bodyBold" style={{ fontSize: 15 }}>Permit usage access</T>.
        </T>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, padding: 12, paddingTop: 14, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  toggle: { width: 40, height: 24, borderRadius: 12, padding: 3, justifyContent: 'center' },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.white },
});
