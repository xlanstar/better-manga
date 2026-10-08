import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/**
 * The chapter's page images, in the strip readers: desktop `#barChapter`,
 * mobile `#cp_img` unless it shows a page counter (`#lbcurrentpage`, the
 * one-image paged reader).
 */
const images: ChapterImages = {
  selector: '#barChapter > img.load-src, body:not(:has(#lbcurrentpage)) #cp_img > img.lazy',
  src: 'data-src',
};

/**
 * 極速漫畫: DM5 network, `dm5`'s backend and templates under another brand.
 *
 * - Front end: as on `dm5`, desktop on `www.`, mobile on `m.` (the desktop
 *   host sends phones there).
 * - Routes: works `/manhua<mid>/`, chapter `/ch<n>-<cid>/`.
 * - Reader, images, reading history, overlays: as on `dm5` (strip or paged
 *   by chapter; desktop header with the work link `/manhua<mid>/`; no work
 *   link on mobile; no `origins`, no `nextChapter`).
 * - Domains: the bare host redirects to `www.`. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: '1kkk',
  label: '極速漫畫',
  matches: ['*://*.1kkk.com/*'],
  features: {
    fastLoad: { images },
    reloadBrokenImages: { images },
    readingHistory: {
      work: '.view-header-2 .right-arrow:not(.active) > a',
      chapter: '.view-header-2 .right-arrow.active',
      images,
    },
  },
});
