import { EndloopCore } from 'endloop-core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wordmark } from '@/brand/logo';
import { pose, roasterName } from '@/characters';
import { CloseIcon } from '@/components/icons';
import { AppTile, Avatar, Button, Character, LinkButton, T } from '@/components/ui';
import { usage } from '@/data/usage';
import { fmt } from '@/lib/time';
import { weeklyReport, type WeeklyReport } from '@/lib/weekly';
import { localDay, useSettings } from '@/store/settings';
import { colors, fonts, gradients } from '@/theme/tokens';

const PROUD = ['#F2EBDD', '#FFB38A'] as const;
const DARK = ['#2A0A0E', '#140A0B'] as const;

/** Screen 13 · Weekly roast report: three tap-through reveals, then the share card. */
export default function Weekly() {
  const { tracked, roaster, roastLang, intensity, startedAt, baselineDailyMin, pausedDays } = useSettings();
  const daysOff = pausedDays.filter((d) => d >= localDay(-6)).length;
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [step, setStep] = useState(0);
  const [hide, setHide] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const pickedAvg = tracked.reduce((s, a) => s + a.avgDailyMin, 0);
    const baseline = baselineDailyMin ?? (pickedAvg > 0 ? pickedAvg : undefined);
    usage
      .history(14, tracked.map((a) => a.packageName))
      .then((days) => setReport(weeklyReport(days, tracked, startedAt ?? localDay(), baseline, { lang: roastLang, intensity, roaster })));
  }, [tracked, startedAt, baselineDailyMin, roastLang, intensity, roaster]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));
  const next = () => setStep((s) => Math.min(3, s + 1));

  if (!report) return <View style={{ flex: 1, backgroundColor: '#C20F24' }} />;

  // "App #1" instead of real names when hidden
  const worstName = report.worst ? (hide ? 'App #1' : report.worst.label) : '–';
  const winLine =
    report.type === 'first'
      ? 'Baseline set'
      : report.wonBack != null && report.wonBack > 0
        ? `${fmt(report.wonBack)} won back`
        : `${report.underDays} days under limits`;
  const roast = hide && report.worst ? report.roast.split(report.worst.label).join('App #1') : report.roast;
  const cardPose = report.type === 'bad' ? 'headShake' : report.type === 'first' ? 'notes' : 'savage';
  // native drawable for the share card (endloop_<roaster>_<pose>, snake_case)
  const cardDrawable = `endloop_${roaster}_${cardPose === 'headShake' ? 'head_shake' : cardPose}`;

  if (step === 3) {
    const cardJson = JSON.stringify({
      dates: `MY WEEK · ${report.dates.toUpperCase()}`,
      total: fmt(report.total),
      worst: `Worst offender: ${worstName} · ${fmt(report.worst?.minutes ?? 0)}`,
      win: winLine,
      roast,
      tagline: 'Get roasted too → endloop app',
      character: cardDrawable,
      shareTitle: 'Share your roast',
    });
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={st.shareHead}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar source={pose(roaster, 'selfie')} size={40} />
            <T v="bodyBold" style={{ fontSize: 20 }}>Share your roast</T>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={st.close}>
            <CloseIcon size={18} color={colors.ink} />
          </Pressable>
        </View>
        <View style={{ alignItems: 'center', paddingTop: 12 }}>
          <Card report={report} worstName={worstName} winLine={winLine} roast={roast} face={pose(roaster, cardPose)} />
        </View>
        <View style={st.hideRow}>
          <T v="bodyBold" style={{ fontSize: 15 }}>Hide app names</T>
          <Switch value={hide} onValueChange={setHide} trackColor={{ true: colors.red, false: colors.line }} thumbColor={colors.white} />
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 20, gap: 4 }}>
          {note ? <T v="caption" style={{ textAlign: 'center' }}>{note}</T> : null}
          <Button label="Share to Stories" onPress={() => EndloopCore?.weeklyCard(cardJson, true)} />
          <View style={{ alignItems: 'center' }}>
            <LinkButton
              label="Save image"
              color={colors.ink}
              onPress={async () => {
                const ok = (await EndloopCore?.weeklyCard(cardJson, false)) ?? false;
                setNote(ok ? 'Saved to Pictures › Endloop.' : 'Saving needs Android 10 or newer. Share it instead.');
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const bg = step === 0 ? gradients.roasted : step === 1 ? DARK : PROUD;
  const light = step < 2;
  const ink = light ? colors.white : colors.ink;
  return (
    <Pressable style={{ flex: 1 }} onPress={next} accessibilityRole="button" accessibilityHint="Tap to continue">
      <LinearGradient colors={bg} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Part ${step + 1} of 3`}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? ink : light ? 'rgba(255,255,255,0.3)' : 'rgba(20,20,20,0.2)' }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T v="bodyBold" style={{ fontSize: 13, color: ink }}>Your week · {report.dates}</T>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={st.close} hitSlop={8}>
                <CloseIcon size={18} color={ink} />
              </Pressable>
            </View>
          </View>

          {step === 0 ? <Total report={report} tracked={tracked.map((a) => a.label)} face={pose(roaster, 'jawDrop')} name={roasterName[roaster]} /> : null}
          {step === 1 ? <Worst report={report} face={pose(roaster, 'headShake')} name={roasterName[roaster]} /> : null}
          {step === 2 ? <Wins report={report} daysOff={daysOff} face={pose(roaster, 'handOnHeart')} name={roasterName[roaster]} /> : null}

          <View style={st.tapHint} pointerEvents="none">
            <T v="bodyBold" style={{ fontSize: 13, color: light ? colors.white : colors.ink }}>Tap to continue</T>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------

/** 1 · the total counts up. */
function Total({ report, tracked, face, name }: { report: WeeklyReport; tracked: string[]; face: number; name: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / 1400);
      setShown(Math.round(report.total * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [report.total]);
  const h = Math.floor(shown / 60);
  const m = shown % 60;
  return (
    <View style={{ flex: 1 }}>
    <View style={{ paddingHorizontal: 28, paddingTop: 40, gap: 10 }}>
      <T v="bodyBold" style={{ fontSize: 22, lineHeight: 28, color: 'rgba(255,255,255,0.85)' }}>This week you scrolled…</T>
      <T style={{ fontFamily: fonts.display, fontSize: 92, lineHeight: 92, color: colors.white }}>{`${h}h\n${String(m).padStart(2, '0')}m`}</T>
      <T style={{ color: 'rgba(255,255,255,0.8)' }}>
        on {tracked.join(', ').replace(/, ([^,]*)$/, ' and $1')}. That&apos;s {fmt(report.perDay)} a day, every day.
      </T>
    </View>
    <BigChar source={face} alt={`${name}, jaw on the floor`} fadeTo="#7A0714" />
    </View>
  );
}

/** 2 · worst offender. */
function Worst({ report, face, name }: { report: WeeklyReport; face: number; name: string }) {
  const app = useSettings.getState().tracked.find((a) => a.label === report.worst?.label);
  return (
    <View style={{ flex: 1 }}>
    <View style={{ paddingHorizontal: 28, paddingTop: 28, gap: 8 }}>
      <T v="bodyBold" style={{ fontSize: 22, color: 'rgba(255,255,255,0.85)' }}>Worst offender…</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
        {app ? <AppTile label={app.label} color={app.color} iconUri={app.iconUri} size={52} /> : null}
        <T style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: colors.white, flexShrink: 1 }}>{report.worst?.label ?? 'Nobody'}</T>
      </View>
      <T style={{ fontFamily: fonts.display, fontSize: 56, lineHeight: 60, color: colors.white }}>{fmt(report.worst?.minutes ?? 0)}</T>
      <T v="bodyBold" style={{ fontSize: 18, lineHeight: 24, color: colors.white }}>{report.roast}</T>
    </View>
    <BigChar source={face} alt={`${name}, shaking their head`} fadeTo="#140A0B" />
    </View>
  );
}

/** 3 · but also… ends positive. */
function Wins({ report, daysOff, face, name }: { report: WeeklyReport; daysOff: number; face: number; name: string }) {
  const items: [string, string][] = [];
  if (report.wonBack != null && report.wonBack > 0) items.push([fmt(report.wonBack), 'won back vs before Endloop']);
  items.push([`${report.underDays} of ${Math.max(report.countedDays, 1)}`, 'days under every limit']);
  items.push([`${report.wins} ${report.wins === 1 ? 'time' : 'times'}`, 'you closed it on the first roast']);
  if (daysOff > 0) items.push([`${daysOff} ${daysOff === 1 ? 'day' : 'days'} off`, 'paused in Settings. I remember.']);
  const closing =
    report.type === 'good'
      ? "Fine. You did well. Don't let it go to your head."
      : report.type === 'first'
        ? "Week 1 done. Now we see what you're made of."
        : 'Not your best week. Next one starts now.';
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 28, paddingTop: 28, gap: 12 }}>
        <T v="bodyBold" style={{ fontSize: 22, color: '#5A3A2A' }}>But also…</T>
        <View style={st.wins}>
          {items.map(([big, small], i) => (
            <View key={small} style={[st.winRow, i > 0 && st.winBorder]}>
              <T style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.ink, minWidth: 96 }}>{big}</T>
              <T v="bodyBold" style={{ flex: 1, fontSize: 14, lineHeight: 19, color: '#5A3A2A' }}>{small}</T>
            </View>
          ))}
        </View>
        <T style={{ fontFamily: fonts.display, fontSize: 20, lineHeight: 25, color: colors.ink }}>{closing}</T>
      </View>
      <BigChar source={face} alt={`${name}, grudgingly proud`} fadeTo="#FFB38A" />
    </View>
  );
}

/** Fills whatever height is left under the text with the roaster, as big as fits, standing on the bottom edge. */
function BigChar({ source, alt, fadeTo }: { source: number; alt: string; fadeTo: string }) {
  const [size, setSize] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize(Math.floor(Math.min(width * 1.05, height + 8)));
  };
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }} onLayout={onLayout}>
      {size > 120 ? <Character source={source} size={size} alt={alt} fadeTo={fadeTo} /> : null}
    </View>
  );
}

/** Preview of the Stories card (the shared image is drawn natively at 1080×1920). */
function Card({ report, worstName, winLine, roast, face }: { report: WeeklyReport; worstName: string; winLine: string; roast: string; face: number }) {
  return (
    <LinearGradient colors={gradients.roasted} style={st.card}>
      <Wordmark width={96} variant="white" />
      <T v="label" style={{ paddingTop: 18, fontSize: 11, letterSpacing: 1.2, color: colors.blush }}>My week · {report.dates}</T>
      <T style={{ fontFamily: fonts.display, fontSize: 58, lineHeight: 60, color: colors.white }}>{fmt(report.total)}</T>
      <T v="bodyBold" style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>Worst offender: {worstName} · {fmt(report.worst?.minutes ?? 0)}</T>
      <View style={st.pill}>
        <T v="bodyBold" style={{ fontSize: 12, color: colors.ink }}>{winLine}</T>
      </View>
      <T style={{ paddingTop: 8, maxWidth: 170, fontFamily: fonts.display, fontSize: 20, lineHeight: 23, color: colors.white }}>{roast}</T>
      <View style={st.cardLoop} pointerEvents="none">
        <Character source={face} size={210} alt="" fadeTo="#7A0714" />
      </View>
      <View style={{ flex: 1 }} />
      <T v="bodyBold" style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>Get roasted too → endloop app</T>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  shareHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 12, paddingTop: 8 },
  hideRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16 },
  wins: { borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.55)', paddingHorizontal: 16 },
  winRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  winBorder: { borderTopWidth: 1, borderTopColor: 'rgba(90,58,42,0.15)' },
  tapHint: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  card: { width: 300, height: 533, borderRadius: 18, overflow: 'hidden', padding: 20, gap: 6 },
  pill: { alignSelf: 'flex-start', backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  cardLoop: { position: 'absolute', right: -44, bottom: 16 },
});
