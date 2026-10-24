/**
 * Premium plans (Screen 20). Launch prices decided 16 Oct 2026 (08, Premium & the paywall), with the founding ₹299 lifetime
 * for the first 500 buyers or 30 days. Real prices will come from Google Play via RevenueCat once billing is set up, and these
 * become the fallback labels. Turn FOUNDING off when the offer ends.
 */
/** Apps watched: Free 3, Premium 6. */
export const FREE_APPS = 3;
export const PREMIUM_APPS = 6;

export type PlanId = 'yearly' | 'monthly' | 'lifetime';

export const PLANS: { id: PlanId; name: string; price: string; sub: string; badge?: string }[] = [
  { id: 'yearly', name: 'Yearly', price: '₹199 / year', sub: 'About ₹17 a month · 7-day free trial', badge: 'Best value' },
  { id: 'monthly', name: 'Monthly', price: '₹39 / month', sub: 'Cancel anytime' },
  { id: 'lifetime', name: 'Lifetime', price: '₹499 once', sub: 'Pay once, yours forever' },
];

/** Founding member lifetime: ₹299 instead of ₹499 for the first 500 buyers or 30 days. */
export const FOUNDING = true;
export const FOUNDING_PLAN = { price: '₹299 once', was: '₹499', sub: 'Pay once. Ends after 500 buyers or 30 days.', badge: 'Founding member · first 500' };

export const PLAN_TERMS: Record<PlanId, { cta: string; terms: string }> = {
  yearly: {
    cta: 'Start 7-day free trial',
    terms: "Free for 7 days, then ₹199/year. Cancel anytime in Play Store before day 7 and you won't be charged.",
  },
  monthly: { cta: 'Subscribe · ₹39/month', terms: '₹39 every month. Cancel anytime in Play Store.' },
  lifetime: FOUNDING
    ? { cta: 'Become a founding member · ₹299', terms: 'One payment of ₹299. No subscription, nothing to cancel.' }
    : { cta: 'Buy lifetime · ₹499', terms: 'One payment of ₹499. No subscription, nothing to cancel.' },
};

/** Dev builds and the internal-testing APK (eas.json preview sets EXPO_PUBLIC_TEST_BUILD) get the Free/Premium switch. */
export const TEST_BUILD = __DEV__ || process.env.EXPO_PUBLIC_TEST_BUILD === '1';
