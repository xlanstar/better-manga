import { defineSite } from './types';

/**
 * 包子漫畫: GoDa network, 包子 front end.
 *
 * - Backend: shared with `g-mh` (same manga ids; API
 *   `api-get-v3.mgsearcher.com`, images `*.6wm.top`).
 * - Front end: own build, assets under `/_astro/`.
 * - Routes (one host): works `/manga/<slug>`, chapter `/manga/<slug>/<chapter>`.
 * - Ads: TrafficStars SDK (`cdn.tsyndicate.com`), trackers (`pxltag`,
 *   `uuidksinc`), `18gallery.com` banner.
 * - Not handled: clicking a chapter link (`.chapteritem`, `#nextchaptera`,
 *   `#prevchaptera`) also opens an ad URL.
 * - Domains: on `baozimh.one` only `m.` is matched; the bare host is another
 *   site. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'baozimh',
  label: '包子漫畫',
  matches: ['*://*.baozimh.org/*', '*://*.bzmh.org/*', '*://m.baozimh.one/*'],
  features: {
    blockAds: {
      // Unverified: not seen in a headless probe (2026-10-07). Check in a real
      // browser, then move each to the section it appears in. No tag, as the
      // injected element varies.
      hide: ['.baozi-ad', '.mobadsq'],
    },
  },
  sections: {
    reader: {
      matches: [
        '*://*.baozimh.org/manga/*/*',
        '*://*.bzmh.org/manga/*/*',
        '*://m.baozimh.one/manga/*/*',
      ],
      features: {
        // 「點擊繼續閱讀」. Generic class, also on main-site pages: reader only.
        autoContinue: { selector: '.pure-button' },
      },
    },
  },
});
