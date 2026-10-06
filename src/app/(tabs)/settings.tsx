import { EndloopCore } from 'endloop-core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wordmark } from '@/brand/logo';
import { pose, roasterName, type Roaster } from '@/characters';
import { PremiumSheet } from '@/components/premium-sheet';
import { RoasterSheet } from '@/components/roaster-sheet';
import { Chevron, Group, NOTIFY_ROWS, NavRow, Row, settingsStyles } from '@/components/settings-ui';
import { Avatar, Button, Character, LinkButton, Sheet, T } from '@/components/ui';
import { APP_ICON_LABEL, AppIconImage, appIconSupported, getAppIcon, setAppIcon, type AppIconName } from '@/lib/app-icon';
import { useOnReturn } from '@/lib/hooks';
import { checkPermissions, requestNotifications } from '@/lib/permissions';
import { localDay, useSettings } from '@/store/settings';
import { colors } from '@/theme/tokens';

const LEVEL: Record<string, string> = { polite: 'Polite', honest: 'Honest', savage: 'Savage', unhinged: 'Unhinged' };
const LANG: Record<string, string> = { en: 'English', 'ta-Latn': 'Tanglish' };

/** Screen 14 · Settings: one short list; every group opens its own screen (src/app/prefs/*). */
export default function Settings() {
  const s = useSettings();
  const [premium, setPremium] = useState(false);
  const [sheet, setSheet] = useState<null | 'roaster' | 'pause' | 'icon' | 'test'>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  // Screen 17: home-screen icon
  const [iconOk] = useState(appIconSupported);
  const [icon, setIcon] = useState<AppIconName>(getAppIcon);
  const [iconPick, setIconPick] = useState<AppIconName>('default');
  /** Set when the icon sheet opened because the roaster changed: the icon they'd be leaving. */
  const [swapFrom, setSwapFrom] = useState<AppIconName | null>(null);
  const openIcon = (pick: AppIconName, from: AppIconName | null) => {
    setIconPick(pick);
    setSwapFrom(from);
    setSheet('icon');
  };
  const [perms, setPerms] = useState(checkPermissions);
  useOnReturn(() => setPerms(checkPermissions()));

  const paused = s.pausedOn === localDay();
  const toFix = [perms.usage, perms.overlay, perms.battery, perms.notifications].filter((x) => x === false).length;
  const notifOn = NOTIFY_ROWS.filter(([k]) => s.notify[k]).length;

  const pickRoaster = (r: Roaster) => {
    s.set({ roaster: r });
    // Their icon shows the other roaster: offer to swap it too (never automatic).
    if (iconOk && icon !== 'default' && icon !== r) openIcon(r, icon);
    else setSheet(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 12 }}>
          <Wordmark width={100} />
          <T v="display">Settings</T>
        </View>

        {paused ? (
          <View accessibilityRole="alert" style={[st.banner, { backgroundColor: colors.heads }]}>
            <T v="bodyBold" style={{ flex: 1, color: colors.white, fontSize: 15 }}>Paused for today. I&apos;m back at midnight.</T>
            <Pressable accessibilityRole="button" onPress={() => s.set({ pausedOn: undefined })} style={st.bannerBtn}>
              <T v="bodyBold" style={{ fontSize: 14, color: colors.heads }}>Resume</T>
            </Pressable>
          </View>
        ) : null}

        {/* Your roaster: the one thing people come here to change, so it gets the big card. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Your roaster: ${roasterName[s.roaster]}. Tap to switch.`}
          onPress={() => setSheet('roaster')}
          style={({ pressed }) => [st.roasterCard, pressed && { opacity: 0.9 }]}>
          <Avatar source={pose(s.roaster, 'idle')} size={60} bg="#3A1C20" />
          <View style={{ flex: 1, gap: 2 }}>
            <T v="label" style={{ fontSize: 11, color: '#FFB38A' }}>Your roaster</T>
            <T v="title" style={{ color: colors.white, fontSize: 22 }}>{roasterName[s.roaster]}</T>
          </View>
          <View style={st.switchBtn}>
            <T v="bodyBold" style={{ fontSize: 14, color: colors.white }}>Switch</T>
          </View>
        </Pressable>

        <Group>
          <NavRow first label="Roasting" value={`${LEVEL[s.intensity] ?? s.intensity} · ${LANG[s.roastLang] ?? s.roastLang}`} href="/prefs/roasting" />
          <NavRow label="Apps and limits" value={`${s.tracked.length} ${s.tracked.length === 1 ? 'app' : 'apps'}`} href="/prefs/limits" />
          <NavRow label="Notifications" value={notifOn === NOTIFY_ROWS.length ? 'All on' : notifOn === 0 ? 'Off' : `${notifOn} of ${NOTIFY_ROWS.length} on`} href="/prefs/notifications" />
          <NavRow label="Permissions" value={toFix ? `${toFix} to fix` : 'All good'} valueColor={toFix ? colors.red : colors.chill} href="/prefs/permissions" />
          {iconOk ? <NavRow label="App icon" value={APP_ICON_LABEL[icon]} onPress={() => openIcon(icon, null)} /> : null}
        </Group>

        <Group>
          <Row
            first
            label="Pause for today"
            sub={paused ? "You're on a day off." : 'Shows up in your weekly roast.'}
            right={
              <Pressable accessibilityRole="button" disabled={paused} onPress={() => setSheet('pause')} style={[settingsStyles.smallBtn, paused && { opacity: 0.5 }]}>
                <T v="bodyBold" style={{ fontSize: 14 }}>{paused ? 'Paused' : 'Pause'}</T>
              </Pressable>
            }
          />
        </Group>

        <Group>
          <NavRow first label="Privacy and data" href="/prefs/privacy-data" />
          <NavRow label="About and help" href="/prefs/about" />
        </Group>

        <Pressable accessibilityRole="button" onPress={() => setPremium(true)} style={st.premium}>
          <Avatar source={pose(s.roaster, 'vip')} size={40} />
          <T v="bodyBold" style={{ flex: 1, color: colors.white, fontSize: 15 }}>Watch more than 3 apps with Premium</T>
          <Chevron color="#FFB38A" />
        </Pressable>

        {__DEV__ ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 20, gap: 12 }}>
            <Button label="Test notifications (dev)" tone="outline" onPress={() => { setTestMsg(null); setSheet('test'); }} />
            <Button
              label="Replay onboarding (dev)"
              tone="outline"
              onPress={() => {
                s.reset();
                router.replace('/onboarding/welcome');
              }}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* ---- sheets ---- */}
      <RoasterSheet visible={sheet === 'roaster'} onClose={() => setSheet(null)} current={s.roaster} onPick={pickRoaster} />

      <Sheet visible={sheet === 'icon'} onClose={() => setSheet(null)}>
        <T v="display" style={{ fontSize: 26, lineHeight: 29 }}>
          {swapFrom ? `You picked ${roasterName[s.roaster]}. Swap the icon too?` : 'App icon'}
        </T>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
          {(['default', 'loop', 'lupe'] as AppIconName[]).map((n) => {
            const on = n === iconPick;
            return (
              <Pressable key={n} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={APP_ICON_LABEL[n]} onPress={() => setIconPick(n)} style={[st.iconChoice, on && { backgroundColor: colors.surface }]}>
                <AppIconImage name={n} size={68} ring={on} />
                <T v="bodyBold" style={{ fontSize: 14, color: on ? colors.ink : colors.muted }}>{APP_ICON_LABEL[n]}</T>
              </Pressable>
            );
          })}
        </View>
        <T v="caption">It changes when you leave Endloop. Some phones move it to the app drawer. Drag it back.</T>
        <Button
          label={iconPick === icon ? 'Done' : iconPick === 'default' ? 'Use the red one' : `Use ${APP_ICON_LABEL[iconPick]}`}
          onPress={() => {
            setAppIcon(iconPick);
            setIcon(iconPick);
            setSheet(null);
          }}
        />
        <View style={{ alignItems: 'center' }}>
          <LinkButton label={swapFrom ? `Keep ${APP_ICON_LABEL[swapFrom]}` : 'Cancel'} onPress={() => setSheet(null)} />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'pause'} onClose={() => setSheet(null)}>
        <View style={{ alignItems: 'center' }}>
          <Character source={pose(s.roaster, 'sideEye')} size={150} alt={`${roasterName[s.roaster]}, side-eye`} />
        </View>
        <T v="display" style={{ fontSize: 28, lineHeight: 31 }}>Taking the day off?</T>
        <T>I&apos;ll stop warning and roasting until midnight. It shows as &quot;1 day off&quot; in your weekly roast. I&apos;ll remember this.</T>
        <Button
          label="Pause for today"
          onPress={() => {
            const today = localDay();
            s.set({ pausedOn: today, pausedDays: s.pausedDays.includes(today) ? s.pausedDays : [...s.pausedDays, today] });
            setSheet(null);
          }}
        />
        <View style={{ alignItems: 'center' }}>
          <LinkButton label="Cancel" onPress={() => setSheet(null)} />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'test'} onClose={() => setSheet(null)}>
        <T v="title">Test notifications</T>
        <T v="caption">Sends it now with your first tracked app. Ignores the toggles and the once-a-day rules.</T>
        {(
          [
            ['heads_up', 'Heads up · 75%'],
            ['last_call', 'Last call · 90%'],
            ['late_night', 'Late night'],
            ['weekly', 'Weekly roast'],
            ['explain', 'Watcher explainer'],
          ] as const
        ).map(([kind, label]) => (
          <Button
            key={kind}
            label={label}
            tone="outline"
            onPress={async () => {
              if (!EndloopCore?.testNotification) return setTestMsg('Needs a native build (not Expo Go).');
              if (!(await requestNotifications())) return setTestMsg('Notifications are off for Endloop. Turn them on first.');
              const ok = await EndloopCore.testNotification(kind);
              setTestMsg(ok ? `Sent: ${label}. Pull down the shade.` : 'Nothing to test yet. Pick at least one app first.');
            }}
          />
        ))}
        {testMsg ? <T v="bodyBold" style={{ fontSize: 14, color: colors.red }}>{testMsg}</T> : null}
      </Sheet>

      <PremiumSheet visible={premium} onClose={() => setPremium(false)} roaster={s.roaster} reason="apps" />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  banner: { marginHorizontal: 24, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18 },
  bannerBtn: { height: 34, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.white, justifyContent: 'center' },
  roasterCard: { marginHorizontal: 24, marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 22, backgroundColor: colors.darkBg },
  switchBtn: { height: 36, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.red, justifyContent: 'center' },
  premium: { marginHorizontal: 24, marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.ink },
  iconChoice: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 12, borderRadius: 18 },
});
