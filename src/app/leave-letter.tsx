import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { pose, roasterName } from '@/characters';
import { CloseIcon, StarIcon } from '@/components/icons';
import { btn, FadedPose, RedStatusBar, SpotlightScreen } from '@/components/onboarding-ui';
import { Button, T } from '@/components/ui';
import { bookLeave, fmtDay, HALF_COST, LETTER_COST, letterRules, useAttendance } from '@/lib/attendance';
import { useTypewriter } from '@/lib/hooks';
import { poseDrawable, shareCard } from '@/lib/share-cards';
import { useSettings } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

/** Excuses (Product Book A2b). They read as the roaster's Leave Letter reasons, so they stay English. */
const EXCUSES = ['India match. Non-negotiable.', "Cousin's wedding", 'FDFS ticket booked', 'Exam over, brain reboot', 'Rainy day, Netflix', 'Fever (fake, we both know)'];

/**
 * Leave Letter (decided 20 Oct, canvas Screen 18 B–D): ① pick a day and an excuse, ② the letter types
 * itself while the roaster reads it, ③ APPROVED lands with a thud, share or done.
 */
export default function LeaveLetter() {
  const s = useSettings();
  const a = useAttendance();
  const [half, setHalf] = useState(false);
  const rules = letterRules(s, a, half);
  const [step, setStep] = useState<'pick' | 'letter'>('pick');
  const [day, setDay] = useState<string | null>(null);
  const [reason, setReason] = useState(EXCUSES[0]);
  const [paid, setPaid] = useState<'loops' | 'free' | null>(null);
  const name = s.name || 'Yours truly';
  const roaster = roasterName[s.roaster];

  const close = () => (router.canGoBack() ? router.back() : router.replace('/attendance'));

  if (step === 'letter' && day && paid) return <Letter roaster={roaster} roasterKey={s.roaster} day={day} reason={reason} name={name} paid={paid} half={half} onDone={close} />;

  const pick = rules.days.slice(0, s.premium ? 14 : 7);
  const canWrite = !!day && !!rules.pay && rules.open;
  return (
    <SpotlightScreen loopY={0.3}>
      <RedStatusBar />
      <View style={st.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={st.round}>
          <CloseIcon color={colors.white} size={18} />
        </Pressable>
        <View style={st.pillGlass}>
          <T v="bodyBold" style={{ fontSize: 13, color: colors.white }}>{a.loops} Loops · {a.freeLeavesLeft} free</T>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ alignItems: 'center' }}>
          <FadedPose source={pose(s.roaster, 'peer')} size={180} alt={`${roaster}, peering over the glasses`} />
        </View>
        <View style={{ paddingHorizontal: 24, gap: 8 }}>
          <T v="bodyBold" style={st.eyebrow}>Leave Letter · {rules.pay === 'loops' ? `${rules.cost} Loops` : rules.pay === 'free' ? '1 free leave' : `${rules.cost} Loops`}</T>
          <T style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.white }}>A leave letter. How formal. Which day?</T>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 24, paddingTop: 16 }}>
          {pick.map((d) => {
            const on = d.day === day;
            const date = new Date(`${d.day}T00:00:00`);
            return (
              <Pressable
                key={d.day}
                accessibilityRole="radio"
                accessibilityState={{ selected: on, disabled: !d.ok }}
                accessibilityLabel={`${fmtDay(d.day, true)}${d.ok ? '' : `, ${d.why}`}`}
                disabled={!d.ok}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDay(d.day);
                }}
                style={[st.day, on ? { backgroundColor: colors.white, borderColor: colors.white } : null, !d.ok && { opacity: 0.4 }]}>
                <T v="bodyBold" style={{ fontSize: 12, color: on ? colors.red : colors.white }}>{date.toLocaleDateString('en-GB', { weekday: 'short' })}</T>
                <T style={{ fontFamily: fonts.display, fontSize: 18, color: on ? colors.red : colors.white }}>{date.getDate()}</T>
              </Pressable>
            );
          })}
        </ScrollView>
        {/* Full day or (Premium) half day from 6 pm, canvas S18-B. */}
        <View accessibilityRole="radiogroup" style={st.seg}>
          {([false, true] as const).map((h) => {
            const on = half === h;
            const locked = h && !s.premium;
            return (
              <Pressable
                key={String(h)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={h ? `Half day from 6 pm, ${HALF_COST} Loops${locked ? ', Premium' : ''}` : `Full day, ${LETTER_COST} Loops`}
                onPress={() => {
                  if (locked) return router.push({ pathname: '/paywall', params: { reason: 'half-day' } });
                  Haptics.selectionAsync();
                  setHalf(h);
                  setDay(null);
                }}
                style={[st.segBtn, on && { backgroundColor: colors.white }]}>
                {h ? <StarIcon size={12} color={on ? colors.red : '#FFD27A'} /> : null}
                <T v="bodyBold" style={{ fontSize: 13, color: on ? colors.red : colors.white }}>{h ? `Half day · ${HALF_COST}` : `Full day · ${LETTER_COST}`}</T>
              </Pressable>
            );
          })}
        </View>
        <View style={{ paddingHorizontal: 24, paddingTop: 18, gap: 10 }}>
          <T v="bodyBold" style={{ fontSize: 15, color: colors.white }}>Your excuse</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {EXCUSES.map((e) => {
              const on = e === reason;
              return (
                <Pressable key={e} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setReason(e)} style={[st.chip, on && { backgroundColor: colors.white, borderColor: colors.white }]}>
                  <T v="bodyBold" style={{ fontSize: 13, color: on ? colors.red : colors.white }}>{e}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={{ flex: 1, minHeight: 20 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 8, alignItems: 'center' }}>
          <Button
            label="Write my letter"
            tone="white"
            disabled={!canWrite}
            style={btn}
            onPress={() => {
              if (!day || !rules.pay) return;
              bookLeave(day, reason, rules.pay, half);
              setPaid(rules.pay);
              setStep('letter');
            }}
          />
          <T style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
            {!rules.pay
              ? half
                ? `A half day needs ${HALF_COST} Loops.`
                : `You need ${LETTER_COST} Loops or a free leave.`
              : rules.pay === 'loops'
                ? `Costs ${rules.cost} Loops · ${a.loops - rules.cost} left over${half ? ' · no roasts from 6 pm' : ''}`
                : `Uses 1 of your ${a.freeLeavesLeft} free leaves this month`}
          </T>
        </View>
      </ScrollView>
    </SpotlightScreen>
  );
}

function Letter({ roaster, roasterKey, day, reason, name, paid, half, onDone }: { roaster: string; roasterKey: 'loop' | 'lupe'; day: string; reason: string; name: string; paid: 'loops' | 'free'; half: boolean; onDone: () => void }) {
  const date = new Date(`${day}T00:00:00`);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const body = `I am suffering from ${reason.replace(/\.$/, '')}. Kindly grant me ${half ? 'half a day of leave' : 'leave'} on ${weekday}${half ? ' evening' : ''}.`;
  const { shown, done } = useTypewriter([`Respected ${roaster},`, body, `Yours obediently,\n${name}`], { startDelay: 500, charMs: 32, gapMs: 300 });
  const [approved, setApproved] = useState(false);
  const scale = useSharedValue(2.4);
  const stamp = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: '-12deg' }], opacity: scale.value > 2.3 ? 0 : 1 }));

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setApproved(true);
      scale.value = withSequence(withTiming(0.92, { duration: 160 }), withSpring(1, { damping: 8 }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 600);
    return () => clearTimeout(t);
  }, [done, scale]);

  const longDate = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  return (
    <SpotlightScreen loopY={0.3}>
      <RedStatusBar />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ alignItems: 'center', paddingTop: 12 }}>
          <Animated.View key={approved ? 'clap' : 'read'} entering={FadeIn.duration(250)}>
            <FadedPose source={pose(roasterKey, approved ? 'stampApproved' : 'readingLetter')} size={230} alt={approved ? `${roaster}, stamping it APPROVED` : `${roaster}, reading your letter`} />
          </Animated.View>
        </View>
        <View style={{ paddingHorizontal: 28, gap: 12 }}>
          <T v="bodyBold" style={st.eyebrow}>{longDate}</T>
          <T style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: colors.white }} accessibilityLabel={`Respected ${roaster},`}>{shown[0]}</T>
          <T v="bodyBold" style={{ fontSize: 20, lineHeight: 28, color: colors.white }} accessibilityLabel={body}>{shown[1]}</T>
          <T v="bodyBold" style={{ fontSize: 17, lineHeight: 24, color: 'rgba(255,255,255,0.9)' }}>{shown[2]}</T>
          <Animated.View pointerEvents="none" style={[st.stamp, stamp]}>
            <T style={{ fontFamily: fonts.display, fontSize: 30, letterSpacing: 2, color: colors.white }}>APPROVED</T>
          </Animated.View>
        </View>
        <View style={{ flex: 1, minHeight: 20 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 10, alignItems: 'center' }}>
          {approved ? (
            <>
              <T style={{ fontSize: 14, color: colors.white, textAlign: 'center' }}>
                “Leave approved. But I&apos;m watching you after.” · {fmtDay(day, true)}{half ? ' from 6 pm' : ''} booked{paid === 'loops' ? ` · ${half ? HALF_COST : LETTER_COST} Loops` : ''}
              </T>
              <Button
                label="Share my letter"
                tone="white"
                style={btn}
                onPress={() =>
                  shareCard(
                    {
                      kind: 'leave',
                      date: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
                      to: `To ${roaster}`,
                      toRole: 'Head of My Screen Time',
                      reason: `${reason.replace(/\.$/, '')}.`,
                      post: ` Kindly grant me ${half ? 'half a day of leave' : 'leave'} on ${weekday}${half ? ' evening' : ''}.`,
                      name,
                      line: paid === 'loops' ? `Earned with ${half ? HALF_COST : LETTER_COST} Loops. Not a single Reel was harmed.` : 'A free leave. Not a single Reel was harmed.',
                      character: poseDrawable(roasterKey, 'slowClap'),
                      shareTitle: 'Share your letter',
                    },
                    `Respected ${roaster},\n${body}\nYours obediently,\n${name}\n\nAPPROVED. My screen-time app gave me a day off.`,
                  )
                }
              />
              <Pressable accessibilityRole="button" onPress={onDone} hitSlop={8} style={{ paddingVertical: 8 }}>
                <T v="bodyBold" style={{ color: colors.white }}>Done</T>
              </Pressable>
            </>
          ) : (
            <T style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{roaster} is reading it. Slowly. On purpose.</T>
          )}
        </View>
      </ScrollView>
    </SpotlightScreen>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  pillGlass: { height: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', justifyContent: 'center' },
  eyebrow: { fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: '#FFE3E6' },
  day: { width: 54, height: 60, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center', gap: 1 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)', justifyContent: 'center' },
  seg: { flexDirection: 'row', marginHorizontal: 24, marginTop: 14, padding: 4, gap: 4, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.22)' },
  segBtn: { flex: 1, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  stamp: { alignSelf: 'flex-end', marginTop: 4, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 3, borderColor: colors.white, borderRadius: 8 },
});
