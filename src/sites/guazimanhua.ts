import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images: native lazy loading, so the URL is in `src`. */
const images: ChapterImages = { selector: '.reader-images > img.reading-image', src: 'src' };

/**
 * 瓜子漫畫: own PHP front end, one responsive build for desktop and mobile.
 *
 * - Routes: works `/comic.php?id=<id>`, chapter `/chapter.php?id=<cid>`.
 * - Reader: a server-rendered strip, `.reader-images img.reading-image`
 *   (`loading="lazy"`), images on `img.guazicdn.com`. A 翻页 button switches
 *   to a paged view; not handled. The next-chapter link (`data-reader-next`)
 *   is a `<span>` on the last chapter. On phones, records the chapter in
 *   `localStorage.guazi_mobile_guest_history_v1` as it opens.
 * - Reading history: not configured; the work is only in the query
 *   (`/comic.php?id=`), and work ids are paths.
 * - Ads: a banner above the strip (`.desktop-reader-top-ad`,
 *   `.mobile-reader-top-static-ad`). Not handled: a third-party bottom
 *   banner on phones, built from randomly named tags.
 * - Domains: the bare host redirects to `www.`. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'guazimanhua',
  label: '瓜子漫畫',
  matches: ['*://www.guazimanhua.com/*'],
  features: {
    blockAds: {
      hide: ['.desktop-reader-top-ad', '.mobile-reader-top-static-ad'],
    },
    fastLoad: {
      origins: ['https://img.guazicdn.com'],
      images,
      nextChapter: {
        link: 'a[data-reader-next][href*="chapter.php"]',
        keepStorage: ['guazi_mobile_guest_history_v1'],
      },
    },
    reloadBrokenImages: { images },
  },
});
