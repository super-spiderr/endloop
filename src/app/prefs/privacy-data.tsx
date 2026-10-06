import { EndloopCore } from 'endloop-core';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { pose, roasterName } from '@/characters';
import { Group, LinkRow, NavRow, Row, SubScreen } from '@/components/settings-ui';
import { Button, Character, LinkButton, Sheet, T } from '@/components/ui';
import { privacyUrl } from '@/lib/links';
import { useSettings } from '@/store/settings';
import { colors } from '@/theme/tokens';

/** Settings → Privacy and data. */
export default function PrivacyPrefs() {
  const s = useSettings();
  const [del, setDel] = useState(false);
  return (
    <SubScreen title="Privacy and data" intro="Everything stays on this phone.">
      <Group>
        <NavRow first label="What Endloop can see" value="Plain words" href="/privacy" />
        <LinkRow label="Privacy policy" url={privacyUrl()} />
      </Group>
      <Group>
        <Row first label="Delete all my data" sub="Limits, stats, streaks, roasts" danger onPress={() => setDel(true)} />
      </Group>

      <Sheet visible={del} onClose={() => setDel(false)}>
        <View style={{ alignItems: 'center' }}>
          <Character source={pose(s.roaster, 'dramatic')} size={150} alt={`${roasterName[s.roaster]}, clutching their chest`} />
        </View>
        <T v="display" style={{ fontSize: 28, lineHeight: 31 }}>Delete everything?</T>
        <T>Your limits, stats, streaks, roasts and snooze history are wiped from this phone. This can&apos;t be undone.</T>
        <Button label="Keep my data" onPress={() => setDel(false)} />
        <View style={{ alignItems: 'center' }}>
          <LinkButton
            label="Delete all my data"
            color={colors.red}
            onPress={async () => {
              setDel(false);
              await EndloopCore?.clearData();
              s.reset();
              router.replace('/onboarding/welcome');
            }}
          />
        </View>
      </Sheet>
    </SubScreen>
  );
}
