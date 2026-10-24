import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { pose, roasterName } from '@/characters';
import { StarIcon } from '@/components/icons';
import { PremiumSheet } from '@/components/premium-sheet';
import { Group, Row, Segment, SubScreen, Toggle } from '@/components/settings-ui';
import { Button, Character, LinkButton, Sheet, T } from '@/components/ui';
import { localDay, strictActive, useSettings } from '@/store/settings';
import { colors, fonts } from '@/theme/tokens';

/**
 * Settings → Snooze and Strict mode (canvas S26-A/B). Everything here is Premium and only ever makes
 * snoozing harder: Strict mode, a 2-minute snooze, hard-mode games and "Your own words".
 */
export default function SnoozePrefs() {
  const s = useSettings();
  const [premium, setPremium] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [words, setWords] = useState(s.ownWords?.text ?? '');
  const on = strictActive(s);
  // Switched off, waiting for tomorrow (after that day Strict mode is simply off).
  const offPending = !!s.strictOn && !!s.strictOffFrom && localDay() < s.strictOffFrom;
  const gate = (fn: () => void) => () => (s.premium ? fn() : setPremium(true));

  const saveWords = () => {
    const text = words.replace(/\s+/g, ' ').trim().slice(0, 90);
    setWords(text);
    s.set({ ownWords: text ? { text, on: s.ownWords?.text === text ? s.ownWords.on : localDay() } : undefined });
  };

  return (
    <SubScreen title="Snooze" intro="Only ever stricter. Premium can make snoozing harder, never easier.">
      <Group title="Strict mode" note={offPending ? `Turns off tomorrow, as promised.` : on ? 'On. Only "Fine. Close it." after your 3rd snooze of the day.' : undefined}>
        <Row
          first
          label="Strict mode"
          sub="After the 3rd snooze of the day: no snoozes, no games, no Bunk. Turns off only from tomorrow."
          right={
            <Toggle
              value={on && !offPending}
              label="Strict mode"
              onChange={gate(() => {
                if (!on) setConfirm(true);
                // Switching off waits until tomorrow; switching back on before then just cancels that.
                else if (offPending) s.set({ strictOffFrom: undefined });
                else s.set({ strictOffFrom: localDay(1) });
              })}
            />
          }
        />
      </Group>

      <Group title="Snooze length" note="2 minutes is for people who mean it. You can't pick longer.">
        <View style={{ paddingTop: 12 }}>
          <Segment<'5' | '2'>
            options={[
              ['5', '5 minutes'],
              ['2', '2 minutes'],
            ]}
            value={s.premium && s.snoozeMin === 2 ? '2' : '5'}
            locked={s.premium ? [] : ['2']}
            onChange={(v) => (s.premium ? s.set({ snoozeMin: v === '2' ? 2 : 5 }) : setPremium(true))}
          />
        </View>
      </Group>

      <Group>
        <Row first label="Hard mode" sub="Faster games, more rounds. The fallback timer stays the same, so you're never stuck." right={<Toggle value={!!(s.premium && s.hardMode)} label="Hard mode" onChange={gate(() => s.set({ hardMode: !s.hardMode }))} />} />
      </Group>

      <Group title="Your own words" note={`${roasterName[s.roaster]} holds this up before your first snooze of the day. Stays on this phone.`}>
        <TextInput
          value={words}
          onChangeText={setWords}
          onEndEditing={saveWords}
          onSubmitEditing={saveWords}
          editable={s.premium}
          onPressIn={() => (s.premium ? undefined : setPremium(true))}
          placeholder={s.premium ? 'Why are you cutting down? e.g. Boards in March.' : 'Premium · your own reason, held up to you'}
          placeholderTextColor={colors.muted}
          maxLength={90}
          multiline
          returnKeyType="done"
          blurOnSubmit
          accessibilityLabel="Your own words"
          style={st.input}
        />
      </Group>

      {!s.premium ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 16 }}>
          <StarIcon size={12} />
          <T v="caption">Everything on this page is Premium.</T>
        </View>
      ) : null}

      {/* S26-B: Lock yourself in? */}
      <Sheet visible={confirm} onClose={() => setConfirm(false)}>
        <View style={{ alignItems: 'center' }}>
          <Character source={pose(s.roaster, 'padlock')} size={160} alt={`${roasterName[s.roaster]} holding a gold padlock`} />
        </View>
        <T style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: colors.ink }}>Lock yourself in?</T>
        <T>Once it&apos;s on, the roast screen only has one button after your 3rd snooze: close it.</T>
        <View style={{ gap: 6 }}>
          {['No snoozes, no games, no Bunk today.', 'Turning it off only works from tomorrow.', 'Your own words still show on the roast.'].map((x) => (
            <T key={x} v="bodyBold" style={{ fontSize: 14 }}>
              · {x}
            </T>
          ))}
        </View>
        <Button
          label="Turn on Strict mode"
          onPress={() => {
            s.set({ strictOn: true, strictSince: localDay(), strictOffFrom: undefined });
            setConfirm(false);
          }}
        />
        <View style={{ alignItems: 'center' }}>
          <LinkButton label="Not today" onPress={() => setConfirm(false)} />
        </View>
      </Sheet>

      <PremiumSheet visible={premium} onClose={() => setPremium(false)} roaster={s.roaster} reason="strict" />
    </SubScreen>
  );
}

const st = StyleSheet.create({
  input: { minHeight: 64, paddingHorizontal: 4, paddingVertical: 12, fontFamily: fonts.bold, fontSize: 16, color: colors.ink, textAlignVertical: 'top' },
});
