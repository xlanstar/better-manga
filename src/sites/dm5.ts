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
 * 動漫屋: DM5 network (same backend and templates as `1kkk` and `manhuaren`).
 *
 * - Front end: server-rendered (jQuery), desktop on `www.`, a mobile build
 *   on `m.` (the desktop hosts send phones there).
 * - Routes: works `/manhua-<slug>/`, chapter `/m<cid>/` (page `/m<cid>-p<n>/`).
 * - Reader: by chapter, a strip or one page at a time (the scroll mode for
 *   paged chapters is VIP only). Strip, desktop: `#barChapter img.load-src`,
 *   loaded one after another from `data-src`; mobile: `#cp_img img.lazy`,
 *   the same. Paged: desktop `#cp_image` (pages from `chapterfun.ashx`),
 *   mobile one `#cp_img img.lazy` with a `#lbcurrentpage` counter; no image
 *   config there. The desktop header names the work (link
 *   `/manhua-<slug>/`) and the chapter; the mobile reader has no work link.
 * - Images: `manhua10<nn>zjcdn<63|79>.cdndm5.com`, many hosts, so no
 *   `origins`.
 * - Reading history: each chapter page records itself in the site's history
 *   (`history.ashx` / `userdata.ashx` set an HttpOnly cookie), which
 *   `keepStorage` can't undo, so no `nextChapter`.
 * - Ads: none seen. Not handled: app promo overlays, which lock page
 *   scrolling until closed.
 * - Domains: `tel.`, `en.`, `cnc.` and `www.dm5.cn` serve the same site;
 *   the bare hosts redirect to `www.`. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'dm5',
  label: '動漫屋',
  matches: ['*://*.dm5.com/*', '*://www.dm5.cn/*'],
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
