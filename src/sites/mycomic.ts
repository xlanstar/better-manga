import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/**
 * The chapter's page images: the first few with `src`, the rest lazy-loaded
 * (lozad) from `data-src`.
 */
const images: ChapterImages = { selector: 'img[x-ref^="page-"]', src: 'data-src' };

/**
 * MYCOMIC (我的漫畫).
 *
 * - Front end: server-rendered (Flux UI, Alpine.js). Behind Cloudflare
 *   (curl gets 403; browsers pass).
 * - Routes (one host): works `/comics/<id>`, chapter `/chapters/<id>`;
 *   簡體 pages under `/cn/` (so a work there is another history entry).
 * - Reader: a vertical strip with every page image in the HTML, on
 *   `biccam.com`. Breadcrumb (home / work / chapter). Below it 上一話 /
 *   返回目錄 / 下一話; a missing neighbour is a disabled `<button>`. 觀看記錄
 *   is kept server-side, not in `localStorage`.
 * - Ads: none seen.
 * - Domains: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'mycomic',
  label: 'MYCOMIC',
  matches: ['*://mycomic.com/*'],
  sections: {
    reader: {
      matches: ['*://mycomic.com/chapters/*', '*://mycomic.com/cn/chapters/*'],
      features: {
        fastLoad: {
          origins: ['https://biccam.com'],
          images,
          // On the last chapter the last item is a disabled <button>.
          nextChapter: { link: '[data-flux-button-group] > a:last-child[href*="/chapters/"]' },
        },
        reloadBrokenImages: { images },
        readingHistory: {
          work: '[data-flux-breadcrumbs] > :nth-child(2) > a',
          chapter: '[data-flux-breadcrumbs] > :nth-child(3)',
          images,
        },
      },
    },
  },
});
