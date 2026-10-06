/**
 * Public pages (see site/README.md). Leave a value empty until it's live:
 * the matching Settings row then shows "Soon" instead of a broken link.
 */
export const LINKS = {
  site: 'https://super-spiderr.github.io/endloop-site/',
  supportEmail: 'vigneshbalasubramaniyan1409@gmail.com',
};

export const privacyUrl = () => (LINKS.site ? `${LINKS.site.replace(/\/$/, '')}/privacy.html` : '');
export const termsUrl = () => (LINKS.site ? `${LINKS.site.replace(/\/$/, '')}/terms.html` : '');
export const supportUrl = () => (LINKS.site ? `${LINKS.site.replace(/\/$/, '')}/` : '');
export const mailto = (subject: string) => (LINKS.supportEmail ? `mailto:${LINKS.supportEmail}?subject=${encodeURIComponent(subject)}` : '');
