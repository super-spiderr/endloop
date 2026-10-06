import Svg, { Circle, Path, Rect } from 'react-native-svg';

type P = { size?: number; color?: string; strokeWidth?: number };

const stroke = (color: string, strokeWidth: number) =>
  ({ fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' }) as const;

export const LockIcon = ({ size = 14, color = '#FFFFFF', strokeWidth = 2.2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={4} y={11} width={16} height={10} rx={2.5} {...stroke(color, strokeWidth)} />
    <Path d="M8 11V7a4 4 0 0 1 8 0v4" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const CheckIcon = ({ size = 14, color = '#FFFFFF', strokeWidth = 3.2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const SearchIcon = ({ size = 18, color = '#5F5F5F', strokeWidth = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={11} cy={11} r={7} {...stroke(color, strokeWidth)} />
    <Path d="M20 20l-3.5-3.5" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const InfoIcon = ({ size = 22, color = '#E5132B', strokeWidth = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={9} {...stroke(color, strokeWidth)} />
    <Path d="M12 8v5M12 16.5h.01" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const WarnIcon = ({ size = 20, color = '#B86E00', strokeWidth = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 4l9 16H3z" {...stroke(color, strokeWidth)} />
    <Path d="M12 10v4M12 17.5h.01" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const CloseIcon = ({ size = 16, color = '#5F5F5F', strokeWidth = 2.4 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 6l12 12M18 6L6 18" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const BellIcon = ({ size = 22, color = '#E5132B', strokeWidth = 1.9 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" {...stroke(color, strokeWidth)} />
    <Path d="M10 20.5a2 2 0 0 0 4 0" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const LayersIcon = ({ size = 22, color = '#E5132B', strokeWidth = 1.9 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={4} y={7} width={12} height={13} rx={2} {...stroke(color, strokeWidth)} />
    <Path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h9A1.5 1.5 0 0 1 20 5.5V15a1.5 1.5 0 0 1-1.5 1.5H16" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const BatteryIcon = ({ size = 22, color = '#E5132B', strokeWidth = 1.9 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={3} y={7} width={16} height={10} rx={2.5} {...stroke(color, strokeWidth)} />
    <Path d="M21 10.5v3M7 10.5v3M10.5 10.5v3" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const FlameIcon = ({ size = 14, color = '#E5132B' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2c1 3.5 5 5.5 5 11a5 5 0 0 1-10 0c0-2.6 1.3-4.4 2.6-5.6.3 1.9 1.2 3 2.2 3.4C11.5 8 11.2 5 12 2z" fill={color} />
  </Svg>
);

export const ChilliIcon = ({ size = 13, color = '#E5132B' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M15.5 6.5c2.8.6 4.4 3.3 3.3 6.6-1.5 4.6-6.7 8.3-12.6 8.4-1 0-1.3-1.2-.4-1.6 4-1.8 6.3-5 6.9-9.2.4-2.6 1.3-4.6 2.8-4.2z" fill={color} />
    <Path d="M15.2 6.6c.1-1.6.9-3 2.3-3.9" {...stroke(color, 2)} />
  </Svg>
);

export const HomeIcon = ({ size = 24, color = '#5F5F5F', strokeWidth = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const StatsIcon = ({ size = 24, color = '#5F5F5F', strokeWidth = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M5 20V11M12 20V5M19 20v-7" {...stroke(color, strokeWidth)} />
  </Svg>
);

export const GearIcon = ({ size = 24, color = '#5F5F5F', strokeWidth = 2 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={3} {...stroke(color, strokeWidth)} />
    <Path
      d="M19 13.5v-3l-2.1-.6a5.5 5.5 0 0 0-.6-1.4l1-1.9-2.1-2.1-1.9 1a5.5 5.5 0 0 0-1.4-.6L11.4 3h-3l-.6 2.1a5.5 5.5 0 0 0-1.4.6l-1.9-1L2.4 6.8l1 1.9a5.5 5.5 0 0 0-.6 1.4L.7 10.5v3l2.1.6c.1.5.3 1 .6 1.4l-1 1.9 2.1 2.1 1.9-1c.4.3.9.5 1.4.6l.6 2.1h3l.6-2.1c.5-.1 1-.3 1.4-.6l1.9 1 2.1-2.1-1-1.9c.3-.4.5-.9.6-1.4z"
      transform="translate(1.9 0)"
      {...stroke(color, strokeWidth)}
    />
  </Svg>
);
