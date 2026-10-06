import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { T } from '@/components/ui';
import { colors, fonts } from '@/theme/tokens';

/** A settings sub-screen: back arrow, big title, optional one-line intro, scrolling body. */
export function SubScreen({ title, intro, children, footer }: { title: string; intro?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Back arrow and title on one line, centred on each other. */}
      <View style={st.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))} style={st.back}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 5l-7 7 7 7" />
          </Svg>
        </Pressable>
        <T v="display" accessibilityRole="header" numberOfLines={1} style={{ flex: 1, fontSize: 26, lineHeight: 32 }}>{title}</T>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {intro ? <T style={{ color: colors.muted, paddingHorizontal: 24, paddingTop: 4 }}>{intro}</T> : null}
        {children}
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}

export function Group({ title, children, note }: { title?: string; children: ReactNode; note?: string }) {
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 18, gap: 8 }}>
      {title ? <T v="label" accessibilityRole="header">{title}</T> : null}
      <View style={st.group}>{children}</View>
      {note ? <T v="caption" style={{ paddingHorizontal: 4 }}>{note}</T> : null}
    </View>
  );
}

export function Row({ label, sub, right, onPress, first, danger, icon }: { label: string; sub?: string; right?: ReactNode; onPress?: () => void; first?: boolean; danger?: boolean; icon?: ReactNode }) {
  const body = (
    <>
      {icon}
      <View style={{ flex: 1, gap: 2 }}>
        <T v="bodyBold" style={danger ? { color: colors.red } : undefined}>{label}</T>
        {sub ? <T v="caption">{sub}</T> : null}
      </View>
      {right}
    </>
  );
  const style = [st.row, !first && st.rowBorder];
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [style, pressed && { backgroundColor: colors.surface }]}>
      {body}
    </Pressable>
  ) : (
    <View style={style}>{body}</View>
  );
}

/** Row that opens a sub-screen: label left, current value + chevron right. */
export function NavRow({ label, value, valueColor, href, onPress, first, icon }: { label: string; value?: string; valueColor?: string; href?: string; onPress?: () => void; first?: boolean; icon?: ReactNode }) {
  return (
    <Row
      first={first}
      label={label}
      icon={icon}
      right={<Value text={value} color={valueColor} />}
      onPress={onPress ?? (() => href && router.push(href))}
    />
  );
}

export function Segment<V extends string>({ options, value, onChange, locked = [] }: { options: [V, string][]; value: string; onChange: (v: V) => void; locked?: V[] }) {
  return (
    <View accessibilityRole="radiogroup" style={st.segment}>
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => onChange(v)} style={[st.segBtn, on && st.segOn]}>
            <T v="bodyBold" style={{ fontSize: 13, color: on ? colors.ink : colors.muted }}>{label}</T>
            {locked.includes(v) ? <LockIcon /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: colors.red, false: colors.line }} thumbColor={colors.white} />;
}

export function Health({ ok, fix }: { ok: boolean | null; fix: () => void }) {
  if (ok === null) return <T v="caption">Unknown</T>;
  if (ok)
    return (
      <View style={[st.pill, { backgroundColor: colors.chillTint }]}>
        <T v="bodyBold" style={{ fontSize: 13, color: colors.chill }}>On</T>
      </View>
    );
  return (
    <Pressable accessibilityRole="button" onPress={fix} style={st.fix}>
      <T v="bodyBold" style={{ fontSize: 14, color: colors.white }}>Fix it</T>
    </Pressable>
  );
}

export function Value({ text, color = colors.muted }: { text?: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '55%' }}>
      {text ? <T v="bodyBold" numberOfLines={1} style={{ fontSize: 15, color, flexShrink: 1 }}>{text}</T> : null}
      <Chevron />
    </View>
  );
}

/** A row that opens a public page or email; shows "Soon" until the URL exists (src/lib/links.ts). */
export function LinkRow({ label, sub, url, first }: { label: string; sub?: string; url: string; first?: boolean }) {
  return url ? (
    <Row first={first} label={label} sub={sub} right={<Chevron />} onPress={() => Linking.openURL(url)} />
  ) : (
    <Row first={first} label={label} sub={sub} right={<T v="caption" style={{ fontFamily: fonts.bold }}>Soon</T>} />
  );
}

export function Chevron({ color = colors.muted }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export function LockIcon({ color = colors.muted }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={5} y={11} width={14} height={10} rx={2} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

export const NOTIFY_ROWS = [
  ['headsUp', 'Heads up', 'At 75% of a limit'],
  ['lastCall', 'Last call', 'At 90% of a limit'],
  ['lateNight', 'Late night', 'After your bedtime'],
  ['weekly', 'Weekly roast', 'Sundays at 7 pm'],
] as const;

export const BEDTIMES = [22 * 60, 22 * 60 + 30, 23 * 60, 23 * 60 + 30, 0, 30, 60, -1];

export function bedtimeLabel(min: number): string {
  if (min < 0) return 'Off';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

export const settingsStyles = StyleSheet.create({
  smallBtn: { height: 34, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.line, justifyContent: 'center' },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
});

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 12, paddingRight: 24, paddingTop: 8, paddingBottom: 4 },
  back: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  group: { borderWidth: 1, borderColor: colors.line, borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  segment: { flexDirection: 'row', gap: 2, padding: 3, borderRadius: 12, backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 12 },
  segBtn: { flex: 1, height: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  segOn: { backgroundColor: colors.white, elevation: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  fix: { height: 34, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.red, justifyContent: 'center' },
});
