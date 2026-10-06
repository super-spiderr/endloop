import Constants from 'expo-constants';
import { Linking, Share, View } from 'react-native';

import { Chevron, Group, LinkRow, Row, SubScreen } from '@/components/settings-ui';
import { T } from '@/components/ui';
import { mailto, supportUrl, termsUrl } from '@/lib/links';

const PLAY_ID = 'com.superspider.endloop';

/** Settings → About and help. */
export default function AboutPrefs() {
  const version = Constants.expoConfig?.version ?? '';
  return (
    <SubScreen title="About and help">
      <Group title="Spread the roast">
        <Row first label="Share Endloop" right={<Chevron />} onPress={() => Share.share({ message: "I'm using Endloop. It roasts me when I doomscroll. Get roasted too → endloop app" })} />
        <Row
          label="Rate us on Play Store"
          right={<Chevron />}
          onPress={() => Linking.openURL(`market://details?id=${PLAY_ID}`).catch(() => Linking.openURL(`https://play.google.com/store/apps/details?id=${PLAY_ID}`))}
        />
        <LinkRow label="Suggest a roast" sub="The best ones make it into the app" url={mailto('Roast suggestion')} />
      </Group>
      <Group title="Help">
        <LinkRow first label="Help and feedback" url={supportUrl() || mailto('Endloop help')} />
        <LinkRow label="Terms" url={termsUrl()} />
      </Group>
      <View style={{ alignItems: 'center', gap: 4, paddingTop: 26 }}>
        <T v="caption">Endloop {version}</T>
        <T v="bodyBold" style={{ fontSize: 13 }}>from Super Spider</T>
      </View>
    </SubScreen>
  );
}
