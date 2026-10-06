import { Group, NOTIFY_ROWS, Row, SubScreen, Toggle } from '@/components/settings-ui';
import { useSettings } from '@/store/settings';

/** Settings → Notifications. */
export default function NotificationPrefs() {
  const s = useSettings();
  return (
    <SubScreen title="Notifications" intro="The roast at 100% always shows. These are the warnings before it.">
      <Group>
        {NOTIFY_ROWS.map(([key, label, sub], i) => (
          <Row key={key} first={i === 0} label={label} sub={sub} right={<Toggle value={s.notify[key]} label={label} onChange={(v) => s.set({ notify: { ...s.notify, [key]: v } })} />} />
        ))}
      </Group>
    </SubScreen>
  );
}
