import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { LoopMark, Wordmark } from '@/brand/logo';
import { colors, fonts } from '@/theme/tokens';

/** Same size and place as the native splash icon (Android 12+ draws it at 240 dp; the mark is ~half of that canvas). */
const MARK = 168;
const TAGLINE = ['Scroll', 'less.'];
const EASE = Easing.out(Easing.cubic);

/**
 * Picks up from the native splash (red, white loop) on the same frame, keeps the loop still and
 * animates the text in: wordmark rises, tagline word by word, then the whole thing fades into the app.
 */
export function AnimatedSplash({ onShown, onDone }: { onShown: () => void; onDone: () => void }) {
  const [reduce, setReduce] = useState<boolean | null>(null);
  const word = useSharedValue(0);
  const tag = useSharedValue(0);
  const out = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => setReduce(false));
  }, []);

  useEffect(() => {
    if (reduce === null) return;
    const finish = (done: boolean | undefined) => {
      'worklet';
      if (done) runOnJS(onDone)();
    };
    if (reduce) {
      word.value = 1;
      tag.value = TAGLINE.length;
      out.value = withDelay(500, withTiming(0, { duration: 200 }, finish));
      return;
    }
    word.value = withDelay(150, withTiming(1, { duration: 320, easing: EASE }));
    tag.value = withDelay(480, withTiming(TAGLINE.length, { duration: 140 * TAGLINE.length, easing: Easing.linear }));
    out.value = withDelay(1050, withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }, finish));
  }, [reduce, word, tag, out, onDone]);

  const wrap = useAnimatedStyle(() => ({ opacity: out.value }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: (1 - word.value) * 18 }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, st.bg, wrap]} onLayout={onShown} pointerEvents="none" accessible accessibilityLabel="Endloop. Scroll less.">
      <LoopMark size={MARK} color={colors.white} />
      {/* text sits under the still loop, so the loop stays exactly where the native splash put it */}
      <View style={st.text}>
        <Animated.View style={wordStyle}>
          <Wordmark width={168} variant="white" />
        </Animated.View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {TAGLINE.map((w, i) => (
            <Word key={w} index={i} progress={tag} text={w} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

function Word({ index, progress, text }: { index: number; progress: { value: number }; text: string }) {
  const style = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, progress.value - index));
    return { opacity: t, transform: [{ translateY: (1 - t) * 8 }] };
  });
  return <Animated.Text style={[st.tag, style]}>{text}</Animated.Text>;
}

const st = StyleSheet.create({
  bg: { backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', zIndex: 100, elevation: 100 },
  text: { position: 'absolute', top: '50%', marginTop: MARK / 2 + 8, alignItems: 'center', gap: 14 },
  tag: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: 'rgba(255,255,255,0.88)', paddingRight: 1 },
});
