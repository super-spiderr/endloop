/** Endloop brand tokens (locked: Roast Red and White). Mirrors the Master Plan. */
export const colors = {
  bg: '#FFFFFF',
  surface: '#FFF4F5',
  line: '#F1D9DC',
  ink: '#141414',
  muted: '#5F5F5F',
  red: '#E5132B',
  redPressed: '#B80F22',
  blush: '#FFE3E6',
  darkBg: '#140A0B',
  white: '#FFFFFF',
  // usage states
  chill: '#16895F',
  chillTint: '#E3F3EC',
  heads: '#B86E00',
  headsTint: '#FFF3E0',
  roasted: '#E5132B',
} as const;

export const gradients = {
  /** Welcome screen: bright red top to deep red bottom. */
  welcome: ['#F0263D', '#E5132B', '#9E0B1C'] as const,
  /** Roast moments and the Savage level. */
  roasted: ['#F0263D', '#C20F24', '#7A0714'] as const,
  lateNight: ['#6B5BFF', '#1B1464'] as const,
  proud: ['#F2EBDD', '#FFB38A'] as const,
  honest: ['#FFFFFF', '#FFE3E6'] as const,
};

/** Font family names registered in the root layout (Android needs one family per weight). */
export const fonts = {
  display: 'ClashDisplay-Bold',
  regular: 'Satoshi-Regular',
  medium: 'Satoshi-Medium',
  bold: 'Satoshi-Bold',
} as const;

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export type UsageState = 'chill' | 'heads' | 'roasted';

export function usageState(used: number, limit: number): UsageState {
  const pct = limit > 0 ? used / limit : 0;
  if (pct >= 1) return 'roasted';
  if (pct >= 0.75) return 'heads';
  return 'chill';
}

export const stateStyle: Record<UsageState, { label: string; color: string; tint: string }> = {
  chill: { label: 'Chill', color: colors.chill, tint: colors.chillTint },
  heads: { label: 'Heads up', color: colors.heads, tint: colors.headsTint },
  roasted: { label: 'Roasted', color: colors.roasted, tint: colors.blush },
};
