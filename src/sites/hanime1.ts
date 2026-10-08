import { defineSite } from './types';

/**
 * hanime1, R18: mainly a video site, with comics on `hanimeone.me`.
 *
 * - Front end: server-rendered (jQuery).
 * - Routes (comics): works `/comic/<id>`, one URL per page
 *   `/comic/<id>/<page>`.
 * - Reader: paged, one `#current-page-image` at a time (images on
 *   `i<n>.nhentai.net`), so no image config. Galleries have no chapters,
 *   so no reading history.
 * - Ads: JuicyAds banners at the top and bottom of every comics page
 *   (`.comics-banner-ads`).
 * - Not handled: the video pages' ads.
 * - Domains: `hanime1.me` (videos only; `/comics` there is a 404) is behind
 *   a Cloudflare check that a browser passes; `www.hanimeone.me` redirects
 *   to the apex. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'hanime1',
  label: 'hanime1',
  matches: ['*://hanime1.me/*', '*://hanimeone.me/*'],
  features: {
    blockAds: {
      hide: ['.comics-banner-ads'],
    },
  },
});
