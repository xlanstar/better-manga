import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/**
 * The chapter's page images, in the desktop reader. Not the mobile ones:
 * those keep their URL in `data-h-src`.
 */
const images: ChapterImages = { selector: '.rd-article__pic > img.lazy-read', src: 'data-src' };

/**
 * 六漫畫: MCCMS, the default reader template (as on `mhua5`).
 *
 * - Front end: server-rendered (jQuery); desktop on `www.`, a mobile build
 *   on `m.` (the desktop pages send phones there).
 * - Routes: works `/<id>`, chapter `/<id>/<cid>.html`.
 * - Reader: a strip built by script from an encrypted list. Desktop:
 *   `.rd-article__pic img.lazy-read`, lazy-loaded from `data-src`; the
 *   breadcrumb (`.read__crumb`) has the work link and the chapter title.
 *   Mobile: `#comic-list img.lazy-read` from `data-h-src`, and the work link
 *   is an icon without text, so no image config or reading history there.
 *   Images on `s2.bzcdn.net`.
 * - Next chapter: script-only (`_href`), so no `nextChapter`.
 * - Ads: none in the reader. Not handled: on mobile, a third-party bottom
 *   banner built from randomly named tags.
 * - Domains: the bare host redirects to `www.`. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'liumanhua',
  label: '六漫畫',
  matches: ['*://www.liumanhua.com/*', '*://m.liumanhua.com/*'],
  features: {
    fastLoad: { origins: ['https://s2.bzcdn.net'], images },
    reloadBrokenImages: { images },
    readingHistory: {
      work: '.read__crumb > a.j-comic-title',
      chapter: '.read__crumb > h1.comic-title',
      images,
    },
  },
});
