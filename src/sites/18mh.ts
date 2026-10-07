import { defineSite } from './types';

/**
 * 18漫畫: GoDa network (same operator as `baozimh` and `g-mh`), R18.
 *
 * - Ads: first-party `.adshow` slots, as on `g-mh`.
 * - Domains: behind a Cloudflare challenge, so subdomains are unverified;
 *   the apex and every subdomain are matched. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: '18mh',
  label: '18漫畫',
  matches: ['*://*.18mh.org/*'],
  features: {
    blockAds: {
      hide: ['.adshow'],
    },
  },
});
