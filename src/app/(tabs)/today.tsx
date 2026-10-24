import { useEffect, useState } from 'react';
import { EndloopCore } from 'endloop-core';
import { router } from 'expo-router';
import { AppState, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Wordmark } from '@/brand/logo';
import { pose, roasterName, type Pose } from '@/characters';
import { CloseIcon, EyeIcon, FlameIcon, LeafIcon, LoopsIcon, StarIcon, TargetIcon } from '@/components/icons';
import { PremiumSheet } from '@/components/premium-sheet';
import { AppTile, Avatar, Button, Character, Pill, T } from '@/components/ui';
import { usage, type TodayUsage } from '@/data/usage';
import { fill, pickRoast } from '@/roasts';
import { dismissNews, useRoastNews } from '@/roasts/news';
import { comparison, fmt } from '@/lib/time';
import { RedStatusBar } from '@/components/onboarding-ui';
import { PREMIUM_BOTTOM, PremiumBackdrop } from '@/components/premium-ui';
import { batterySteps, openBatterySettings, openBrandBackgroundSettings, openUsageAccessSettings } from '@/lib/permissions';
import { LETTER_COST, useAttendance } from '@/lib/attendance';
import { watcherLooksDead } from '@/lib/watcher';
import { limitOn, localDay, useSettings, watchedApps, type Goal, type TrackedApp } from '@/store/settings';
import { colors, fonts, gradients, radius, stateStyle, usageState } from '@/theme/tokens';

/** Screen 7 · Home ("Today" tab). */
/** Placeholders Home can fill today; lines needing more ({opens}, {streak}…) wait until we track that. */
const VARS = ['app', 'time', 'limit'] as const;

export default function Today() {
  const { roaster, roastLang, intensity, name, tracked, hasUsageAccess, howItWorksDismissed, streakDays, startedAt, pausedOn, perfectSeen, strictNudgeSeen, premium: isPremium, homeLook, weekendLimits, goal, goalText, set } = useSettings();
  const [today, setToday] = useState<TodayUsage>({});
  const [premium, setPremium] = useState(false);
  const [killed, setKilled] = useState(false);
  const [gone, setGone] = useState<string | null>(null);
  const [perfectYesterday, setPerfectYesterday] = useState(false);
  const news = useRoastNews(roastLang);
  const att = useAttendance();

  // Refresh on open and every time the app comes back to the front.
  useEffect(() => {
    const refresh = () => {
      const pkgs = tracked.map((a) => a.packageName);
      usage.today(pkgs).then(setToday);
      usage.hasUsageAccess().then((ok) => set({ hasUsageAccess: ok }));
      useSettings.getState().applyScheduled();
      // Screen 16: the phone killed the watcher → say so (and restart it)
      if (watcherLooksDead()) {
        setKilled(true);
        EndloopCore?.startWatcher();
      }
      // Screen 16: a tracked app was uninstalled → drop it quietly, free the slot
      if (EndloopCore && pkgs.length) {
        const still = new Set(EndloopCore.installed(pkgs));
        const removed = tracked.filter((a) => !still.has(a.packageName));
        if (removed.length) {
          set({ tracked: tracked.filter((a) => still.has(a.packageName)) });
          setGone(removed[0].label);
        }
      }
      // Screen 16: yesterday under every limit → a perfect-day card, once
      if (pkgs.length) {
        usage.history(2, pkgs).then((days) => {
          const s = useSettings.getState();
          const startOfToday = new Date(`${localDay()}T00:00:00`).getTime();
          const start = s.startedAt ? new Date(`${s.startedAt}T00:00:00`).getTime() : 0;
          const past = days.filter((d) => d.day < startOfToday && d.day >= start);
          const under = (a: TrackedApp, d: (typeof days)[number]) => (d.apps[a.packageName] ?? 0) <= limitOn(a, s, new Date(d.day));
          const y = past[past.length - 1];
          if (s.perfectSeen !== localDay()) setPerfectYesterday(!!y && y.day >= startOfToday - 86_400_000 && tracked.every((a) => under(a, y)) && Object.values(y.apps).some((m) => m > 0));
        });
      }
    };
    refresh();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && refresh());
    return () => sub.remove();
  }, [tracked, set]);

  const firstVisit = !howItWorksDismissed;
  const paused = pausedOn === localDay();
  const dayOne = !firstVisit && (!startedAt || startedAt === localDay());
  // Today's limit (the Premium weekend one on Saturday and Sunday), same as the watcher uses.
  // Premium ended with more than 3 apps: only the watched 3 get a row (S16-H).
  const watched = watchedApps({ premium: isPremium, tracked });
  const overFree = watched.length < tracked.length;
  const rows = watched.map((a) => ({ ...a, limitMin: limitOn(a, { premium: isPremium, weekendLimits }), used: today[a.packageName] ?? 0 })).map((a) => ({ ...a, state: usageState(a.used, a.limitMin) }));
  const total = rows.reduce((s, r) => s + r.used, 0);
  const over = rows.filter((r) => r.state === 'roasted');
  const close = rows.filter((r) => r.state === 'heads');

  const mood = (() => {
    const seed = new Date().getDate();
    const vars = (r?: (typeof rows)[number]) => ({ app: r?.label ?? '', time: fmt(r?.used ?? 0), limit: fmt(r?.limitMin ?? 0), streak: streakDays });
    if (!hasUsageAccess) return { label: 'Blind', pose: 'unplugged' as Pose, tint: colors.blush, color: colors.red, line: "Usage Access is off. I'm guessing now." };
    if (!tracked.length) return { label: 'Bored', pose: 'bored' as Pose, tint: colors.blush, color: colors.red, line: 'Nothing to watch. Suspicious.' };
    if (att.onLeaveToday) return { label: 'On leave', pose: 'couch' as Pose, tint: '#E4EEFB', color: '#2D5FA8', line: "On leave today. Enjoy it. I'm still counting." };
    if (paused) return { label: 'Day off', pose: 'stretching' as Pose, tint: '#EDEDED', color: colors.muted, line: "I'm judging silently." };
    if (firstVisit) return { label: 'Setup done', pose: 'binoculars' as Pose, tint: colors.blush, color: colors.red, line: "Go live your life. I'll be watching." };
    if (over.length && over.length === rows.length)
      return {
        label: 'Done',
        pose: 'meltdown' as Pose,
        tint: colors.blush,
        color: colors.red,
        line: rows.length === 1 ? `${rows[0].label}'s limit, gone by ${clockNow()}. Go outside.` : `All ${rows.length === 3 ? 'three' : rows.length} limits gone by ${clockNow()}. New record.`,
      };
    if (over.length)
      return { label: 'Disgusted', pose: 'disgusted' as Pose, tint: colors.blush, color: colors.red, line: fill(pickRoast({ category: 'home_over', lang: roastLang, intensity, roaster, name, seed, vars: VARS, packageName: over[0].packageName, appLabel: over[0].label }) ?? "I'm not angry. I'm disappointed.", vars(over[0])) };
    if (close.length) {
      const pct = Math.round((close[0].used / close[0].limitMin) * 100);
      return { label: 'Suspicious', pose: 'eyesOnYou' as Pose, tint: colors.headsTint, color: colors.heads, line: fill(pickRoast({ category: 'home_close', lang: roastLang, intensity, roaster, name, seed, vars: VARS, packageName: close[0].packageName, appLabel: close[0].label }) ?? `${close[0].label}'s at ${pct}%. I see you.`, vars(close[0])) };
    }
    if (dayOne && total === 0) return { label: 'Day one', pose: 'notes' as Pose, tint: colors.headsTint, color: colors.heads, line: "I'm taking notes. Check back tonight." };
    return { label: 'Chill', pose: 'happyChill' as Pose, tint: colors.chillTint, color: colors.chill, line: fill(pickRoast({ category: 'home_under', lang: roastLang, intensity, roaster, name, seed, vars: VARS }) ?? 'Under every limit. Who are you?', vars(rows[0])) };
  })();

  const streakAtRisk = over.length > 0 && !att.onLeaveToday;
  const streak = att.ready ? att.streak : streakDays;
  // Under the total: say what matters. Never praise the total while an app is over its limit.
  const allOver = !!over.length && over.length === rows.length;
  const totalNote = killed
    ? 'Last known. I missed a few hours.'
    : att.onLeaveToday
      ? 'No roasts today. Leave Letter approved.'
    : allOver && rows.length > 1
      ? `${fmt(over.reduce((n, r) => n + r.used - r.limitMin, 0))} past every limit`
    : over.length === 1
      ? `${fmt(over[0].used - over[0].limitMin)} over on ${over[0].label}.`
      : over.length > 1
        ? `${over.length} apps over their limit.`
        : comparison(total);
  const showTotal = !!tracked.length && !paused && !firstVisit && !(dayOne && total === 0);

  // "Next roast in…": the app closest to its limit that isn't over yet (same number as the status notification).
  const nextUp = rows.filter((r) => r.state !== 'roasted').sort((a, b) => a.limitMin - a.used - (b.limitMin - b.used))[0];
  const nextRoast = showTotal && nextUp && !att.onLeaveToday ? `${nextUp.label}: ${fmt(nextUp.limitMin - nextUp.used)} till I show up` : null;
  const goalName = goal === 'own' ? goalText : goal ? GOAL_LABEL[goal] : undefined;

  // One event card at a time (decided 15 Oct), highest priority first.
  // Product Book: killed → Premium ended (pick 3) → Strike → leave → fresh roasts → perfect day → first-week tips.
  const card: 'killed' | 'ended' | 'leave' | 'news' | 'perfect' | 'strict' | 'how' | 'dayOne' | null = killed
    ? 'killed'
    : overFree
      ? 'ended'
      : att.onLeaveToday && tracked.length
      ? 'leave'
      : news
        ? 'news'
        : perfectYesterday && perfectSeen !== localDay()
          ? 'perfect'
          : !tracked.length || paused
            ? null
            : allOver && strictNudgeSeen !== localDay()
              ? 'strict'
              : firstVisit
                ? 'how'
                : dayOne && total === 0
                  ? 'dayOne'
                  : null;

  // Premium: the whole screen goes black with red light (canvas TD2-P1/P2), unless they picked Classic in Settings.
  const P = isPremium && homeLook !== 'classic';
  const ink = P ? colors.white : colors.ink;
  const soft = P ? 'rgba(255,255,255,0.72)' : colors.muted;
  const heroColors: readonly [string, string, string] = P
    ? over.length
      ? ['#C40F25', '#8A0A1A', '#4A0510']
      : ['#FF3048', '#E5132B', '#9E0B1C']
    : [mood.tint, deeper(mood.tint), deeper(mood.tint)];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: P ? PREMIUM_BOTTOM : colors.bg }} edges={['top']}>
      <RedStatusBar light={P} />
      {P ? <PremiumBackdrop /> : null}
      <View style={st.header}>
        <View style={{ gap: 6 }}>
          <Wordmark width={88} variant={P ? 'white' : 'ink'} />
          {P ? (
            <View style={st.premiumMark}>
              <StarIcon size={10} color={colors.red} />
              <T v="bodyBold" style={{ fontSize: 10, letterSpacing: 0.8, color: colors.red }}>PREMIUM</T>
            </View>
          ) : null}
        </View>
        {/* Streak · Loops · Leaves: tap to open Attendance. */}
        <Pressable accessibilityRole="button" accessibilityLabel="Open Attendance" onPress={() => router.push('/attendance')} style={{ flexDirection: 'row', gap: 6 }}>
          <View style={[st.chip, P && st.glassChip, { backgroundColor: streakAtRisk ? colors.red : P ? GLASS : colors.blush }]} accessibilityLabel={streakAtRisk ? 'Streak at risk' : `${streak}-day streak`}>
            <FlameIcon color={streakAtRisk ? colors.white : P ? CORAL : colors.red} />
            <T v="bodyBold" style={{ fontSize: 13, color: streakAtRisk || P ? colors.white : colors.red }}>{streakAtRisk ? `${streak} · at risk` : streak}</T>
          </View>
          <View style={[st.chip, P && st.glassChip, { backgroundColor: P ? GLASS : '#FFF6E0' }]} accessibilityLabel={`${att.loops} Loops`}>
            <LoopsIcon color={P ? CORAL : undefined} />
            <T v="bodyBold" style={{ fontSize: 13, color: P ? colors.white : '#8A5A00' }}>{att.loops}</T>
          </View>
          <View style={[st.chip, P && st.glassChip, { backgroundColor: P ? GLASS : '#F2F0F0' }]} accessibilityLabel={`${att.freeLeavesLeft} leaves left`}>
            <LeafIcon color={ink} />
            <T v="bodyBold" style={{ fontSize: 13, color: ink }}>{att.freeLeavesLeft}</T>
          </View>
        </Pressable>
      </View>

      {!hasUsageAccess ? (
        <View accessibilityRole="alert" style={st.banner}>
          <T v="bodyBold" style={{ flex: 1, color: colors.white, fontSize: 15 }}>I can&apos;t see anything. Did you turn me off?</T>
          <Pressable accessibilityRole="button" onPress={openUsageAccessSettings} style={st.bannerBtn}>
            <T v="bodyBold" style={{ fontSize: 14, color: colors.red }}>Fix it</T>
          </Pressable>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 16, paddingBottom: 32, gap: 16 }}>
        {/* Hero: the roaster is the star of this screen, so they get the space. */}
        {/* The gradient is a background layer, not a wrapper: wrapped content sometimes doesn't paint on Android. */}
        <View style={[st.hero, P && st.heroPremium]}>
          <LinearGradient colors={heroColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {P ? <HeroGlow /> : null}
          <View style={st.heroChar} pointerEvents="none">
            <Character source={pose(roaster, mood.pose)} size={250} alt={`${roasterName[roaster]}, ${mood.label.toLowerCase()}`} />
          </View>
          <View style={st.heroText}>
            <View style={[st.moodPill, { backgroundColor: colors.white }]}>
              <View style={[st.moodDot, { backgroundColor: P ? colors.red : mood.color }]} />
              <T v="bodyBold" style={{ fontSize: 12, color: P ? colors.red : mood.color }}>{mood.label}</T>
            </View>
            <T v="bodyBold" style={{ fontSize: 20, lineHeight: 26, color: ink }}>{mood.line}</T>
          </View>
          {showTotal ? (
            <View style={st.heroTotal}>
              <T v="label" style={{ fontSize: 11, color: ink, opacity: P ? 0.75 : 0.6 }}>{P ? `Today · ${tracked.length} apps` : 'Today'}</T>
              <T style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: ink }}>{fmt(total)}</T>
              <T v="caption" style={{ color: ink, opacity: P ? 0.85 : 0.7 }} numberOfLines={2}>{totalNote}</T>
              {nextRoast ? (
                <View style={[st.nextRoast, P && { backgroundColor: 'rgba(0,0,0,0.22)' }]}>
                  <EyeIcon color={P ? colors.white : mood.color} />
                  <T v="bodyBold" style={{ flexShrink: 1, fontSize: 13, lineHeight: 17, color: ink }}>{nextRoast}</T>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {goalName && tracked.length ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
            <TargetIcon color={over.length ? (P ? CORAL : colors.red) : soft} />
            <T v="bodyBold" style={{ flex: 1, fontSize: 13, color: over.length ? (P ? CORAL : colors.red) : soft }} numberOfLines={1}>
              {over.length ? `${goalName}, remember?` : `Here for: ${goalName}`}
            </T>
          </View>
        ) : null}

        {gone ? (
          <View accessibilityRole="alert" style={st.toast}>
            <Avatar source={pose(roaster, 'impressed')} size={36} />
            <T v="bodyBold" style={{ flex: 1, fontSize: 14, color: colors.white }}>{gone}&apos;s gone. Bold move. Slot freed.</T>
            <Pressable accessibilityLabel="Dismiss" onPress={() => setGone(null)} hitSlop={8}>
              <CloseIcon color={colors.white} />
            </Pressable>
          </View>
        ) : null}

        {card === 'news' ? (
          <View accessibilityRole="alert" style={[st.news, P && st.glassCard]}>
            <Avatar source={pose(roaster, 'party')} size={40} bg={P ? 'rgba(255,255,255,0.15)' : colors.white} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="label" style={{ fontSize: 11, color: P ? CORAL : colors.white, opacity: P ? 1 : 0.85 }}>{P ? 'Early access · fresh roasts' : 'Fresh roasts'}</T>
              <T v="bodyBold" style={{ fontSize: 15, lineHeight: 20, color: colors.white }}>{news}</T>
            </View>
            <Pressable accessibilityLabel="Dismiss" onPress={dismissNews} hitSlop={8}>
              <CloseIcon color={colors.white} />
            </Pressable>
          </View>
        ) : null}

        {card === 'killed' ? <KilledCard face={pose(roaster, 'asleep')} name={roasterName[roaster]} onClose={() => setKilled(false)} /> : null}

        {!tracked.length ? <Button label="Pick apps" onPress={() => router.push('/onboarding/pick-apps')} /> : null}
        {paused ? <Button label="Resume now" tone="outline" onPress={() => set({ pausedOn: undefined })} /> : null}

        {card === 'perfect' ? (
          <LinearGradient colors={gradients.proud} style={st.perfect}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Character source={pose(roaster, 'party')} size={64} alt={`${roasterName[roaster]}, setting off a party popper`} />
              <T v="label" style={{ flex: 1, fontSize: 12, color: '#8A4A20' }}>Yesterday · perfect day</T>
              <Pressable accessibilityLabel="Dismiss" onPress={() => set({ perfectSeen: localDay() })} hitSlop={8}>
                <CloseIcon color="#8A4A20" />
              </Pressable>
            </View>
            <T style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 27, color: colors.ink }}>{att.yesterdayLoops ? `Perfect day: +${att.yesterdayLoops} Loops` : 'All under limits. I’m… proud? Weird feeling.'}</T>
            <T style={{ fontSize: 14, lineHeight: 20, color: '#5F3A2E' }}>
              {`${tracked.length === 1 ? 'Your app' : `All ${tracked.length} apps`} stayed under. ${att.streak >= 1 ? `That's ${att.streak} ${att.streak === 1 ? 'day' : 'days'} present. ` : ''}${att.loops >= LETTER_COST ? 'Enough Loops for a Leave Letter.' : `${LETTER_COST - att.loops} more Loops to a leave.`}`}
            </T>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                set({ perfectSeen: localDay() });
                Share.share({ message: 'Yesterday: every app under its limit. My screen-time app is proud of me. Weird. Get roasted too → endloop app' });
              }}
              style={st.shareBtn}>
              <T v="bodyBold" style={{ fontSize: 14, color: colors.white }}>Share it</T>
            </Pressable>
          </LinearGradient>
        ) : null}

        {card === 'ended' ? (
          <View style={[st.strict, P && st.glassCard]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar source={pose(roaster, 'goodbye')} size={40} bg={P ? 'rgba(255,255,255,0.12)' : colors.blush} />
              <T v="bodyBold" style={{ flex: 1, fontSize: 16, color: ink }}>Premium ended. Pick 3 apps to keep.</T>
            </View>
            <T style={{ fontSize: 14, lineHeight: 20, color: soft }}>
              Till you do, I&apos;m watching your 3 most used: {watched.map((a) => a.label).join(', ').replace(/, ([^,]*)$/, ' and $1')}.
            </T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/keep-apps')} style={[st.shareBtn, { backgroundColor: colors.red }]}>
                <T v="bodyBold" style={{ fontSize: 14, color: colors.white }}>Pick 3</T>
              </Pressable>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push({ pathname: '/paywall', params: { reason: 'ended' } })}>
                <T v="bodyBold" style={{ fontSize: 14, color: soft, textDecorationLine: 'underline' }}>Get Premium back</T>
              </Pressable>
            </View>
          </View>
        ) : null}

        {card === 'leave' ? (
          <View style={[st.leave, P && st.glassCard]}>
            <T v="bodyBold" style={{ fontSize: 16, color: P ? colors.white : '#1F4A85' }}>Streak paused, not broken</T>
            <T style={{ fontSize: 14, lineHeight: 20, color: P ? 'rgba(255,255,255,0.8)' : '#3A5A86' }}>No roasts today. I&apos;m still counting, though. Back tomorrow, same limits.</T>
          </View>
        ) : null}

        {card === 'strict' ? (
          <View style={[st.strict, P && st.glassCard]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar source={pose(roaster, 'padlock')} size={40} bg={P ? 'rgba(255,255,255,0.12)' : colors.blush} />
              <T v="bodyBold" style={{ flex: 1, fontSize: 16, color: ink }}>Want me to be stricter tomorrow?</T>
            </View>
            <T style={{ fontSize: 14, lineHeight: 20, color: soft }}>Strict mode takes away every snooze. You can only switch it off from the next day.</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => (isPremium ? router.push('/prefs/snooze') : router.push({ pathname: '/paywall', params: { reason: 'strict' } }))}
                style={[st.shareBtn, { backgroundColor: colors.red, flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
                {isPremium ? null : <StarIcon size={12} color="#FFD27A" />}
                <T v="bodyBold" style={{ fontSize: 14, color: colors.white }}>Try Strict mode</T>
              </Pressable>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => set({ strictNudgeSeen: localDay() })}>
                <T v="bodyBold" style={{ fontSize: 14, color: soft, textDecorationLine: 'underline' }}>Not now</T>
              </Pressable>
            </View>
          </View>
        ) : null}

        {card === 'how' ? (
          <View style={st.how}>
            <Pressable accessibilityLabel="Dismiss" onPress={() => set({ howItWorksDismissed: true })} style={st.dismiss} hitSlop={8}>
              <CloseIcon />
            </Pressable>
            <T v="bodyBold">Here&apos;s how it works</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                ['75%', 'Heads up', colors.heads],
                ['90%', 'Last call', colors.heads],
                ['100%', 'I take over', colors.red],
              ].map(([p, t, c]) => (
                <View key={p} style={st.howStep}>
                  <T style={{ fontFamily: fonts.display, fontSize: 20, color: c }}>{p}</T>
                  <T v="bodyBold" style={{ fontSize: 12, lineHeight: 16 }}>{t}</T>
                </View>
              ))}
            </View>
          </View>
        ) : card === 'dayOne' ? (
          <View style={st.dayOne}>
            <T v="label" style={{ fontSize: 11 }}>Watching</T>
            <T v="bodyBold">{tracked.map((a) => a.label).join(', ').replace(/, ([^,]*)$/, ' and $1')}</T>
            <T v="caption" style={{ fontSize: 14, lineHeight: 20 }}>Your first numbers show up after you use them a little. Warnings at 75% and 90%, then I take over.</T>
          </View>
        ) : null}

        <View style={{ gap: 10, opacity: paused ? 0.5 : 1 }}>
          {rows.length ? <T v="label" style={{ paddingTop: 4, color: soft }}>{P ? `Your apps · ${rows.length} of 6` : 'Your apps'}</T> : null}
          {rows.map((r) => {
            const base = P ? { ...stateStyle[r.state], ...PREMIUM_STATE[r.state] } : stateStyle[r.state];
            const ss = att.onLeaveToday ? { ...base, label: 'No roasts', color: P ? '#9CC0FF' : '#2D5FA8', tint: P ? 'rgba(156,192,255,0.16)' : '#E4EEFB' } : base;
            return (
              <Pressable
                key={r.packageName}
                accessibilityRole="button"
                accessibilityLabel={`${r.label}, ${fmt(r.used)} of ${fmt(r.limitMin)}, ${ss.label}`}
                onPress={() => router.push(`/app/${encodeURIComponent(r.packageName)}`)}
                style={[st.appCard, P && st.glassCard]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <AppTile label={r.label} color={r.color} iconUri={r.iconUri} size={44} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="bodyBold" style={{ fontSize: 17, color: ink }}>{r.label}</T>
                    <T v="caption" style={{ fontSize: 14, color: soft }}>
                      <T v="caption" style={{ fontSize: 14, fontFamily: fonts.bold, color: ink }}>{fmt(r.used)}</T> of {fmt(r.limitMin)}
                    </T>
                  </View>
                  <Pill text={ss.label} color={ss.color} bg={ss.tint} />
                </View>
                <View style={[st.track, P && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                  <View style={{ width: `${Math.max(2, Math.min(100, (r.used / r.limitMin) * 100))}%`, height: 8, borderRadius: 4, backgroundColor: ss.color }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <FlameIcon size={12} color={(att.perApp[r.packageName]?.streak ?? 0) ? (P ? CORAL : colors.red) : '#8A8A8A'} />
                    <T v="bodyBold" style={{ fontSize: 12, color: (att.perApp[r.packageName]?.streak ?? 0) ? (P ? CORAL : colors.red) : P ? 'rgba(255,255,255,0.5)' : '#8A8A8A' }}>{att.perApp[r.packageName]?.streak ?? 0}-day streak</T>
                  </View>
                  {earns(r) ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <LoopsIcon size={12} color={P ? CORAL : undefined} />
                      <T v="bodyBold" style={{ fontSize: 12, color: P ? '#FFD3D9' : '#8A5A00' }}>Earning Loops</T>
                    </View>
                  ) : (
                    <T v="bodyBold" style={{ fontSize: 12, color: P ? 'rgba(255,255,255,0.5)' : '#8A8A8A' }}>Not earning</T>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {isPremium ? (
          <T v="caption" style={{ textAlign: 'center', color: soft }}>{tracked.length < 6 ? `${6 - tracked.length} more ${6 - tracked.length === 1 ? 'slot' : 'slots'} to fill` : 'All 6 slots watched'}</T>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setPremium(true)} style={st.upsell}>
            <T v="caption" style={{ flex: 1, fontSize: 14 }}>{watched.length} of 3 free apps</T>
            <StarIcon size={13} />
            <T v="bodyBold" style={{ fontSize: 14, color: '#8A5A00' }}>Watch up to 6</T>
          </Pressable>
        )}
      </ScrollView>

      <PremiumSheet visible={premium} onClose={() => setPremium(false)} roaster={roaster} reason="apps" />
    </SafeAreaView>
  );
}

/** Screen 16: the phone put the watcher to sleep. Brand-specific steps so it doesn't happen again. */
function KilledCard({ face, name, onClose }: { face: number; name: string; onClose: () => void }) {
  const steps = batterySteps();
  return (
    <View accessibilityRole="alert" style={st.killed}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar source={face} size={48} bg="#3A3A3A" />
        <T v="bodyBold" style={{ flex: 1, fontSize: 17, lineHeight: 22, color: colors.white }} accessibilityLabel={`${name}, asleep. Your phone put me to sleep, so your apps got a free pass. Let's stop that.`}>Your phone put me to sleep, so your apps got a free pass. Let&apos;s stop that.</T>
        <Pressable accessibilityLabel="Dismiss" onPress={onClose} hitSlop={8}>
          <CloseIcon color={colors.white} />
        </Pressable>
      </View>
      {steps ? (
        <>
          <T v="bodyBold" style={{ fontSize: 13, color: '#FFB38A' }}>On {steps.brand} phones:</T>
          {steps.steps.map((x, i) => (
            <T key={x} style={{ fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.85)' }}>{i + 1}. {x}</T>
          ))}
        </>
      ) : (
        <T style={{ fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.85)' }}>Set Endloop&apos;s battery use to Unrestricted so I stay awake.</T>
      )}
      <Pressable accessibilityRole="button" onPress={openBatterySettings} style={st.killedBtn}>
        <T v="bodyBold" style={{ fontSize: 15 }}>Fix it in 2 taps</T>
      </Pressable>
      {steps ? (
        <Pressable accessibilityRole="button" onPress={() => openBrandBackgroundSettings()} style={[st.killedBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' }]}>
          <T v="bodyBold" style={{ fontSize: 15, color: colors.white }}>{steps.brandPage}</T>
        </Pressable>
      ) : null}
    </View>
  );
}

const GLASS = 'rgba(255,255,255,0.1)';
const CORAL = '#FF8C99';
const PREMIUM_STATE = {
  chill: { color: '#5BD6A0', tint: 'rgba(91,214,160,0.16)' },
  heads: { color: '#FFB547', tint: 'rgba(255,181,71,0.16)' },
  roasted: { color: '#FF5A6A', tint: 'rgba(255,90,106,0.18)' },
} as const;

/** Coral light behind the roaster in the Premium hero. */
function HeroGlow() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="pGlow" cx="78%" cy="88%" rx="48%" ry="48%">
          <Stop offset="0" stopColor="#FF8C78" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FF8C78" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#pGlow)" />
    </Svg>
  );
}

const GOAL_LABEL: Record<Exclude<Goal, 'own'>, string> = {
  exams: 'Exams',
  sleep: 'Better sleep',
  focus: 'Focus at work',
  family: 'Family time',
  checking: 'Just checking',
};

/** Earns Loops: the limit is below the user's own normal (same rule as onboarding's Earning pill). */
const earns = (a: TrackedApp) => a.avgDailyMin >= 5 && a.limitMin < a.avgDailyMin;

/** "9 pm" / "9:30 pm" for the every-limit-gone line. */
function clockNow(): string {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return `${h}${m >= 10 ? `:${String(m).padStart(2, '0')}` : ''} ${d.getHours() < 12 ? 'am' : 'pm'}`;
}

/** A slightly deeper shade of the mood tint, for the hero gradient. */
function deeper(tint: string): string {
  const map: Record<string, string> = { [colors.blush]: '#FFC9D0', [colors.headsTint]: '#FFDDA8', [colors.chillTint]: '#C4E8D7', '#EDEDED': '#D9D9D9' };
  return map[tint] ?? tint;
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 999 },
  glassChip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  premiumMark: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, height: 20, paddingHorizontal: 8, borderRadius: 999, backgroundColor: colors.white },
  heroPremium: { minHeight: 290, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', elevation: 12, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 12 } },
  nextRoast: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 8, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.72)' },
  banner: { marginHorizontal: 24, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.red, borderRadius: 16, paddingVertical: 12, paddingLeft: 16, paddingRight: 12 },
  bannerBtn: { height: 38, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.white, justifyContent: 'center' },
  hero: { borderRadius: 28, overflow: 'hidden', minHeight: 270, padding: 20, justifyContent: 'space-between' },
  heroChar: { position: 'absolute', right: -58, bottom: 0 },
  heroText: { width: '50%', gap: 12 },
  heroTotal: { width: '46%', gap: 2, paddingTop: 16 },
  moodPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: 999 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  how: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 16, gap: 10 },
  dismiss: { position: 'absolute', right: 12, top: 12, zIndex: 1 },
  howStep: { flex: 1, gap: 4, padding: 10, borderRadius: 14, backgroundColor: colors.white },
  appCard: { gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surface },
  upsell: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.surface },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.ink },
  news: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.red },
  killed: { gap: 10, padding: 16, borderRadius: 18, backgroundColor: colors.ink },
  killedBtn: { height: 44, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  perfect: { gap: 12, padding: 18, borderRadius: 22 },
  shareBtn: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.ink, justifyContent: 'center' },
  dayOne: { gap: 6, padding: 16, borderRadius: 20, backgroundColor: colors.surface },
  leave: { gap: 6, padding: 16, borderRadius: 20, backgroundColor: '#E4EEFB' },
  strict: { gap: 10, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
});
