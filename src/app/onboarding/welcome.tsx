import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Wordmark } from '@/brand/logo';
import { loopSneakIn } from '@/characters';
import { LockIcon } from '@/components/icons';
import { Button, Character, Screen, T } from '@/components/ui';
import { useTypewriter } from '@/lib/hooks';
import { colors, fonts, gradients } from '@/theme/tokens';

const HEADLINE = 'Oh. Another one.';
const SECOND = 'Let me guess. You ‘just checked Instagram’ and lost 3 hours.';

/** Screen 1 · Welcome. Shown once. Loop sneaks in (baked clip), lines type out, one tap. */
export default function Welcome() {
  const { width, height } = useWindowDimensions();
  const img = Math.min(width, height * 0.45);
  const { shown, done } = useTypewriter([HEADLINE, SECOND], { startDelay: 1500, charMs: 40, gapMs: 350 });

  return (
    <Screen gradient={gradients.welcome}>
      <StatusBar style="light" />
      <View style={{ alignItems: 'center', paddingTop: 16 }}>
        <Wordmark width={132} variant="white" />
      </View>

      {/* The sneak-in clip already contains the empty start, the peek from the left edge, the step to centre and the sigh. */}
      <View style={{ alignItems: 'center' }}>
        <Character source={loopSneakIn} size={img} alt="Loop sneaks in and sighs" fadeTo="#E8142C" />
      </View>

      <View style={{ paddingHorizontal: 28, gap: 16, marginTop: 8 }}>
        <T style={{ fontFamily: fonts.display, fontSize: 46, lineHeight: 48, color: colors.white }} accessibilityLabel={HEADLINE}>
          {shown[0]}
        </T>
        <T style={{ fontFamily: fonts.bold, fontSize: 21, lineHeight: 28, color: colors.white }} accessibilityLabel={SECOND}>
          {shown[1]}
        </T>
      </View>

      <View style={{ flex: 1 }} />

      {done ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 14, alignItems: 'center' }}>
          <Animated.View entering={FadeInDown.duration(380)} style={{ alignSelf: 'stretch' }}>
            <Button label="…yeah, that's me" tone="white" onPress={() => router.push('/onboarding/usage-access')} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(250)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <LockIcon />
            <T style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.white }}>No sign-up. Your screen time stays on your phone.</T>
          </Animated.View>
        </View>
      ) : null}
    </Screen>
  );
}
