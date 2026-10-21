import { EndloopCore } from 'endloop-core';
import { Pressable } from 'react-native';

import { Group, NOTIFY_ROWS, Row, SubScreen, Toggle, settingsStyles } from '@/components/settings-ui';
import { T } from '@/components/ui';
import { useSettings } from '@/store/settings';

/** Settings → Notifications. */
export default function NotificationPrefs() {
  const s = useSettings();
  const live = s.statusMode !== 'minimal';
  return (
    <SubScreen title="Notifications" intro="The roast at 100% always shows. These are the warnings before it.">
      <Group>
        {NOTIFY_ROWS.map(([key, label, sub], i) => (
          <Row key={key} first={i === 0} label={label} sub={sub} right={<Toggle value={s.notify[key]} label={label} onChange={(v) => s.set({ notify: { ...s.notify, [key]: v } })} />} />
        ))}
      </Group>
      <Group>
        <Row
          first
          label="Live counter"
          sub={live ? 'Status shows "Instagram 42/60 min". Off = just "Endloop is on".' : 'Off: the status just says "Endloop is on".'}
          right={<Toggle value={live} label="Live counter" onChange={(v) => s.set({ statusMode: v ? 'live' : 'minimal' })} />}
        />
        {EndloopCore?.openStatusNotificationSettings ? (
          <Row
            label="Hide the status completely"
            sub="Android needs it so I keep counting. You can silence it here."
            right={
              <Pressable accessibilityRole="button" onPress={() => EndloopCore?.openStatusNotificationSettings?.()} style={settingsStyles.smallBtn}>
                <T v="bodyBold" style={{ fontSize: 14 }}>Open</T>
              </Pressable>
            }
          />
        ) : null}
      </Group>
    </SubScreen>
  );
}
