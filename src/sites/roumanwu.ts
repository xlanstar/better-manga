import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/**
 * The chapter's page images. The real URL is only in the page's data,
 * from which its script swaps it into `src` (over `/loading.jpg`) near the screen.
 */
const images: ChapterImages = { selector: '.site-reader-canvas img[id^="image_"]', src: 'src' };

/**
 * 肉漫屋, R18.
 *
 * - Front end: React, server-rendered.
 * - Routes (one host): works `/books/<id>`, chapter `/books/<id>/<n>`
 *   (from 0).
 * - Reader: a vertical strip of `img#image_<n>` in `.site-reader-canvas`,
 *   on `v1`–`v5.towm85.xyz` (a numbered domain, likely to move, so no
 *   `origins`). No attribute holds an image's URL before it loads, so no
 *   preloading. The heading names the work and chapter as text; the work
 *   link is 目錄, so no reading history.
 * - Ads: first-party banners linking to `/api/jump/…` (random class names),
 *   above the strip, below it and fixed at the bottom.
 * - Not handled: third-party banner iframes, popunder scripts (so no
 *   `nextChapter`).
 * - Domains: the 發布頁 `rou.pub/dizhi` lists both hosts; `www.` hosts
 *   don't serve. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'roumanwu',
  label: '肉漫屋',
  matches: ['*://rouman5.com/*', '*://roum29.xyz/*'],
  features: {
    blockAds: {
      hide: ['div:has(> a[href^="/api/jump/"])'],
    },
    reloadBrokenImages: { images },
  },
});
