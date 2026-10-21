import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Wordmark } from '@/brand/logo';
import { loopSneakIn } from '@/characters';
import { LockIcon } from '@/components/icons';
import { btn, RedStatusBar, SpotlightScreen } from '@/components/onboarding-ui';
import { Button, Character, T } from '@/components/ui';
import { useTypewriter } from '@/lib/hooks';
import { colors, fonts } from '@/theme/tokens';

const HEADLINE = 'Here we go again.';
const SECOND = 'Another patient. Let me guess: ‘just five minutes’ turned into three hours?';

/** Everyday phone excuses (never about one app), scrolling behind Loop. */
const EXCUSES = [
  'JUST 5 MORE MINUTES · ONE LAST CHECK · ',
  "I'LL SLEEP AFTER THIS · PHONE DOWN IN A SEC · ",
  'ONLY CHECKING THE TIME · BACK IN A SEC · ',
  "I'M NOT EVEN ON MY PHONE · LAST SCROLL, PROMISE · ",
];

/** Screen 1 · Welcome. Shown once. Loop sneaks in (baked clip), lines type out, one tap. */
export default function Welcome() {
  const { width, height } = useWindowDimensions();
  const img = Math.min(width, height * 0.47);
  const { shown, done } = useTypewriter([HEADLINE, SECOND], { startDelay: 1500, charMs: 40, gapMs: 350 });

  return (
    <SpotlightScreen loopY={0.22}>
      <RedStatusBar />
      {/* Kept above the chest fade: the fade is painted in the background colour and would cut the rows. */}
      <Marquee top={img * 0.12} />
      <View style={{ alignItems: 'center', paddingTop: 16 }}>
        <Wordmark width={132} variant="white" />
      </View>

      {/* The sneak-in clip already contains the empty start, the peek from the left edge, the step to centre and the sigh. */}
      <View style={{ alignItems: 'center' }}>
        <Character source={loopSneakIn} size={img} alt="Loop sneaks in and sighs" fadeTo="#650819" />
      </View>

      <View style={{ paddingHorizontal: 28, gap: 14, marginTop: 4 }}>
        <T style={{ fontFamily: fonts.display, fontSize: 46, lineHeight: 48, color: colors.white }} accessibilityLabel={HEADLINE}>
          {shown[0]}
        </T>
        <T style={{ fontFamily: fonts.bold, fontSize: 19, lineHeight: 27, color: 'rgba(255,255,255,0.88)' }} accessibilityLabel={SECOND}>
          {shown[1]}
        </T>
      </View>

      <View style={{ flex: 1 }} />

      {done ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 14, alignItems: 'center' }}>
          <Animated.View entering={FadeInDown.duration(380)} style={{ alignSelf: 'stretch' }}>
            <Button label="Okay doc. Roast me." tone="white" style={btn} onPress={() => router.push('/onboarding/roaster')} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(250)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <LockIcon />
            <T style={{ fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>No sign-up. Your screen time stays on your phone.</T>
          </Animated.View>
        </View>
      ) : null}
    </SpotlightScreen>
  );
}

/** Four faint rows of excuses, tilted, sliding in alternating directions. Holds still with Reduce motion on. */
function Marquee({ top }: { top: number }) {
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[st.marquee, { top }]}>
      {EXCUSES.map((text, i) => (
        <MarqueeRow key={text} text={text} reverse={i % 2 === 1} seconds={26 + i * 6} />
      ))}
    </View>
  );
}

function MarqueeRow({ text, reverse, seconds }: { text: string; reverse: boolean; seconds: number }) {
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!w) return;
    x.value = reverse ? -w : 0;
    if (!reduced) x.value = withRepeat(withTiming(reverse ? 0 : -w, { duration: seconds * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [w, reverse, seconds, reduced, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const line = text.repeat(3);
  return (
    <Animated.View style={[st.row, style]}>
      <T numberOfLines={1} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={st.rowText}>
        {line}
      </T>
      <T numberOfLines={1} style={st.rowText}>
        {line}
      </T>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  marquee: { position: 'absolute', left: -40, right: -40, gap: 14, transform: [{ rotate: '-8deg' }] },
  row: { flexDirection: 'row', width: 8000 },
  rowText: { flexShrink: 0, fontFamily: fonts.display, fontSize: 46, lineHeight: 54, letterSpacing: 1, color: 'rgba(255,255,255,0.18)' },
});
