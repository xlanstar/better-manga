import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images, in the mobile (strip) reader. */
const images: ChapterImages = { selector: '#cp_img > img.lazy', src: 'data-src' };

/**
 * YYManhua: Mangabz network, `mangabz`'s backend (same ids) under another
 * brand, traditional Chinese.
 *
 * - Front end, reader: as on `xmanhua` (desktop: one page at a time, header
 *   breadcrumb with the work and chapter; mobile: a strip, no work link).
 * - Routes: works `/<mid>yy/`, chapter `/m<cid>/` (page `/m<cid>-p<n>/`).
 * - Images: `image.yymanhua.com`.
 * - Reading history, ads: as on `mangabz` (no `nextChapter`; none seen).
 * - Domains: the bare host serves the same site. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'yymanhua',
  label: 'YYManhua',
  matches: ['*://*.yymanhua.com/*'],
  features: {
    fastLoad: { origins: ['https://image.yymanhua.com'], images },
    reloadBrokenImages: { images },
    readingHistory: {
      work: '.reader-title > a:nth-of-type(2)',
      chapter: '.reader-title > a:nth-of-type(3)',
    },
  },
});
