import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images, in the mobile (strip) reader. */
const images: ChapterImages = { selector: '#cp_img > img.lazy', src: 'data-src' };

/**
 * Mangabz: Mangabz network (same backend as `xmanhua` and `yymanhua`, same
 * ids), traditional Chinese.
 *
 * - Front end: server-rendered (jQuery); desktop and mobile builds on the
 *   same host, picked by user agent.
 * - Routes: works `/<mid>bz/`, chapter `/m<cid>/` (page `/m<cid>-p<n>/`).
 * - Reader, desktop: one page at a time (`#cp_image`, pages from
 *   `chapterimage.ashx`), so no image config. Its link back to the work
 *   is an icon without text, so no reading history.
 * - Reader, mobile: a strip, `#cp_img img.lazy`, loaded one after another
 *   from `data-src`; no work link.
 * - Images: `image.mangabz.com`.
 * - Reading history: each chapter page records itself in the site's history
 *   (`history.ashx` / `useractivity.ashx`, an HttpOnly cookie), which
 *   `keepStorage` can't undo, so no `nextChapter`.
 * - Ads: none seen.
 * - Domains: `www.` serves the same site. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'mangabz',
  label: 'Mangabz',
  matches: ['*://*.mangabz.com/*'],
  features: {
    fastLoad: { origins: ['https://image.mangabz.com'], images },
    reloadBrokenImages: { images },
  },
});
