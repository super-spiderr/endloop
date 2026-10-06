import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import { MARK_LOOP, MARK_VIEWBOX, WORDMARK_LETTERS, WORDMARK_LOOP, WORDMARK_VIEWBOX } from './logo-data';

const [, , vbW, vbH] = WORDMARK_VIEWBOX.split(' ').map(Number);

type WordmarkProps = {
  width?: number;
  /** ink: dark letters + red loop. white: all white (on red). dark: light letters + red loop (dark mode). */
  variant?: 'ink' | 'white' | 'dark';
};

/** The locked "endloop" wordmark: Satoshi Bold outlines with the broken, tilted loop as the "oo". */
export function Wordmark({ width = 100, variant = 'ink' }: WordmarkProps) {
  const letters = variant === 'white' ? colors.white : variant === 'dark' ? '#F6EDEE' : colors.ink;
  const loop = variant === 'white' ? colors.white : colors.red;
  return (
    <Svg width={width} height={(width * vbH) / vbW} viewBox={WORDMARK_VIEWBOX} accessibilityRole="image" accessibilityLabel="endloop">
      {WORDMARK_LETTERS.map((d, i) => (
        <Path key={i} d={d} fill={letters} />
      ))}
      <Path d={WORDMARK_LOOP.d} fill="none" stroke={loop} strokeWidth={WORDMARK_LOOP.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The broken-loop symbol on its own (app icon, notification icon, small badges). */
export function LoopMark({ size = 24, color = colors.red, strokeWidth }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox={MARK_VIEWBOX}>
      <Path d={MARK_LOOP.d} fill="none" stroke={color} strokeWidth={strokeWidth ?? MARK_LOOP.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
