import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { pose } from '@/characters';
import { btn, FadedPose, Heading, Label, Quote, SpotlightScreen, StepBar, RedStatusBar } from '@/components/onboarding-ui';
import { AppTile, Button, LinkButton, Sheet, T } from '@/components/ui';
import { bandOf, earnedTitles, NO_ACCESS_TITLES, OB, perYear, say } from '@/content/onboarding';
import { usage, type InstalledApp } from '@/data/usage';
import { fmt } from '@/lib/time';
import { cleanName, useSettings } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

/** Onboarding v2 · Step 3: the 7-day reveal, then 3b "What should I call you?" (earned titles). */
export default function Reveal() {
  const { roaster, roastLang: lang, hasUsageAccess } = useSettings();
  const [apps, setApps] = useState<InstalledApp[] | null>(hasUsageAccess ? null : []);
  const [phase, setPhase] = useState<'drum' | 'numbers'>(hasUsageAccess ? 'drum' : 'numbers');
  const [sheet, setSheet] = useState(!hasUsageAccess);
  const [shown, setShown] = useState(0);
  const [seed] = useState(() => Math.floor(Math.random() * 1000));

  useEffect(() => {
    if (!hasUsageAccess) return;
    usage
      .listApps()
      .then((list) => setApps(list.filter((a) => !a.packageName.startsWith('com.superspider.endloop'))))
      .catch(() => setApps([]));
    const t = setTimeout(() => setPhase('numbers'), 1800);
    return () => clearTimeout(t);
  }, [hasUsageAccess]);

  const daily = useMemo(() => (apps ?? []).reduce((s, a) => s + a.avgDailyMin, 0), [apps]);
  useEffect(() => {
    if (daily) useSettings.getState().set({ revealDailyMin: daily });
  }, [daily]);
  const top = apps?.[0];

  // Count the big number up once it's shown.
  useEffect(() => {
    if (phase !== 'numbers' || !daily) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 1100);
      setShown(Math.round(daily * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [phase, daily]);

  const band = bandOf(daily);
  const reaction = !daily ? say(OB.revealNew, lang) : say(OB.band[band], lang, { week_hours: Math.round((daily * 7) / 60) });
  const face = band === 4 && roaster === 'lupe' ? pose(roaster, 'dramatic') : pose(roaster, 'jawDrop');
  const titles = hasUsageAccess && daily ? earnedTitles(apps ?? [], daily, seed) : NO_ACCESS_TITLES;

  return (
    <SpotlightScreen loopY={phase === 'drum' ? 0.4 : 0.64}>
      <RedStatusBar />
      <StepBar step={3} dark />
      {phase === 'drum' ? (
        <Animated.View entering={FadeIn} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 24 }}>
          <T style={st.eyebrow}>The reveal</T>
          <FadedPose source={pose(roaster, 'waiting')} size={330} alt="Drumming fingers" />
          <Heading title={say(OB.revealReady, lang)} light size={26} />
          <T style={{ marginTop: 8, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Counting up…</T>
        </Animated.View>
      ) : (
        <View style={{ flex: 1 }}>
          {daily ? (
            <Animated.View entering={FadeInDown.duration(350)} style={{ alignItems: 'center', marginTop: 14 }}>
              <T style={st.eyebrow}>Your last 7 days</T>
              <T accessibilityLabel={`${fmt(daily)} a day, on average`} style={{ fontFamily: fonts.display, fontSize: 64, lineHeight: 68, color: colors.white, marginTop: 6 }}>
                {fmt(shown)}
              </T>
              <T style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>a day, on average</T>
            </Animated.View>
          ) : null}
          {top && daily ? (
            <View style={st.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AppTile label={top.label} color={top.color} iconUri={top.iconUri} size={28} />
                <T style={{ flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.white }}>{top.label}</T>
                <T style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.white }}>
                  {fmt(top.avgDailyMin)}
                  <T style={{ fontFamily: fonts.medium, color: 'rgba(255,255,255,0.75)' }}> a day</T>
                </T>
              </View>
              <T style={{ fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.85)' }}>
                {lang === 'ta-Latn'
                  ? `Varushathukku ${perYear(top.avgDailyMin, lang)}. ${top.label}-ku mattum.`
                  : `That's ${perYear(top.avgDailyMin, lang)} a year. On ${top.label} alone.`}
              </T>
            </View>
          ) : null}
          <View style={{ alignItems: 'center' }}>
            <FadedPose source={hasUsageAccess ? face : pose(roaster, 'blind')} size={hasUsageAccess ? 240 : 300} alt="Reaction" />
          </View>
          {hasUsageAccess ? <T style={st.reaction}>“{reaction}”</T> : null}
          <View style={{ flex: 1 }} />
          {daily ? <T style={{ textAlign: 'center', marginHorizontal: 32, marginBottom: 12, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>This is your normal. Stay under it and you earn Loops.</T> : null}
          <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            <Button label="Okay, that's bad" tone="white" style={btn} onPress={() => setSheet(true)} />
          </View>
        </View>
      )}
      <NameSheet visible={sheet} onClose={() => setSheet(false)} titles={titles} />
    </SpotlightScreen>
  );

}

function NameSheet({ visible, onClose, titles: list }: { visible: boolean; onClose: () => void; titles: string[] }) {
const { roaster, roastLang: lang, hasUsageAccess, set } = useSettings();
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState('');
  const typed = cleanName(text);
  const name = typed || picked || '';
  const line = typed ? say(OB.nameOwn, lang, { name: typed }) : picked ? say(OB.namePick, lang, { name: picked }) : '';
  const finish = (skip: boolean) => {
    const chosen = skip ? list[0] : name;
    set({ name: chosen, nameAuto: skip });
    onClose();
    router.push('/onboarding/pick-apps');
  };
  return (
    <Sheet visible={visible} onClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ gap: 16 }}>
        <Heading title={say(OB.nameTitle, lang)} sub={hasUsageAccess ? say(OB.nameEarned, lang) : undefined} size={20} />
        <View style={{ gap: 8 }}>
          <Label>{hasUsageAccess ? 'Earned titles' : 'Pick one'}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {list.map((t) => {
              const on = picked === t && !typed;
              return (
                <Pressable key={t} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { Haptics.selectionAsync(); setPicked(t); setText(''); }} style={[st.chip, on && st.chipOn]}>
                  <T style={{ fontFamily: fonts.bold, fontSize: 14, color: on ? colors.red : colors.ink }}>{t}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Label>Or your own name</Label>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="First name or nickname"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={24}
            accessibilityLabel="Your own name"
            style={st.input}
          />
        </View>
        <Quote face={pose(roaster, 'idle')} text={line} />
        <Button label="That's me" disabled={!name} style={btn} onPress={() => finish(false)} />
        <View style={{ alignItems: 'center' }}>
          <LinkButton label="Skip. You pick one for me." onPress={() => finish(true)} />
          <T v="caption" style={{ fontSize: 12, textAlign: 'center' }}>Stays on this phone. Change it any time in Settings.</T>
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  );
}

const st = StyleSheet.create({
  eyebrow: { textAlign: 'center', marginTop: 16, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' },
  card: { marginHorizontal: 24, marginTop: 20, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', gap: 6 },
  reaction: { marginHorizontal: 32, marginTop: -4, fontFamily: fonts.medium, fontStyle: 'italic', fontSize: 16, lineHeight: 22, color: colors.white, textAlign: 'center' },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#EDE3E4', justifyContent: 'center', backgroundColor: colors.white },
  chipOn: { borderWidth: 1.5, borderColor: colors.red, backgroundColor: '#FFF1F2' },
  input: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#EDE3E4', paddingHorizontal: 14, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
});
