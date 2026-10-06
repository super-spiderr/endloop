import { Redirect } from 'expo-router';

import { useSettings } from '@/store/settings';

/** First launch goes to Welcome; returning users go straight to Home. */
export default function Index() {
  const onboarded = useSettings((s) => s.onboarded);
  return <Redirect href={onboarded ? '/today' : '/onboarding/welcome'} />;
}
