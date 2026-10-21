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
/** The phone maker's own autostart / background page (only meaningful when batterySteps() isn't null). */
export const openBrandBackgroundSettings = async (): Promise<boolean> =>
  EndloopCore?.openBrandBackgroundSettings ? EndloopCore.openBrandBackgroundSettings() : false;

/**
 * Android 13+ greys out Usage access and Display over other apps for apps installed outside the
 * Play Store until the user allows "restricted settings" in App info. False when we can't tell.
 */
export const restrictedSettingsLikely = (): boolean => EndloopCore?.isRestrictedSettingsLikely?.() ?? false;

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

/**
 * Phone brands known for killing background apps (see dontkillmyapp.com): the battery step is only
 * asked during onboarding on these. Everywhere else it's asked just-in-time, when the watcher was killed.
 * `steps[0]` is the App info page we open; `steps[1]` is the brand's own page (second button).
 */
export function batterySteps(): { brand: string; steps: string[]; brandPage: string } | null {
  const m = (Device.manufacturer ?? '').toLowerCase();
  const appInfo = Number(Platform.Version) >= 31 ? 'App battery usage → Unrestricted' : "Battery → Don't optimise";
  if (/xiaomi|redmi|poco/.test(m))
    return { brand: 'Xiaomi', steps: ['Battery saver → No restrictions', 'Autostart → switch Endloop on'], brandPage: 'Open Autostart' };
  if (/realme|oppo/.test(m))
    return { brand: m.includes('oppo') ? 'OPPO' : 'Realme', steps: [appInfo, 'App auto-launch → Endloop on'], brandPage: 'Open auto-launch' };
  if (/vivo|iqoo/.test(m))
    return { brand: 'Vivo', steps: ['Battery → Background power consumption → Allow', 'Autostart → Endloop on'], brandPage: 'Open Autostart' };
  if (/samsung/.test(m)) return { brand: 'Samsung', steps: ['Battery → Unrestricted', 'Remove Endloop from Sleeping apps'], brandPage: 'Open Sleeping apps' };
  if (/oneplus/.test(m)) return { brand: 'OnePlus', steps: [appInfo, 'Allow auto-launch'], brandPage: 'Open auto-launch' };
  return null;
}

/** Ask for battery during onboarding? Only on brands that kill background apps. */
export const batteryNeededUpfront = (): boolean => batterySteps() !== null;
