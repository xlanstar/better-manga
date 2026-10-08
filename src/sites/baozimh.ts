import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images. */
const images: ChapterImages = { selector: '#chapcontent img[data-src]', src: 'data-src' };

/**
 * 包子漫畫: GoDa network, 包子 front end. Not the original 包子漫畫
 * (`baozimh-com`); the labels tell the two apart by domain.
 *
 * - Backend: shared with `g-mh` (same manga ids; API
 *   `api-get-v3.mgsearcher.com`, images `*.6wm.top`).
 * - Front end: own build, assets under `/_astro/`.
 * - Routes (one host): works `/manga/<slug>`, chapter `/manga/<slug>/<chapter>`.
 * - Reader: fetches the chapter's image list from the API, then loads the
 *   images one at a time, each after the last (`#chapcontent img[data-src]`,
 *   hosts `c-nd2-1` / `c-nd3-1` by the chapter's line). Records the chapter
 *   in `localStorage.ChapterHistory` as it opens. The work and chapter
 *   titles are in the server-rendered breadcrumb (首頁 / work / chapter),
 *   the work's link `/manga/<slug>`. A failed image turns into
 *   a 「加载失败，点击重试」 (click to retry) placeholder, and stops the chain
 *   until it loads.
 * - Ads: TrafficStars SDK (`cdn.tsyndicate.com`), trackers (`pxltag`,
 *   `uuidksinc`), `18gallery.com` banner.
 * - Not handled: clicking a chapter link (`.chapteritem`, `#nextchaptera`,
 *   `#prevchaptera`) also opens an ad URL.
 * - Domains: on `baozimh.one` only `m.` is matched; the bare host is another
 *   site. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'baozimh',
  label: '包子漫畫（baozimh.org）',
  matches: ['*://*.baozimh.org/*', '*://*.bzmh.org/*', '*://m.baozimh.one/*'],
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
        blockAds: {
          hide: [
            // Around the prev / next chapter buttons: 18gallery banner above,
            // 18mh.org card below.
            'div.py-2:has(+ #nextbutton)',
            '#nextbutton + div.md\\:mx-2',
          ],
        },
        fastLoad: {
          origins: ['https://c-nd2-1.6wm.top', 'https://c-nd3-1.6wm.top'],
          images,
          // On the last chapter it points to the chapter list instead.
          nextChapter: {
            link: '#nextChapterLink[href*="/manga/"]',
            keepStorage: ['ChapterHistory'],
          },
        },
        reloadBrokenImages: { images },
        readingHistory: {
          work: 'nav[aria-label="Breadcrumb"] li:nth-child(2) a',
          chapter: 'nav[aria-label="Breadcrumb"] li:nth-child(3) a',
          images,
        },
      },
    },
  },
});
