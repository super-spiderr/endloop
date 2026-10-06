import { router } from 'expo-router';
import { View } from 'react-native';

import { pose, type Roaster } from '@/characters';
import { colors } from '@/theme/tokens';

import { ChilliIcon } from './icons';
import { Avatar, Button, LinkButton, Sheet, T } from './ui';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSeePremium?: () => void;
  roaster: Roaster;
  /** Entry point decides the headline (paywall spec). */
  reason: 'apps' | 'unhinged' | 'stats' | 'archive';
};

export function PremiumSheet({ visible, onClose, onSeePremium, roaster, reason }: Props) {
  const dark = reason === 'unhinged';
  const copy: Record<Props['reason'], [string, string]> = {
    apps: ["Watching more than 3? That's Premium.", 'Free keeps an eye on 3 apps. Premium watches all of them.'],
    unhinged: ['You want it meaner? Respect.', 'Unhinged is Premium. Absurd, chaotic, still never about your looks or your family.'],
    stats: ['The long game is Premium.', 'Month view, your full history, every past weekly roast, and unlimited apps.'],
    archive: ['Every roast, kept forever? Premium.', 'Free shows this week and last. Premium keeps every weekly roast so you can see how far you came.'],
  };
  const [title, body] = copy[reason];
  return (
    <Sheet visible={visible} onClose={onClose} dark={dark}>
      {dark ? (
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <ChilliIcon key={i} size={22} />
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {!dark ? <Avatar source={pose(roaster, 'vip')} size={56} /> : null}
        <T v="title" style={{ flex: 1, fontSize: 26, lineHeight: 29, color: dark ? colors.white : colors.ink }}>
          {title}
        </T>
      </View>
      <T style={{ color: dark ? '#D9C7C9' : colors.muted }}>{body}</T>
      <Button
        label="See Premium"
        onPress={
          onSeePremium ??
          (() => {
            onClose();
            router.push(`/paywall?reason=${reason}`);
          })
        }
      />
      <View style={{ alignItems: 'center' }}>
        <LinkButton label="Maybe later" onPress={onClose} color={dark ? '#D9C7C9' : colors.muted} />
      </View>
    </Sheet>
  );
}
