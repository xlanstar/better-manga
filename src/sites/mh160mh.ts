import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images: desktop `#qTcms_Pic_middle`, mobile `#commicBox`. */
const images: ChapterImages = {
  selector: '#qTcms_Pic_middle img.comic_img, #commicBox img.comic_img',
  src: 'data-original',
};

/**
 * 漫畫160: qTcms (晴天 CMS).
 *
 * - Front end: server-rendered (jQuery); desktop on `www.`, a mobile build
 *   on `m.` (the desktop pages send phones there).
 * - Routes: works `/kanmanhua/<slug>/`, chapter `/kanmanhua/<slug>/<cid>.html`.
 * - Reader: a strip, `img.comic_img` with `data-original`; desktop appends
 *   them as the page scrolls, mobile lazy-loads them. Image hosts are
 *   `*.tgmhfc.uk`, picked at random from several per page load, so no
 *   `origins`. The desktop title bar names the work (link
 *   `/kanmanhua/<slug>/`) and the chapter; the mobile reader has no work
 *   link.
 * - Reading history: each chapter page records itself in the site's history
 *   (cookie `qtmhhis`), which `keepStorage` can't undo, so no `nextChapter`.
 * - Ads: none seen.
 * - Domains: the bare host redirects to `www.mh160.cc` (Cloudflare
 *   challenge, not matched). Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'mh160mh',
  label: '漫畫160',
  matches: ['*://www.mh160mh.com/*', '*://m.mh160mh.com/*'],
  features: {
    fastLoad: { images },
    reloadBrokenImages: { images },
    readingHistory: {
      work: '.title > h1 > a',
      chapter: '.title > h2',
      images,
    },
  },
});
