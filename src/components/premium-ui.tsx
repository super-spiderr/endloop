/** Premium look shared by Today and Attendance (canvas TD2-P1, AT2-P): black with red light from the top. */
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { LoopMark } from '@/brand/logo';
import { useSettings } from '@/store/settings';
import { colors } from '@/theme/tokens';

/** Bottom colour of the Premium background (the tab bar strip in (tabs)/_layout.tsx matches it). */
export const PREMIUM_BOTTOM = '#060203';
export const GLASS = 'rgba(255,255,255,0.1)';
export const CORAL = '#FF8C99';

/** True when the black-and-red look is on (Premium, and they didn't pick Classic in Settings). */
export const usePremiumLook = () => useSettings((s) => s.premium && s.homeLook !== 'classic');

/** Premium Today background: black, red light from the top fading down, one big faint loop. */
export function PremiumBackdrop() {
  const { width, height } = useWindowDimensions();
  const loop = width * 2.33;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#4A0610', '#1A0306', '#0B0405', PREMIUM_BOTTOM]} locations={[0, 0.35, 0.7, 1]} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="pTop" cx="50%" cy="0%" rx="70%" ry="35%">
            <Stop offset="0" stopColor="#E5132B" stopOpacity={0.6} />
            <Stop offset="1" stopColor="#E5132B" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#pTop)" />
      </Svg>
      <View style={{ position: 'absolute', left: (width - loop) / 2, top: height * 0.62 - loop / 2, opacity: 0.05, transform: [{ rotate: '-14deg' }] }}>
        <LoopMark size={loop} color={colors.white} strokeWidth={30} />
      </View>
    </View>
  );
}

