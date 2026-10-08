import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/**
 * The chapter's page images, in the strip reader: `#cp_img` unless it shows
 * a page counter (`#lbcurrentpage`, the one-image paged reader).
 */
const images: ChapterImages = {
  selector: 'body:not(:has(#lbcurrentpage)) #cp_img > img.lazy',
  src: 'data-src',
};

/**
 * 漫畫人: DM5 network, `dm5`'s backend under another brand.
 *
 * - Front end: only `dm5`'s mobile build, for every browser; the desktop
 *   home page is an app download page.
 * - Routes: works `/manhua-<slug>/`, chapter `/m<cid>/` (same ids as `dm5`).
 * - Reader: as on `dm5`'s mobile site (strip or paged by chapter). No work
 *   link on chapter pages, so no reading history.
 * - Images, `nextChapter`, overlays: as on `dm5`.
 * - Domains: the bare host serves the same site. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'manhuaren',
  label: '漫畫人',
  matches: ['*://*.manhuaren.com/*'],
  features: {
    fastLoad: { images },
    reloadBrokenImages: { images },
  },
});
