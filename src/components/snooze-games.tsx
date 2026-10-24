/**
 * The four Free snooze games (Product Book A4, canvas Screen 23). Small views, no game engine:
 * shapes, the roaster's face and a few timers. Each one calls `onWin` once; the snooze screen
 * owns the fallback timer, so nobody is ever stuck in a game.
 */
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

import { pose, roasterName, type Roaster } from '@/characters';
import { Character, T } from '@/components/ui';
import { colors, fonts } from '@/theme/tokens';

import { GOLD, Hud, W80 } from './snooze-ui';

export type GameProps = { roaster: Roaster; hard: boolean; secondsLeft: number; onWin: () => void };

const buzz = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

/* ---------- 🎯 Catch the roaster: tap him 5 times as he pops out of your apps; he speeds up ---------- */

const TILE_COLS = ['#3A1C23', '#2B2436', '#1F3036', '#3A2A1C', '#2A1F33', '#1F2A24'];
const GLYPHS = ['M12 6a6 6 0 1 0 0.01 0z', 'M6 6h12v12H6z', 'M12 5l7 13H5z', 'M5 12h14M12 5v14', 'M6 8h12M6 12h12M6 16h8'];

export function CatchGame({ roaster, hard, secondsLeft, onWin }: GameProps) {
  const goal = hard ? 7 : 5;
  const [caught, setCaught] = useState(0);
  const [at, setAt] = useState(-1);
  const [miss, setMiss] = useState(-1);
  const won = useRef(false);

  // He pops up somewhere new, a little faster after every catch.
  useEffect(() => {
    if (won.current) return;
    const stay = Math.max(hard ? 420 : 520, (hard ? 950 : 1150) - caught * 120);
    const t = setTimeout(() => setAt((p) => (p + 3 + Math.floor(Math.random() * 12)) % 16), at < 0 ? 500 : stay);
    return () => clearTimeout(t);
  }, [at, caught, hard]);

  const tap = (i: number) => {
    if (won.current) return;
    if (i === at) {
      buzz();
      const n = caught + 1;
      setCaught(n);
      setAt(-1);
      if (n >= goal) {
        won.current = true;
        onWin();
      }
    } else {
      setMiss(i);
      setTimeout(() => setMiss((m) => (m === i ? -1 : m)), 500);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={st.hud}>
        <Hud label="CAUGHT" value={`${caught}/${goal}`} />
        <Hud label="TIME" value={`0:${String(Math.max(0, secondsLeft)).padStart(2, '0')}`} color={GOLD} align="flex-end" />
      </View>
      <View style={st.board}>
        <View style={st.grid}>
          {Array.from({ length: 16 }, (_, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={i === at ? `${roasterName[roaster]}, tap him` : 'Empty app'}
              onPress={() => tap(i)}
              style={[st.tile, { backgroundColor: TILE_COLS[(i * 5) % 6] }]}>
              {i === at ? (
                <Animated.View entering={ZoomIn.springify().damping(10)} style={st.popper}>
                  <Character source={pose(roaster, 'running')} size={76} alt="" />
                </Animated.View>
              ) : i === miss ? (
                <T style={{ fontFamily: fonts.display, fontSize: 13, color: '#FF8A96' }}>MISS</T>
              ) : (
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Path d={GLYPHS[(i * 7) % GLYPHS.length]} stroke="rgba(255,255,255,0.35)" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ---------- 🚦 Quick draw: tap the moment it says NOW, 3 times; an early tap resets that try ---------- */

type DrawState = 'wait' | 'now' | 'early' | 'done';

export function QuickDrawGame({ roaster, hard, onWin }: GameProps) {
  const tries = 3;
  const [times, setTimes] = useState<number[]>([]);
  const [state, setState] = useState<DrawState>('wait');
  const shownAt = useRef(0);
  const won = useRef(false);
  const scale = useSharedValue(0.6);
  const burst = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const roasterMs = hard ? 248 : 298;

  // Arm the next try: wait a random 1.2–3.5 s, then NOW.
  useEffect(() => {
    if (state !== 'wait') return;
    const t = setTimeout(
      () => {
        shownAt.current = Date.now();
        scale.set(0.6);
        scale.set(withSpring(1, { damping: 7, stiffness: 220 }));
        setState('now');
      },
      1200 + Math.random() * 2300,
    );
    return () => clearTimeout(t);
  }, [state, scale]);

  const tap = () => {
    if (won.current) return;
    if (state === 'wait') {
      setState('early');
      setTimeout(() => setState('wait'), 900);
      return;
    }
    if (state !== 'now') return;
    const ms = Date.now() - shownAt.current;
    // Hard mode: a slow tap doesn't count.
    if (hard && ms > 450) {
      setTimes((t) => t);
      setState('early');
      setTimeout(() => setState('wait'), 900);
      return;
    }
    buzz();
    const next = [...times, ms];
    setTimes(next);
    if (next.length >= tries) {
      won.current = true;
      setState('done');
      onWin();
    } else setState('wait');
  };

  const best = times.length ? Math.min(...times) : null;
  return (
    <View style={{ gap: 14 }}>
      <View style={st.hud}>
        <Hud label="YOUR BEST" value={best ? `${best} ms` : '—'} />
        <T style={{ fontFamily: fonts.display, fontSize: 20, color: W80, alignSelf: 'center' }}>VS</T>
        <Hud label={roasterName[roaster].toUpperCase()} value={`${roasterMs} ms`} align="flex-end" />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={state === 'now' ? 'Tap now' : 'Wait for it'} onPress={tap} style={st.drawPad}>
        {state === 'now' || state === 'done' ? (
          <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, burst]}>
            <Svg width={250} height={250} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
              <Polygon points={starPoints(130, 130, 124, 92, 18)} fill={colors.white} />
            </Svg>
            <View style={{ width: 250, height: 250, alignItems: 'center', justifyContent: 'center' }}>
              <T style={{ fontFamily: fonts.display, fontSize: 64, color: colors.red, transform: [{ rotate: '-8deg' }] }}>NOW!</T>
            </View>
          </Animated.View>
        ) : (
          <View style={{ alignItems: 'center', gap: 8 }}>
            <T style={{ fontFamily: fonts.display, fontSize: 40, color: state === 'early' ? '#FF8A96' : 'rgba(255,255,255,0.55)' }}>{state === 'early' ? (hard ? 'Too slow / early' : 'Too early') : 'Wait…'}</T>
            <T v="bodyBold" style={{ fontSize: 13, color: W80 }}>Tap the second it says NOW</T>
          </View>
        )}
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 22 }}>
        {Array.from({ length: tries }, (_, i) => (
          <View key={i} style={[st.try, i === times.length && state !== 'done' && { borderColor: colors.white }]}>
            <T v="bodyBold" style={{ fontSize: 12, color: W80 }}>Try {i + 1}</T>
            <T style={{ fontFamily: fonts.display, fontSize: 16, color: times[i] ? (times[i] <= roasterMs ? '#6FE0B0' : '#FF8A96') : colors.white }}>{times[i] ? `${times[i]} ms` : i === times.length ? 'now' : '—'}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

function starPoints(cx: number, cy: number, r1: number, r2: number, n: number) {
  return Array.from({ length: n * 2 }, (_, k) => {
    const r = k % 2 === 0 ? r1 : r2;
    const a = (Math.PI * k) / n;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

/* ---------- 👋 Swipe left: swipe the roaster's "profile" away 6 times; the heart does nothing ---------- */

const BIOS = ['0 km away · lives in your phone', 'Likes: your screen time', 'Long talks at 1 am', 'Hobbies: closing your apps', 'Looking for: someone who sleeps on time'];

export function SwipeGame({ roaster, hard, onWin }: GameProps) {
  const goal = hard ? 9 : 6;
  const [count, setCount] = useState(0);
  const [heart, setHeart] = useState(false);
  const x = useSharedValue(0);

  const nope = () => {
    if (count >= goal) return;
    buzz();
    const n = count + 1;
    setCount(n);
    x.set(0);
    if (n >= goal) onWin();
  };
  const flyAway = () => {
    x.set(
      withTiming(-520, { duration: 180 }, (done) => {
        if (done) runOnJS(nope)();
      }),
    );
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate((e) => {
      x.set(Math.min(40, e.translationX));
    })
    .onEnd((e) => {
      if (e.translationX < -90 || e.velocityX < -800) {
        x.set(
          withTiming(-520, { duration: 160 }, (done) => {
            if (done) runOnJS(nope)();
          }),
        );
      } else x.set(withSpring(0));
    });

  const card = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { rotate: `${x.get() / 22}deg` }] }));
  const stamp = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, -x.get() / 80)) }));

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 24 }}>
        {Array.from({ length: goal }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < count ? colors.white : 'rgba(255,255,255,0.25)' }} />
        ))}
        <T v="bodyBold" style={{ marginLeft: 8, fontSize: 13, color: colors.white }}>{count} / {goal} nope&apos;d</T>
      </View>
      <View style={{ height: 340, marginHorizontal: 24 }}>
        <View style={[st.card, { transform: [{ rotate: '3deg' }], opacity: 0.5 }]} />
        <GestureDetector gesture={pan}>
          <Animated.View key={count} entering={FadeIn.duration(160)} style={[st.card, card]}>
            <Character source={pose(roaster, count % 2 ? 'smug' : 'peer')} size={{ width: 300, height: 260 }} alt={`${roasterName[roaster]}'s profile`} />
            <LinearGradient colors={['transparent', 'rgba(20,2,10,0.92)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 }} />
            <Animated.View style={[st.nope, stamp]}>
              <T style={{ fontFamily: fonts.display, fontSize: 30, color: colors.red, letterSpacing: 2 }}>NOPE</T>
            </Animated.View>
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14, gap: 4 }}>
              <T style={{ fontFamily: fonts.display, fontSize: 26, color: colors.white }}>{roasterName[roaster]}, 24</T>
              <T v="bodyBold" style={{ fontSize: 13, color: W80 }}>{BIOS[count % BIOS.length]}</T>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 22 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Nope, swipe left" onPress={flyAway} style={[st.round, { width: 64, height: 64, backgroundColor: colors.white }]}>
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path d="M6 6l12 12M18 6L6 18" stroke={colors.red} strokeWidth={3} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Like" onPress={() => setHeart(true)} style={[st.round, { width: 52, height: 52, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', alignSelf: 'center' }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" stroke={colors.white} strokeWidth={2} fill={heart ? colors.white : 'none'} />
          </Svg>
        </Pressable>
      </View>
      {heart ? <T v="bodyBold" style={{ textAlign: 'center', fontSize: 13, color: W80 }}>The heart doesn&apos;t work. Nice try.</T> : null}
    </View>
  );
}

/* ---------- ✊ Stone paper scissors: win 2 in a row; the roaster openly cheats now and then ---------- */

type Throw = 'stone' | 'paper' | 'scissors';
const THROWS: Throw[] = ['stone', 'paper', 'scissors'];
const BEATS: Record<Throw, Throw> = { stone: 'scissors', paper: 'stone', scissors: 'paper' };
const LOSES_TO: Record<Throw, Throw> = { stone: 'paper', paper: 'scissors', scissors: 'stone' };
const LABEL: Record<Throw, string> = { stone: 'Stone', paper: 'Paper', scissors: 'Scissors' };

export function RpsGame({ roaster, hard, onWin }: GameProps) {
  const goal = hard ? 3 : 2;
  const [streak, setStreak] = useState(0);
  const [mine, setMine] = useState<Throw | null>(null);
  const [theirs, setTheirs] = useState<Throw | null>(null);
  const [cheated, setCheated] = useState(false);
  const [busy, setBusy] = useState(false);
  const won = useRef(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateY: shake.get() }] }));

  const play = (t: Throw) => {
    if (busy || won.current) return;
    setBusy(true);
    setMine(t);
    setTheirs(null);
    setCheated(false);
    shake.set(withSequence(withTiming(-10, { duration: 110 }), withTiming(0, { duration: 110 }), withTiming(-10, { duration: 110 }), withTiming(0, { duration: 110 })));
    setTimeout(() => {
      // About one round in five (one in three on hard), the roaster changes their throw after seeing yours.
      const cheat = Math.random() < (hard ? 0.33 : 0.2);
      const r = cheat ? LOSES_TO[t] : THROWS[Math.floor(Math.random() * 3)];
      setTheirs(r);
      setCheated(cheat);
      const win = BEATS[t] === r;
      const tie = t === r;
      const n = win ? streak + 1 : tie ? streak : 0;
      setStreak(n);
      if (win) buzz();
      else if (!tie) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (n >= goal) {
        won.current = true;
        setTimeout(onWin, 700);
      }
      setBusy(false);
    }, 520);
  };

  const result = mine && theirs ? (BEATS[mine] === theirs ? 'You win this one' : mine === theirs ? 'Tie. Again.' : 'Lost it. Streak back to 0.') : 'Pick fast. They’re watching.';
  return (
    <View style={{ gap: 16 }}>
      <View style={st.hud}>
        <View style={{ gap: 6 }}>
          <T style={{ fontFamily: fonts.display, fontSize: 18, color: colors.white }}>YOU</T>
          <Pips n={streak} of={goal} color={colors.white} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, backgroundColor: '#9E0B1C' }}>
            <T style={{ fontFamily: fonts.display, fontSize: 18, color: colors.white }}>{roasterName[roaster].toUpperCase()}</T>
          </View>
          <T v="bodyBold" style={{ fontSize: 12, color: W80 }}>Win {goal} in a row</T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, minHeight: 190 }}>
        <Animated.View style={[st.throwBig, shakeStyle]}>{mine && theirs ? <ThrowIcon t={mine} size={64} color={colors.white} /> : <T style={{ fontFamily: fonts.display, fontSize: 64, color: colors.white }}>?</T>}</Animated.View>
        <T style={{ fontFamily: fonts.display, fontSize: 54, color: GOLD }}>VS</T>
        {theirs ? (
          <Animated.View entering={ZoomIn} style={[st.throwBig, { backgroundColor: 'rgba(229,19,43,0.35)', borderColor: colors.red }]}>
            <ThrowIcon t={theirs} size={64} color={colors.white} />
          </Animated.View>
        ) : (
          <Character source={pose(roaster, 'gameFace')} size={150} alt={`${roasterName[roaster]}, fists up, game face on`} />
        )}
      </View>
      <View style={{ alignItems: 'center', gap: 4, minHeight: 40 }}>
        <T v="bodyBold" style={{ fontSize: 15, color: colors.white }}>{result}</T>
        {cheated ? <T v="bodyBold" style={{ fontSize: 13, color: GOLD }}>Changed mine after seeing yours. Cheating? Prove it.</T> : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20 }}>
        {THROWS.map((t) => (
          <Pressable key={t} accessibilityRole="button" accessibilityLabel={LABEL[t]} disabled={busy} onPress={() => play(t)} style={[st.throwBtn, mine === t && { borderColor: GOLD, borderWidth: 3 }]}>
            <ThrowIcon t={t} size={30} color={colors.red} />
            <T style={{ fontFamily: fonts.display, fontSize: 15, color: colors.ink }}>{LABEL[t]}</T>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Pips({ n, of, color }: { n: number; of: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: of }, (_, i) => (
        <View key={i} style={{ width: 22, height: 8, borderRadius: 4, backgroundColor: i < n ? color : 'rgba(255,255,255,0.22)', transform: [{ skewX: '-20deg' }] }} />
      ))}
    </View>
  );
}

function ThrowIcon({ t, size, color }: { t: Throw; size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {t === 'stone' ? <Path d="M5 13l3-6 6-2 5 4 1 6-4 4H8z" stroke={color} strokeWidth={2.2} fill="none" strokeLinejoin="round" /> : null}
      {t === 'paper' ? (
        <>
          <Path d="M6 3h9l4 4v14H6z" stroke={color} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
          <Path d="M15 3v4h4M9 12h6M9 16h6" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </>
      ) : null}
      {t === 'scissors' ? (
        <>
          <Circle cx={6} cy={6} r={3} stroke={color} strokeWidth={2.2} fill="none" />
          <Circle cx={6} cy={18} r={3} stroke={color} strokeWidth={2.2} fill="none" />
          <Path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </>
      ) : null}
    </Svg>
  );
}

const st = StyleSheet.create({
  hud: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 26, paddingTop: 6 },
  board: { marginHorizontal: 22, padding: 16, paddingTop: 22, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tile: { width: '22%', aspectRatio: 1, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  popper: { position: 'absolute', width: 76, height: 76, top: -18, alignItems: 'center', justifyContent: 'center' },
  drawPad: { height: 290, marginHorizontal: 22, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  try: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(0,0,0,0.25)' },
  card: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 28, overflow: 'hidden', backgroundColor: '#FFD6DB', alignItems: 'center', justifyContent: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  nope: { position: 'absolute', top: 26, right: 18, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 3, borderColor: colors.red, borderRadius: 10, transform: [{ rotate: '12deg' }], backgroundColor: 'rgba(255,255,255,0.85)' },
  round: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  throwBig: { width: 110, height: 110, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  throwBtn: { flex: 1, height: 104, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 3, borderColor: 'transparent' },
});

