/**
 * Premium plans (Screen 15). Launch prices decided 16 Oct 2026 (08, Premium & the paywall); the founding ₹299 lifetime offer is not shown yet; the real prices will come from
 * Google Play via RevenueCat once billing is set up, and these become the fallback labels.
 */
export type PlanId = 'yearly' | 'monthly' | 'lifetime';

export const PLANS: { id: PlanId; name: string; price: string; sub: string; badge?: string }[] = [
  { id: 'yearly', name: 'Yearly', price: '₹199 / year', sub: 'About ₹17 a month · 7-day free trial', badge: 'Best value' },
  { id: 'monthly', name: 'Monthly', price: '₹39 / month', sub: 'Cancel anytime' },
  { id: 'lifetime', name: 'Lifetime', price: '₹499 once', sub: 'Pay once, yours forever' },
];

export const PLAN_TERMS: Record<PlanId, { cta: string; terms: string }> = {
  yearly: {
    cta: 'Start 7-day free trial',
    terms: "Free for 7 days, then ₹199/year. Cancel anytime in Play Store before day 7 and you won't be charged.",
  },
  monthly: { cta: 'Subscribe · ₹39/month', terms: '₹39 every month. Cancel anytime in Play Store.' },
  lifetime: { cta: 'Buy lifetime · ₹499', terms: 'One payment of ₹499. No subscription, nothing to cancel.' },
};
