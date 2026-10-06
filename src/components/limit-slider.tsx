import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { limitToPos, posToLimit } from '@/lib/time';
import { colors } from '@/theme/tokens';

type Props = {
  value: number;
  /** Daily average for the tick mark; null hides it (no real usage yet). */
  average: number | null;
  onChange: (min: number) => void;
  accent?: string;
  label: string;
};

/**
 * Daily-limit slider: 5-minute steps to an hour, then 15-minute steps to 4 hours.
 * A faint tick marks the user's current daily average. Horizontal drags only, so the
 * screen can still scroll vertically over it.
 */
const THUMB = 26;
const PAD = THUMB / 2; // keep the thumb inside the card at both ends

export function LimitSlider({ value, average, onChange, accent = colors.red, label }: Props) {
  const [width, setWidth] = useState(0);

  const track = Math.max(0, width - PAD * 2);

  const update = (x: number) => {
    if (!track) return;
    const next = posToLimit((x - PAD) / track);
    if (next !== value) {
      Haptics.selectionAsync();
      onChange(next);
    }
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onStart((e) => update(e.x))
    .onUpdate((e) => update(e.x));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => update(e.x));

  const p = PAD + limitToPos(value) * track;
  const a = average == null ? null : PAD + limitToPos(average) * track;
  const step = (dir: 1 | -1) => onChange(posToLimit(limitToPos(value) + dir * 0.03));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${value} minutes` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 32, justifyContent: 'center' }}>
        <View pointerEvents="none" style={{ marginHorizontal: PAD, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: PAD, width: p - PAD, height: 4, borderRadius: 2, backgroundColor: accent }} />
        {a != null ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: a - 1, width: 2, height: 18, borderRadius: 1, backgroundColor: colors.muted, opacity: 0.5 }} />
        ) : null}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: p - PAD, width: THUMB, height: THUMB, borderRadius: PAD, backgroundColor: colors.white, borderWidth: 3, borderColor: accent, elevation: 3 }}
        />
      </View>
    </GestureDetector>
  );
}
