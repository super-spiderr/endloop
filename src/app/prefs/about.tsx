import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Share, View } from 'react-native';

import { Chevron, Group, LinkRow, Row, SubScreen } from '@/components/settings-ui';
import { T } from '@/components/ui';
import { mailto, supportUrl, termsUrl } from '@/lib/links';
import { syncWatcher } from '@/lib/watcher';
import { libraryInfo } from '@/roasts';
import { checkRoastUpdates, type CheckResult } from '@/roasts/remote';

const PLAY_ID = 'com.superspider.endloop';

/** Settings → About and help. */
export default function AboutPrefs() {
  const version = Constants.expoConfig?.version ?? '';
  const [check, setCheck] = useState<CheckResult | 'checking' | null>(null);
  const [info, setInfo] = useState(libraryInfo);
  const cloud = info.find((i) => i.source === 'cloud');
  const lines = cloud ? `Version ${cloud.version} · ${info.reduce((n, i) => n + i.count, 0)} lines` : 'Built into the app';
  const CHECK_LABEL: Record<string, string> = {
    checking: 'Checking…', updated: 'New roasts added', same: 'Up to date', skipped: 'Up to date',
    offline: "Couldn't connect", rejected: 'Up to date',
  };
  const checkNow = async () => {
    setCheck('checking');
    const r = await checkRoastUpdates(true);
    if (r === 'updated') await syncWatcher().catch(() => {});
    setInfo(libraryInfo());
    setCheck(r);
  };
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
      <Group title="Roasts" note="New roast lines arrive by themselves now and then, including festival specials.">
        <Row first label="Roast lines" sub={lines} right={check ? <T v="caption">{CHECK_LABEL[check]}</T> : <Chevron />} onPress={check === 'checking' ? undefined : checkNow} />
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
