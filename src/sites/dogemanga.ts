import { defineSite } from './types';

/**
 * 漫畫狗.
 *
 * - Front end: server-rendered (Bootstrap).
 * - Routes (one host): works `/m/<id>`, pages `/p/<id>`: each page of a
 *   chapter has its own URL, and the reader moves the URL to the page shown.
 *   A chapter opens on its first page's URL.
 * - Reader: every page is an `img.site-reader__image` (same-origin
 *   `/images/pages/<id>.jpg`, set from `data-page-image-url` as pages come
 *   near). Layouts by URL hash (`select[data-kind="layout"]`): right to left
 *   (default), left to right and one per page are paged; `#top-to-bottom`
 *   is a vertical strip that scrolls inside `.site-reader`. Paged by
 *   default, so no image config. The work is the navbar title link, the
 *   chapter the selected option of `select[data-kind="publication"]` (on a
 *   work page it says 選擇回數, hence reader only). No next-chapter link
 *   (the chapter select).
 * - Ads: ExoClick (`a.pemsrv.com`). The page fills its `.site-*-ad-slot`
 *   boxes from base64 `data-desktop` / `data-mobile`; the ad script adds an
 *   in-page push and a video slider; a navbar ad link.
 * - Not handled: the popunder script (`#popmagicldr`) fires on clicks on
 *   `.site-popunder-ad-slot` (the work page's chapter links).
 * - Domains: `www.` redirects to the apex. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'dogemanga',
  label: '漫畫狗',
  matches: ['*://dogemanga.com/*'],
  features: {
    blockAds: {
      hide: [
        '.site-bottom-ad-slot',
        '.site-last-page-ad-slot',
        '.site-fullpage-interstitial-ad-slot',
        '.site-push-notification-ad-slot',
        '.exo-video-slider-container-wrapper',
        '.nav-item:has(> a[href*="zlinkc.com/"])',
      ],
    },
  },
  sections: {
    reader: {
      matches: ['*://dogemanga.com/p/*'],
      features: {
        readingHistory: {
          work: 'a.site-navbar__title',
          chapter: 'select[data-kind="publication"] option:checked',
        },
        // Only the top-to-bottom layout scrolls vertically.
        pageKeys: { container: '.site-reader--top-to-bottom' },
      },
    },
  },
});
