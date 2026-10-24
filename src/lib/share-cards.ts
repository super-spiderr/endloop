/**
 * Share cards (canvas Screen 21). The native module draws them as square 1080×1080 PNGs (ShareCard.kt) so they look the
 * same everywhere; this file only describes them. Off Android (web preview) or if drawing fails, a text share stands in.
 */
import { EndloopCore } from 'endloop-core';
import { Platform, Share } from 'react-native';

import type { Pose, Roaster } from '@/characters';

export const SHARE_TAGLINE = 'Get roasted. Scroll less.';

type Base = { character: string; shareTitle?: string };

export type CardSpec = Base &
  (
    | { kind: 'milestone'; days: string; label?: string; line: string; pill?: string }
    | { kind: 'leave'; date: string; to: string; toRole: string; reason: string; post: string; name: string; line: string }
    | { kind: 'weekly'; dates: string; label: string; total: string; apps: { label: string; color: string; change: string; up: boolean }[]; roast: string }
  );

/** The native drawable for a pose: endloop_loop_rare_smile. Only poses shipped in drawable-nodpi work. */
export const poseDrawable = (who: Roaster, p: Pose) => `endloop_${who}_${p.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}`;

/** Share (or save, with `save`) a card. Returns false only when saving wasn't possible. */
export async function shareCard(spec: CardSpec, fallbackText: string, save = false): Promise<boolean> {
  if (Platform.OS === 'android' && EndloopCore?.shareCard) {
    try {
      return await EndloopCore.shareCard(JSON.stringify({ tagline: SHARE_TAGLINE, ...spec }), !save);
    } catch {
      // fall through to the text share
    }
  }
  if (save) return false;
  await Share.share({ message: `${fallbackText} Get roasted too → Endloop on Google Play` }).catch(() => {});
  return true;
}

/** S21-B lines, by milestone. */
export const MILESTONE_SHARE: Record<number, string> = {
  3: 'Three days under every limit. Could be luck.',
  7: 'A whole week under every limit. Suspicious.',
  14: 'Two weeks under every limit. Who even are you?',
  30: 'A month under every limit. My roaster needs a new job.',
  100: 'A hundred days under every limit. Out of roasts.',
};
