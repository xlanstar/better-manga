import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/**
 * The chapter's page images. Not `#chapcontent img`: an ad banner sits in
 * there too.
 */
const images: ChapterImages = { selector: '#chapcontent > div > img', src: 'data-src' };

/**
 * 18漫畫: GoDa network (same operator as `baozimh` and `g-mh`), R18.
 *
 * - Front end: `g-mh`'s build, assets under `/_chunks/`.
 * - Routes (one host): works `/manga/<slug>`, chapter `/manga/<slug>/<chapter>`.
 * - Reader: unlike the other GoDa sites, fetches the chapter as HTML
 *   (`/chapter/getcontent`) into `#chapcontent`: the first image loads
 *   straight away, the rest are lazysizes `img[data-src]` that trickle in a
 *   few at a time. Images on `s3-nl-01.mangabuddy.in`. Records the chapter in
 *   `localStorage.ChapterHistory` as it opens. The next-chapter link points
 *   to the chapter list on the last chapter.
 * - Ads: first-party `.adshow` slots, as on `g-mh`.
 * - Not handled: other ad scripts (TrafficStars, Propeller and others) send
 *   the tab to ad pages.
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
  sections: {
    reader: {
      matches: ['*://*.18mh.org/manga/*/*'],
      features: {
        fastLoad: {
          origins: ['https://s3-nl-01.mangabuddy.in'],
          images,
          nextChapter: {
            link: '#nextChapterLink[href*="/manga/"]',
            keepStorage: ['ChapterHistory'],
          },
        },
        reloadBrokenImages: { images },
      },
    },
  },
});
