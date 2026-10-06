import { Pressable, StyleSheet, View } from 'react-native';

import { pose, roasterName, type Roaster } from '@/characters';
import { Character, Sheet, T } from '@/components/ui';
import { colors } from '@/theme/tokens';

const CARD = '#241416';
const TAGLINE: Record<Roaster, string> = {
  loop: 'Deadpan. Bored. Sees everything.',
  lupe: 'Sharp. Unimpressed. Forgets nothing.',
};

/** Pick your roaster: dark bottom sheet, big character cards. Tapping one picks it and closes. */
export function RoasterSheet({ visible, onClose, current, onPick }: { visible: boolean; onClose: () => void; current: Roaster; onPick: (r: Roaster) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} dark>
      <View style={{ gap: 4 }}>
        <T v="display" style={{ fontSize: 28, lineHeight: 31, color: colors.white }}>Who roasts you?</T>
        <T style={{ color: 'rgba(255,255,255,0.7)' }}>Same roasts, different face. Switch anytime.</T>
      </View>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 12 }}>
        {(['loop', 'lupe'] as Roaster[]).map((r) => {
          const on = r === current;
          return (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${roasterName[r]}. ${TAGLINE[r]}`}
              onPress={() => onPick(r)}
              style={({ pressed }) => [st.card, on && st.cardOn, pressed && { opacity: 0.85 }]}>
              {on ? (
                <View style={st.picked}>
                  <T v="bodyBold" style={{ fontSize: 12, color: colors.white }}>Picked</T>
                </View>
              ) : null}
              <Character source={pose(r, 'idle')} size={140} alt="" fadeTo={CARD} />
              <View style={{ alignSelf: 'stretch', paddingHorizontal: 12, paddingBottom: 14, gap: 2 }}>
                <T v="title" style={{ color: colors.white, fontSize: 20 }}>{roasterName[r]}</T>
                <T style={{ fontSize: 13, lineHeight: 17, color: 'rgba(255,255,255,0.7)' }}>{TAGLINE[r]}</T>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={st.soon} accessible accessibilityLabel="More roasters coming soon">
        <T v="bodyBold" style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>+ More roasters soon</T>
      </View>
    </Sheet>
  );
}

const st = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', borderRadius: 22, backgroundColor: CARD, borderWidth: 2.5, borderColor: 'transparent', overflow: 'hidden', paddingTop: 10 },
  cardOn: { borderColor: colors.red },
  picked: { position: 'absolute', top: 10, right: 10, zIndex: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.red },
  soon: { height: 48, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
