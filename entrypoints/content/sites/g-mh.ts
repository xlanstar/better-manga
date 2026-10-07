import type { Site } from './types';

/**
 * GoDa network, G站 front end. Same operator and content backend as
 * `baozimh`, but a different front end (built assets under `/_chunks/`; the
 * reader adds a chapter drawer, zoom and refresh buttons):
 *
 * - No TrafficStars SDK. Ad slots are first-party markup (`.adCode`,
 *   `.adshow`, `.banners`); an inline script hides `.banners, .adshow` when
 *   the `showAds` cookie / localStorage holds an unexpired timestamp (the
 *   publish page's 「免廣告試驗」). That is why it usually shows fewer ads.
 * - An inline script opens a rotating ad URL when a chapter link is clicked
 *   (`.slicarda`, `.chapteritem`, `#nextchaptera`, `#prevchaptera`,
 *   `.exoads`), capped at 20 jumps per 5 minutes. Not handled yet.
 *
 * `godamh.com` serves this same front end; `m.godamh.com` is an unrelated
 * news site, hence no wildcard there. `www.g-mh.org` and `www.godamh.com`
 * only 301 to the apex, so they are not matched.
 * All domains: docs/manga-sites.md.
 */
export default {
  name: 'g-mh',
  label: 'G站漫畫',
  matches: ['*://m.g-mh.org/*', '*://g-mh.org/*', '*://godamh.com/*'],
} satisfies Site;
