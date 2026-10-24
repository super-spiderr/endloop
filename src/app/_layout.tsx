import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash } from '@/components/animated-splash';
import { startWatcherSync, syncWatcher } from '@/lib/watcher';
import { checkRoastUpdates } from '@/roasts/remote';
import { useSettings } from '@/store/settings';
import { fonts } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fonts.display]: require('../../assets/fonts/ClashDisplay-Bold.otf'),
    [fonts.regular]: require('../../assets/fonts/Satoshi-Regular.otf'),
    [fonts.medium]: require('../../assets/fonts/Satoshi-Medium.otf'),
    [fonts.bold]: require('../../assets/fonts/Satoshi-Bold.otf'),
  });

  // The native splash stays up until fonts are ready and the animated splash has drawn its first frame
  // (same red, same loop), then hands over without a flash.
  const [splash, setSplash] = useState(true);
  const ready = loaded || !!error;
  const onSplashShown = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  const onSplashDone = useCallback(() => {
    setSplash(false);
    // The window is red during launch (app.json backgroundColor) so there's never a white flash; back to white for the app.
    SystemUI.setBackgroundColorAsync('#FFFFFF').catch(() => {});
  }, []);

  // Keep the native watcher (limits + roast lines) in sync with settings.
  useEffect(() => startWatcherSync(), []);

  // Fresh roast lines from the cloud (at most every 6 h, in the background), and on every return to
  // the app re-send the watcher its lines so dated festival lines start and stop on the right day.
  useEffect(() => {
    const refresh = () => {
      syncWatcher().catch(() => {});
      checkRoastUpdates()
        .then((r) => (r === 'updated' ? syncWatcher() : undefined))
        .catch(() => {});
    };
    const t = setTimeout(refresh, 4000); // after the splash, never on the start-up path
    const sub = AppState.addEventListener('change', (st) => st === 'active' && refresh());
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, []);

  // Anti-cheat: raised limits and removals scheduled for "tomorrow" take effect once their day comes.
  useEffect(() => useSettings.getState().applyScheduled(), []);

  // Always render the navigator (returning null here races Expo Router's start-up);
  // the native splash stays up until fonts are ready, so nothing flashes in a fallback font.
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: splash ? '#E5132B' : '#FFFFFF' }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="app/[pkg]" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="leave-letter" options={{ presentation: 'fullScreenModal', animation: 'fade_from_bottom' }} />
          <Stack.Screen name="snooze" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="keep-apps" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="weekly" options={{ animation: 'fade_from_bottom', presentation: 'fullScreenModal' }} />
        </Stack>
        {ready && splash ? <AnimatedSplash onShown={onSplashShown} onDone={onSplashDone} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
