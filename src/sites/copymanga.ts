import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** Domains, all current mirrors; every subdomain belongs to the site. */
const DOMAINS = [
  'mangacopy.com',
  'copy20.com',
  '2026copy.com',
  'copy3000.com',
  'copy4000.com',
  'copy5000.com',
];

/** The chapter's page images (lazysizes). */
const images: ChapterImages = { selector: '.comicContent-list img', src: 'data-src' };

/**
 * 拷貝漫畫: same system as `relamanhua` (熱辣漫畫).
 *
 * - Routes (apex and `www.`, same pages): works `/comic/<slug>`, chapter
 *   `/comic/<slug>/chapter/<uuid>`. Mobile browsers are redirected to an h5
 *   app (`/h5/…`) that shows a few pages and then 「安裝APP後可瀏覽完整內容」;
 *   not handled.
 * - Reader: decrypts the chapter's image list in the page, then appends
 *   `<li><img data-src>` to `.comicContent-list` a few at a time as the
 *   reader scrolls; lazysizes loads them. The header (`h4.header`) reads
 *   「work/chapter」 as plain text; the work link (`.list a`) reads 「目錄」,
 *   so no reading history. `.comicContent-next a` is the next chapter, with
 *   an empty `href` on the last one. Nothing in localStorage.
 * - Images: `s<first letter of slug>.mangafunb.fun`, so no fixed origins.
 * - Ads: own banners promoting 熱辣漫畫 (`.indexAds`, `.comicDetailAds`,
 *   `.comicContainerAds`, labelled 廣告).
 * - Domains: the site names `www.copy4000.com` for mainland China. Full
 *   list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'copymanga',
  label: '拷貝漫畫',
  matches: DOMAINS.map((domain) => `*://*.${domain}/*`),
  features: {
    blockAds: { hide: ['.indexAds', '.comicDetailAds', '.comicContainerAds'] },
  },
  sections: {
    reader: {
      matches: DOMAINS.map((domain) => `*://*.${domain}/comic/*/chapter/*`),
      features: {
        fastLoad: {
          images,
          nextChapter: { link: '.comicContent-next a[href*="/chapter/"]' },
        },
        reloadBrokenImages: { images },
      },
    },
  },
});
