import { defineSite } from './types';

/**
 * G站漫畫: GoDa network, G站 front end.
 *
 * - Backend: shared with `baozimh`.
 * - Front end: own build, assets under `/_chunks/`.
 * - Ads: first-party slots (`.adCode`, `.adshow`, `.banners`), no ad SDK. An
 *   inline script hides `.banners, .adshow` while the `showAds` cookie /
 *   localStorage timestamp is unexpired (「免廣告試驗」).
 * - Not handled: clicking a chapter link (`.slicarda`, `.chapteritem`,
 *   `#nextchaptera`, `#prevchaptera`, `.exoads`) also opens an ad URL, at most
 *   20 times per 5 minutes.
 * - Domains: on `godamh.com` only the apex is matched; `m.godamh.com` is
 *   another site. `www.` hosts only redirect to the apex, so they're not
 *   matched. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'g-mh',
  label: 'G站漫畫',
  matches: ['*://m.g-mh.org/*', '*://g-mh.org/*', '*://godamh.com/*'],
  features: {
    blockAds: {
      hide: ['.adshow'],
    },
  },
});
