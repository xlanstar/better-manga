import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/**
 * The chapter's page images: desktop lazy-loaded from `data-original`,
 * mobile plain `src` (no `data-original`, so taken as is).
 */
const images: ChapterImages = {
  selector: '.rd-article__pic > img.lazy-read, .comic-page > img',
  src: 'data-original',
};

/**
 * 漫畫屋: MCCMS, the default reader template (as on `liumanhua`).
 *
 * - Front end: server-rendered (jQuery); desktop and mobile builds on the
 *   same host, picked by user agent.
 * - Routes: works `/index.php/comic/<slug>`, chapter
 *   `/index.php/chapter/<cid>`.
 * - Reader: a strip. Desktop: built by script, `.rd-article__pic
 *   img.lazy-read` from `data-original`; the breadcrumb (`.read__crumb`) has
 *   the work link and the chapter title. Mobile: server-rendered
 *   `.comic-page img`; the work link is an icon without text, so no reading
 *   history there. Images from the works' sources (`s1.baozimh.com`,
 *   `oss.mkzcdn.com` seen).
 * - Next chapter: script-only (`_href`), so no `nextChapter`.
 * - Ads: an app promo after the strip on mobile (`#android-app-ad`).
 * - Domains: the bare host serves the same site. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'mhua5',
  label: '漫畫屋',
  matches: ['*://www.mhua5.com/*', '*://mhua5.com/*'],
  features: {
    blockAds: {
      hide: ['#android-app-ad'],
    },
    fastLoad: { origins: ['https://s1.baozimh.com', 'https://oss.mkzcdn.com'], images },
    reloadBrokenImages: { images },
    readingHistory: {
      work: '.read__crumb > a.j-comic-title',
      chapter: '.read__crumb > h1.comic-title',
      images,
    },
  },
});
