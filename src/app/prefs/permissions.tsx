import { useState } from 'react';
import { Linking } from 'react-native';

import { Group, Health, Row, SubScreen } from '@/components/settings-ui';
import { useOnReturn } from '@/lib/hooks';
import { checkPermissions, openBatterySettings, openOverlaySettings, openUsageAccessSettings, requestNotifications } from '@/lib/permissions';

/** Settings → Permissions: what Endloop needs to work, with a one-tap fix for each. */
export default function PermissionPrefs() {
  const [perms, setPerms] = useState(checkPermissions);
  useOnReturn(() => setPerms(checkPermissions()));
  return (
    <SubScreen title="Permissions" intro="Anything off here means a roast can go missing.">
      <Group>
        <Row first label="Usage Access" sub="How I see your screen time" right={<Health ok={perms.usage} fix={openUsageAccessSettings} />} />
        <Row label="Display over apps" sub="How the roast appears" right={<Health ok={perms.overlay} fix={openOverlaySettings} />} />
        <Row label="Battery" sub="So your phone doesn't put me to sleep" right={<Health ok={perms.battery} fix={openBatterySettings} />} />
        <Row
          label="Notifications"
          sub="Warnings at 75% and 90%"
          right={
            <Health
              ok={perms.notifications}
              fix={async () => {
                const ok = await requestNotifications();
                if (!ok) Linking.openSettings();
                setPerms(checkPermissions());
              }}
            />
          }
        />
      </Group>
    </SubScreen>
  );
}
