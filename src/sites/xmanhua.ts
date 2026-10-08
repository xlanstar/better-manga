import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images, in the mobile (strip) reader. */
const images: ChapterImages = { selector: '#cp_img > img.lazy', src: 'data-src' };

/**
 * XManhua: Mangabz network, `mangabz`'s backend (same ids) under another
 * brand, traditional Chinese.
 *
 * - Front end: as on `mangabz` (desktop and mobile builds on one host); the
 *   desktop reader has its own header.
 * - Routes: works `/<mid>xm/`, chapter `/m<cid>/` (page `/m<cid>-p<n>/`).
 * - Reader, desktop: one page at a time (`#cp_image`), so no image config
 *   (nor reading position). The header breadcrumb (首頁 > work > chapter)
 *   names the work, linked `/<mid>xm/`, and the chapter.
 * - Reader, mobile: a strip, as on `mangabz`; no work link.
 * - Images: `image.xmanhua.com`.
 * - Reading history, ads: as on `mangabz` (no `nextChapter`; none seen).
 * - Domains: the bare host serves the same site. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'xmanhua',
  label: 'XManhua',
  matches: ['*://*.xmanhua.com/*'],
  features: {
    fastLoad: { origins: ['https://image.xmanhua.com'], images },
    reloadBrokenImages: { images },
    readingHistory: {
      work: '.reader-title > a:nth-of-type(2)',
      chapter: '.reader-title > a:nth-of-type(3)',
    },
  },
});
