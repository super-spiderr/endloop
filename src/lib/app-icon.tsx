import { EndloopCore } from 'endloop-core';
import { Image, View, type ImageSourcePropType } from 'react-native';

import { colors } from '@/theme/tokens';

/** Screen 17: the home-screen icon. */
export type AppIconName = 'default' | 'loop' | 'lupe';

const ART: Record<AppIconName, ImageSourcePropType> = {
  default: require('../../assets/images/app-icon-default.png'),
  loop: require('../../assets/images/app-icon-loop.png'),
  lupe: require('../../assets/images/app-icon-lupe.png'),
};

export const APP_ICON_LABEL: Record<AppIconName, string> = { default: 'Red', loop: 'Loop', lupe: 'Lupe' };

/** False in Expo Go / web, or until the app is rebuilt with `prebuild --clean`. */
export function appIconSupported(): boolean {
  try {
    return !!EndloopCore?.appIconSupported?.();
  } catch {
    return false;
  }
}

export function getAppIcon(): AppIconName {
  const v = EndloopCore?.appIcon?.();
  return v === 'loop' || v === 'lupe' ? v : 'default';
}

/** Applied natively when Endloop goes to the background. */
export function setAppIcon(name: AppIconName) {
  EndloopCore?.setAppIcon?.(name);
}

/** The icon as it looks on a home screen (rounded square). */
export function AppIconImage({ name, size, ring = false }: { name: AppIconName; size: number; ring?: boolean }) {
  const r = Math.round(size * 0.3);
  const img = (
    <Image
      source={ART[name]}
      accessibilityLabel={name === 'default' ? 'Endloop icon, red with the loop mark' : `Endloop icon with ${APP_ICON_LABEL[name]}'s face`}
      style={{ width: size, height: size, borderRadius: r }}
    />
  );
  if (!ring) return img;
  return <View style={{ padding: 3, borderRadius: r + 5, borderWidth: 2, borderColor: colors.red }}>{img}</View>;
}
