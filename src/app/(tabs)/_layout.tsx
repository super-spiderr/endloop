import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GearIcon, HomeIcon, StatsIcon } from '@/components/icons';
import { T } from '@/components/ui';
import { colors } from '@/theme/tokens';

const ICONS = { today: HomeIcon, stats: StatsIcon, settings: GearIcon } as const;
const LABELS = { today: 'Today', stats: 'Stats', settings: 'Settings' } as const;

const BAR_H = 68;
const PAD = 6; // space between the bar edge and the red pill
const SPRING = { damping: 18, stiffness: 220, mass: 0.7 };

/** Floating black bar; a red pill slides to the active tab. Icon on top, label underneath. */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={({ state, navigation }) => <Bar state={state} navigation={navigation} bottom={insets.bottom + 16} />}>
      <Tabs.Screen name="today" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

type BarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
  bottom: number;
};

function Bar({ state, navigation, bottom }: BarProps) {
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const slot = width > 0 ? (width - PAD * 2) / count : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    if (slot <= 0) return;
    const to = PAD + state.index * slot;
    // first layout: jump into place; after that, slide
    x.value = x.value === 0 ? to : withSpring(to, SPRING);
  }, [state.index, slot, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: slot }));

  return (
    <View style={[st.wrap, { paddingBottom: bottom }]}>
      <View style={st.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist">
        {slot > 0 ? <Animated.View pointerEvents="none" style={[st.pill, pill]} /> : null}
        {state.routes.map((route, i) => (
          <Tab
            key={route.key}
            name={route.name as keyof typeof ICONS}
            on={state.index === i}
            onPress={() => {
              if (state.index === i) return;
              Haptics.selectionAsync();
              navigation.navigate(route.name);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function Tab({ name, on, onPress }: { name: keyof typeof ICONS; on: boolean; onPress: () => void }) {
  const Icon = ICONS[name];
  const label = LABELS[name] ?? name;
  const col = on ? colors.white : 'rgba(255,255,255,0.55)';
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [st.tab, pressed && !on && { transform: [{ scale: 0.92 }] }]}>
      {Icon ? <Icon size={22} color={col} strokeWidth={on ? 2.4 : 2} /> : null}
      {/* Full tab width, centred, never animated: a label laid out narrow gets cut to "Tod…" on Android. */}
      <T v="bodyBold" numberOfLines={1} style={{ alignSelf: 'stretch', textAlign: 'center', fontSize: 12, lineHeight: 16, color: col }}>
        {label}
      </T>
    </Pressable>
  );
}

const st = StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 8 },
  bar: {
    height: BAR_H,
    borderRadius: BAR_H / 2,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  pill: { position: 'absolute', left: 0, top: PAD, bottom: PAD, borderRadius: (BAR_H - PAD * 2) / 2, backgroundColor: colors.red },
  tab: { flex: 1, height: BAR_H - PAD * 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
