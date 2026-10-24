/**
 * The snooze ladder (Product Book A4, canvas Screen 23). The native roast opens this screen when
 * "I need 5 more minutes" is tapped (endloop://snooze?pkg=…&app=…&step=…). Every snooze today costs
 * more than the last, but there is always a way through:
 *   1 · convince (pick a reason, the roaster answers, 5 s)   2 · a reflex game (20 s fallback)
 *   3 · a harder game (45 s fallback)                        4 · 2-min cool-off or Bunk   5+ · 5-min cool-off or Bunk
 * Winning (or waiting out the timer) snoozes that app and opens it again. Leaving this screen without
 * finishing grants nothing, so the next open of the app is roasted as usual.
 */
import { EndloopCore } from 'endloop-core';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, BackHandler, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { pose, roasterName, type Pose } from '@/characters';
import { BUNK, COOL, HECKLE, pick, reasonsFor, say, type Reason } from '@/content/snooze';
import { StarIcon, WarnIcon } from '@/components/icons';
import { btn, FadedPose, SpotlightScreen } from '@/components/onboarding-ui';
import { CatchGame, QuickDrawGame, RpsGame, SwipeGame, type GameProps } from '@/components/snooze-games';
import { ArcadeScreen, clock, GameTitle, GiveUp, Heckle, LadderDots, Ring, TopBar, W80 } from '@/components/snooze-ui';
import { Button, T } from '@/components/ui';
import { useAttendance } from '@/lib/attendance';
import { snoozeMin } from '@/lib/watcher';
import { appKind } from '@/roasts/kinds';
import { localDay, strictActive, useSettings, type Bunk } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

type Game = 'catch' | 'quick' | 'swipe' | 'rps';
type Phase = 'own' | 'convince' | 'reply' | 'game' | 'won' | 'cool' | 'bunk' | 'timeout' | 'strict';

const GAME_FALLBACK: Record<2 | 3, number> = { 2: 20, 3: 45 };
const GAMES: Record<Game, { a: string; b: string; stake: (app: string, min: number) => string; heckle: keyof typeof HECKLE; Comp: (p: GameProps) => React.ReactElement }> = {
  catch: { a: 'CATCH', b: 'ME', stake: (app, m) => `Win: ${m} min of ${app}`, heckle: 'catch', Comp: CatchGame },
  quick: { a: 'QUICK', b: 'DRAW', stake: (app, m) => `3 clean taps: ${m} min of ${app}`, heckle: 'quick', Comp: QuickDrawGame },
  swipe: { a: 'SWIPE', b: 'LEFT', stake: (app, m) => `Nope them away: ${m} min of ${app}`, heckle: 'swipe', Comp: SwipeGame },
  rps: { a: 'STONE', b: 'PAPER', stake: (app, m) => `Win in a row: ${m} min of ${app}`, heckle: 'rps', Comp: RpsGame },
};

export default function Snooze() {
  const p = useLocalSearchParams<{ pkg?: string; app?: string; step?: string; game?: Game }>();
  const s = useSettings();
  const a = useAttendance();
  const pkg = p.pkg ?? s.tracked[0]?.packageName ?? '';
  const tracked = s.tracked.find((x) => x.packageName === pkg);
  const app = p.app || tracked?.label || 'that app';
  const step = Math.max(1, Number(p.step) || (EndloopCore?.snoozesToday?.() ?? 0) + 1);
  const minutes = snoozeMin(s);
  const lang = s.roastLang;
  const r = s.roaster;
  const who = roasterName[r];
  const streak = a.perApp[pkg]?.streak ?? 0;

  // The first phase (and, for step 2, a random reflex game) is fixed for this visit.
  const [init] = useState(() => {
    const roll = Math.random();
    // `game` is only passed when previewing a game; the watcher never sends it.
    const g: Game = p.game && p.game in GAMES ? p.game : step === 2 ? (['catch', 'quick', 'swipe'] as const)[Math.floor(roll * 3)] : 'rps';
    const ph: Phase = strictActive(s) && step > 3 ? 'strict' : step === 1 ? (s.premium && s.ownWords?.text ? 'own' : 'convince') : step <= 3 ? 'game' : 'cool';
    const sec = ph === 'game' ? GAME_FALLBACK[step as 2 | 3] : ph === 'cool' ? (step === 4 ? 120 : 300) : 0;
    return { game: g, phase: ph, sec, seed: Math.floor(roll * 1000) };
  });
  const { game, seed } = init;
  const [phase, setPhase] = useState<Phase>(init.phase);
  const [reason, setReason] = useState<Reason | null>(null);
  const [left, setLeft] = useState(init.sec);
  const [total, setTotal] = useState(init.sec);
  const [timedOut, setTimedOut] = useState(false);
  const [plainTimer, setPlainTimer] = useState(false);
  const [bunkHow, setBunkHow] = useState<Bunk['how'] | null>(null);

  // TalkBack users get a plain countdown of the same length instead of a game.
  useEffect(() => {
    // (The web preview reports a screen reader by default, so only trust it on the phone.)
    if (Platform.OS !== 'web') AccessibilityInfo.isScreenReaderEnabled().then(setPlainTimer).catch(() => {});
  }, []);

  function startTimer(sec: number) {
    setTotal(sec);
    setLeft(sec);
  }

  // One clock for every timed phase. When a game's fallback runs out they're in anyway (nobody gets stuck);
  // when the bunk timeout ends, the bunk goes through.
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => {
      setLeft(left - 1);
      if (left - 1 > 0) return;
      if (phase === 'game') {
        setTimedOut(true);
        setPhase('won');
      } else if (phase === 'timeout') doBunk('timeout');
    }, 1000);
    return () => clearTimeout(t);
    // doBunk only reads state that's settled by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  const reasons = useMemo(() => reasonsFor(appKind(pkg, app), new Date().getHours() >= 22 || new Date().getHours() < 5), [pkg, app]);

  /* ---------- actions ---------- */

  const home = () => router.replace('/(tabs)/today');

  function grant(why: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    EndloopCore?.grantSnooze?.(pkg, minutes, why);
    home();
    setTimeout(() => EndloopCore?.openApp?.(pkg), 60);
  }

  function giveUp() {
    EndloopCore?.addWin?.();
    home();
    setTimeout(() => BackHandler.exitApp(), 60);
  }

  function doBunk(how: Bunk['how']) {
    const day = localDay();
    const tomorrow = localDay(1);
    s.set({
      bunks: [...(s.bunks ?? []).filter((b) => b.day >= localDay(-40)), { pkg, day, how, at: Date.now() }],
      ...(how === 'payback' ? { tracked: s.tracked.map((x) => (x.packageName === pkg ? { ...x, payBackOn: tomorrow } : x)) } : {}),
    });
    EndloopCore?.bunk?.(pkg, how);
    home();
    setTimeout(() => EndloopCore?.openApp?.(pkg), 60);
  }

  const streakWarning = streak > 0 || tracked ? `Snoozing breaks today's ${app} streak${streak > 0 ? ` (${streak} ${streak === 1 ? 'day' : 'days'})` : ''} and its Loops.` : null;

  /* ---------- Premium: your own words, before the first snooze (S23-P-OwnWords) ---------- */
  if (phase === 'own') {
    return (
      <SpotlightScreen loopY={0.6}>
        <TopBarRed step={step} />
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <FadedPose source={pose(r, 'note')} size={190} alt={`${who} holding up a note`} />
        </View>
        <Animated.View entering={FadeInDown.duration(350)} style={st.ownCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T v="bodyBold" style={{ fontSize: 11, letterSpacing: 1.2, color: colors.red }}>YOUR OWN WORDS · {fmtShort(s.ownWords?.on)}</T>
            <View style={st.premiumPill}>
              <StarIcon size={10} />
              <T v="bodyBold" style={{ fontSize: 11, color: '#8A5A00' }}>Premium</T>
            </View>
          </View>
          <T style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 29, color: colors.ink }}>“{s.ownWords?.text}”</T>
          <T style={{ fontSize: 13, color: colors.muted }}>You wrote this. I&apos;m just holding it up.</T>
        </Animated.View>
        <View style={{ paddingHorizontal: 24, paddingTop: 18, gap: 6 }}>
          <T v="bodyBold" style={st.eyebrow}>Snooze {step} of 5</T>
          <T style={st.h1}>Still need {minutes} more minutes?</T>
        </View>
        <View style={{ flex: 1 }} />
        <View style={st.bottom}>
          <Button label="You're right. Close it." tone="white" style={btn} onPress={giveUp} />
          <GiveUpLight label="Still need it" onPress={() => setPhase('convince')} />
        </View>
      </SpotlightScreen>
    );
  }

  /* ---------- 1 · convince: pick a reason ---------- */
  if (phase === 'convince') {
    return (
      <SpotlightScreen loopY={0.55}>
        <TopBarRed step={step} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <View style={{ alignItems: 'center' }}>
            <FadedPose source={pose(r, 'chinOnHand')} size={190} alt={`${who}, chin on hand, waiting`} />
          </View>
          <View style={{ paddingHorizontal: 24, gap: 6 }}>
            <T v="bodyBold" style={st.eyebrow}>Snooze {step} of 5 · Convince me</T>
            <T style={st.h1}>Oh? {minutes} more minutes of {app}. Why?</T>
            <T style={st.sub}>Pick one. Be honest, I&apos;ll know.</T>
          </View>
          <View style={{ paddingHorizontal: 24, paddingTop: 14, gap: 8 }}>
            {reasons.map((x) => (
              <Pressable
                key={x.id}
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setReason(x);
                  startTimer(5);
                  setPhase('reply');
                }}
                style={st.reason}>
                <T v="bodyBold" style={{ fontSize: 15, color: colors.white }}>{x.label}</T>
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1, minHeight: 16 }} />
          <View style={st.bottom}>
            {streakWarning ? <Warning text={streakWarning} /> : null}
            <GiveUpLight label="Never mind, close it" onPress={giveUp} />
          </View>
        </ScrollView>
      </SpotlightScreen>
    );
  }

  /* ---------- 1 · convince: the roaster answers, 5 s that can't be skipped (S23-1) ---------- */
  if (phase === 'reply' && reason) {
    const done = left <= 0;
    return (
      <SpotlightScreen loopY={0.5}>
        <TopBarRed step={step} />
        <View style={{ alignItems: 'center' }}>
          <FadedPose source={pose(r, 'chinOnHand')} size={170} alt={`${who}, unconvinced`} />
        </View>
        <View style={{ paddingHorizontal: 24, gap: 6 }}>
          <T v="bodyBold" style={st.eyebrow}>Snooze {step} of 5 · Convince me</T>
          <Animated.View entering={FadeIn.duration(300)}>
            <T style={st.h1}>{say(pick(reason.replies, seed), lang)}</T>
          </Animated.View>
          <T style={st.sub}>Five seconds, then it&apos;s yours.</T>
        </View>
        <View style={{ alignItems: 'center', paddingTop: 18 }}>
          <Ring left={left} total={total} size={130} label={String(Math.max(0, left))} sub="seconds" />
        </View>
        <View style={{ flex: 1 }} />
        <View style={st.bottom}>
          {streakWarning ? <Warning text={streakWarning} /> : null}
          <Button label={done ? `Open ${app}` : `Open ${app} in ${left}`} tone="white" disabled={!done} style={btn} onPress={() => grant(reason.label)} />
          <GiveUpLight label="Never mind, close it" onPress={giveUp} />
        </View>
      </SpotlightScreen>
    );
  }

  /* ---------- 2–3 · games (S23-2a/2b/2c/3). TalkBack: a plain countdown of the same length ---------- */
  if (phase === 'game') {
    const g = GAMES[game];
    return (
      <ArcadeScreen>
        <TopBar step={step} />
        <GameTitle eyebrow={step === 3 ? `Snooze ${step} of 5 · harder` : `Snooze ${step} of 5`} a={g.a} b={g.b} stake={g.stake(app, minutes)} />
        <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 10 }}>
          {plainTimer ? (
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Ring left={left} total={total} label={clock(left)} sub="left" />
              <T style={{ fontSize: 15, color: W80, textAlign: 'center', paddingHorizontal: 30 }}>A plain countdown instead of a game. When it ends, {app} is yours for {minutes} minutes.</T>
            </View>
          ) : (
            <g.Comp roaster={r} hard={!!(s.premium && s.hardMode)} secondsLeft={left} onWin={() => setPhase('won')} />
          )}
        </View>
        <Heckle face={pose(r, game === 'catch' ? 'running' : game === 'quick' ? 'buzzer' : 'smug')} text={say(pick(HECKLE[g.heckle], seed), lang)} />
        <GiveUp label={`Give up, close ${app}`} onPress={giveUp} />
      </ArcadeScreen>
    );
  }

  /* ---------- game over: won, or the fallback timer let them through ---------- */
  if (phase === 'won') {
    const face: Pose = timedOut ? 'smug' : 'soreLoser';
    return (
      <ArcadeScreen>
        <TopBar step={step} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 }}>
          <Animated.View entering={FadeIn.duration(300)}>
            <FadedPose source={pose(r, face)} size={240} alt={timedOut ? `${who}, smug` : `${who}, a sore loser`} />
          </Animated.View>
          <T v="bodyBold" style={st.eyebrow}>{timedOut ? "Time's up" : 'You won'}</T>
          <T style={[st.h1, { textAlign: 'center' }]}>{say(pick(timedOut ? HECKLE.timeout : HECKLE.win, seed), lang)}</T>
        </View>
        <View style={st.bottom}>
          <Button label={`Open ${app} · ${minutes} min`} tone="white" style={btn} onPress={() => grant(`game:${game}${timedOut ? ':timeout' : ''}`)} />
          <GiveUp label={`Actually, close ${app}`} onPress={giveUp} />
        </View>
      </ArcadeScreen>
    );
  }

  /* ---------- 4+ · cool-off (S23-4) ---------- */
  if (phase === 'cool') {
    const done = left <= 0;
    return (
      <SpotlightScreen loopY={0.6}>
        <TopBarRed step={step} />
        <View style={{ alignItems: 'center' }}>
          <FadedPose source={pose(r, 'footTap')} size={180} alt={`${who}, tapping a foot, checking the watch`} />
        </View>
        <View style={{ paddingHorizontal: 24, gap: 6 }}>
          <T v="bodyBold" style={st.eyebrow}>Snooze {Math.min(step, 5)} of 5 · Cool-off</T>
          <T style={st.h1}>{say(step === 4 ? COOL.title2 : COOL.title5, lang)}</T>
          <T style={st.sub}>
            You&apos;ve snoozed {step - 1} times today across your apps.{step === 4 ? ' Next time it’s 5 minutes.' : ''} {left > 0 && left < total - 20 ? say(pick(COOL.still, seed), lang) : ''}
          </T>
        </View>
        <View style={{ alignItems: 'center', paddingTop: 16 }}>
          <Ring left={left} total={total} label={clock(left)} sub="left" />
        </View>
        <View style={{ flex: 1 }} />
        <View style={st.bottom}>
          <Button label={done ? `Open ${app}` : `Open ${app} in ${clock(left)}`} tone="white" disabled={!done} style={btn} onPress={() => grant('cooloff')} />
          <GiveUpLight label="Bunk today instead" onPress={() => setPhase('bunk')} />
        </View>
      </SpotlightScreen>
    );
  }

  /* ---------- Bunk today (S23-5) ---------- */
  if (phase === 'bunk' || phase === 'timeout') {
    const hasLeave = a.freeLeavesLeft > 0;
    const chosen = bunkHow ?? (hasLeave ? 'leave' : null);
    if (phase === 'timeout') {
      return (
        <SpotlightScreen loopY={0.6}>
          <TopBarRed step={step} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 }}>
            <FadedPose source={pose(r, 'footTap')} size={200} alt={`${who}, waiting`} />
            <T style={[st.h1, { textAlign: 'center' }]}>{say(BUNK.timeout, lang)}</T>
            <Ring left={left} total={total} label={clock(left)} sub="outside the class" />
          </View>
          <View style={st.bottom}>
            <GiveUpLight label="Never mind, close it" onPress={giveUp} />
          </View>
        </SpotlightScreen>
      );
    }
    const options: { how: Bunk['how']; title: string; sub: string; disabled?: boolean }[] = [
      { how: 'leave', title: 'Use a leave', sub: hasLeave ? `${a.freeLeavesLeft} left this month. ${app} is free till midnight.` : '0 left this month', disabled: !hasLeave },
      { how: 'timeout', title: '1-min timeout', sub: `Wait one minute. Then ${app}'s open till midnight.` },
      { how: 'payback', title: 'Pay it back', sub: `Open it now. ${app} gets 15 min less tomorrow.` },
    ];
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <SpotlightScreen loopY={0.2}>
          <TopBarRed step={step} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
            <FadedPose source={pose(r, 'door')} size={150} alt={`${who}, pointing at the door`} />
            <View style={{ flex: 1, gap: 4 }}>
              <T v="bodyBold" style={st.eyebrow}>Snooze {Math.min(step, 5)} of 5</T>
              <T style={[st.h1, { fontSize: 30 }]}>Bunk today?</T>
            </View>
          </View>
          <ScrollView style={st.sheet} contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 24 }}>
            <T style={{ fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink }}>{hasLeave ? 'Use a leave, or pick your punishment.' : 'No leaves left. Pick your punishment.'}</T>
            {options.map((o) => {
              const on = chosen === o.how;
              return (
                <Pressable
                  key={o.how}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on, disabled: o.disabled }}
                  disabled={o.disabled}
                  onPress={() => setBunkHow(o.how)}
                  style={[st.option, on && { borderColor: colors.red, borderWidth: 2 }, o.disabled && { opacity: 0.5 }]}>
                  <View style={[st.radio, on && { borderColor: colors.red }]}>{on ? <View style={st.radioDot} /> : null}</View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="bodyBold" style={{ fontSize: 15, color: colors.ink }}>{o.title}</T>
                    <T style={{ fontSize: 13, lineHeight: 18, color: colors.muted }}>{o.sub}</T>
                  </View>
                </Pressable>
              );
            })}
            <View style={st.strikeBox}>
              <WarnIcon size={16} />
              <T v="bodyBold" style={{ flex: 1, fontSize: 13, lineHeight: 18, color: '#7A4A00' }}>Either way: a Strike on Attendance, {app}&apos;s streak back to 0, no Loops today.</T>
            </View>
            <Button
              label="Bunk today"
              disabled={!chosen}
              style={btn}
              onPress={() => {
                if (!chosen) return;
                if (chosen === 'timeout') {
                  startTimer(60);
                  setPhase('timeout');
                } else doBunk(chosen);
              }}
            />
            {chosen ? <T style={{ fontSize: 13, lineHeight: 18, color: colors.muted, textAlign: 'center' }}>{say(BUNK[chosen], lang)}</T> : null}
            <Pressable accessibilityRole="button" onPress={giveUp} style={{ alignSelf: 'center', padding: 8 }}>
              <T v="bodyBold" style={{ fontSize: 14, color: colors.ink, textDecorationLine: 'underline' }}>Never mind, close it</T>
            </Pressable>
          </ScrollView>
        </SpotlightScreen>
      </View>
    );
  }

  /* ---------- Premium Strict mode wall (S23-P-Strict) ---------- */
  return (
    <ArcadeScreen>
      <TopBar step={step} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 }}>
        <FadedPose source={pose(r, 'padlock')} size={250} alt={`${who} holding a gold padlock`} />
        <T style={[st.h1, { textAlign: 'center' }]}>Strict mode&apos;s on. No snoozes today.</T>
        <T style={[st.sub, { textAlign: 'center' }]}>You switched it on{s.strictSince ? ` ${fmtWeekday(s.strictSince)}` : ''}. It can only go off from tomorrow. Past you was right.</T>
      </View>
      <View style={st.bottom}>
        <Button label={`Close ${app}`} tone="white" style={btn} onPress={giveUp} />
      </View>
    </ArcadeScreen>
  );
}

function TopBarRed({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 12 }}>
      <LadderDots step={step} />
    </View>
  );
}

function GiveUpLight({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 10 }}>
      <T v="bodyBold" style={{ fontSize: 14, color: colors.white, textDecorationLine: 'underline' }}>{label}</T>
    </Pressable>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <View style={st.warn}>
      <StarIcon size={12} color="#FFD27A" />
      <T v="bodyBold" style={{ flex: 1, fontSize: 13, lineHeight: 18, color: colors.white }}>{text}</T>
    </View>
  );
}

const fmtShort = (day?: string) => (day ? new Date(`${day}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase() : '');
const fmtWeekday = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long' });

const st = StyleSheet.create({
  eyebrow: { fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', color: '#FFE3E6' },
  h1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31, color: colors.white },
  sub: { fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.85)' },
  bottom: { paddingHorizontal: 24, paddingBottom: 8, gap: 6 },
  reason: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.08)' },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.25)', marginBottom: 6 },
  ownCard: { marginHorizontal: 24, marginTop: -14, padding: 18, gap: 8, borderRadius: 22, backgroundColor: colors.white },
  premiumPill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: 999, backgroundColor: '#FFF6E0' },
  sheet: { flex: 1, marginTop: -8, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#C9BDBF', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.red },
  strikeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#FFF3E0' },
});
