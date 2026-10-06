import * as Device from 'expo-device';
import { EndloopCore } from 'endloop-core';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

/**
 * Android permission helpers. With the native core built in, opening pages jumps straight to
 * Endloop's row where the phone allows it, and checks are real. Without it (Expo Go / web),
 * pages open generically and checks return null ("unknown").
 */
async function openAction(action: string) {
  if (Platform.OS !== 'android') return;
  try {
    await Linking.sendIntent(action);
  } catch {
    await Linking.openSettings();
  }
}

export const openUsageAccessSettings = () =>
  EndloopCore ? EndloopCore.openUsageAccessSettings() : openAction('android.settings.USAGE_ACCESS_SETTINGS');
export const openOverlaySettings = () =>
  EndloopCore ? EndloopCore.openOverlaySettings() : openAction('android.settings.action.MANAGE_OVERLAY_PERMISSION');
export const openBatterySettings = () =>
  EndloopCore ? EndloopCore.openBatterySettings() : openAction('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');

/** Current state of each permission; null when it can't be checked in this build. */
export function checkPermissions(): { usage: boolean | null; overlay: boolean | null; battery: boolean | null; notifications: boolean | null } {
  if (!EndloopCore) return { usage: null, overlay: null, battery: null, notifications: null };
  return {
    usage: EndloopCore.hasUsageAccess(),
    overlay: EndloopCore.canDrawOverlays(),
    battery: EndloopCore.isIgnoringBatteryOptimizations(),
    notifications: EndloopCore.areNotificationsEnabled(),
  };
}

export async function requestNotifications(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Number(Platform.Version) < 33) return true; // granted by default before Android 13
  const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

/** Extra steps for phone brands that kill background apps (see dontkillmyapp.com). */
export function batterySteps(): { brand: string; steps: string[] } | null {
  const m = (Device.manufacturer ?? '').toLowerCase();
  if (/xiaomi|redmi|poco/.test(m))
    return { brand: 'Xiaomi', steps: ['Battery saver → No restrictions', 'Autostart → switch Endloop on'] };
  if (/realme|oppo/.test(m))
    return { brand: m.includes('oppo') ? 'OPPO' : 'Realme', steps: ['Battery → Allow background activity', 'App auto-launch → Endloop on'] };
  if (/vivo|iqoo/.test(m)) return { brand: 'Vivo', steps: ['Battery → Background power consumption → Allow', 'Autostart → Endloop on'] };
  if (/samsung/.test(m)) return { brand: 'Samsung', steps: ['Battery → Unrestricted', 'Remove Endloop from Sleeping apps'] };
  if (/oneplus/.test(m)) return { brand: 'OnePlus', steps: ["Battery optimisation → Don't optimise", 'Allow auto-launch'] };
  return null;
}
