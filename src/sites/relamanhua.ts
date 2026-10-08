import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** Domains, all current mirrors; every subdomain belongs to the site. */
const DOMAINS = ['manga2024.com', '2024manga.com', 'manga2025.com', 'manga2026.xyz'];

/** The chapter's page images (lazysizes). */
const images: ChapterImages = { selector: '.comicContent-list img', src: 'data-src' };

/**
 * 熱辣漫畫: 拷貝漫畫's sister site (same system as `copymanga`), R18.
 *
 * - Routes (apex and `www.`, same pages): works `/comic/<slug>`, chapter
 *   `/comic/<slug>/chapter/<uuid>`, behind an age gate (`/warning`, sets
 *   cookie `age`). Mobile browsers are redirected to an h5 app on `m.`
 *   (`/v2h5/…`); not handled.
 * - Reader: as `copymanga`'s: `<li><img data-src>` appended to
 *   `.comicContent-list` a few at a time as the reader scrolls; `h4.header`
 *   reads 「work/chapter」 as plain text and the work link 「目录」, so no
 *   reading history. `.comicContent-next a` is the next chapter, with an
 *   empty `href` on the last one. Nothing in localStorage.
 * - Images: `s<first letter of slug>.mangafunb.fun`, so no fixed origins.
 * - Ads: none seen.
 * - Domains: `relamanhua.org` is parked; `www.relamanhua.org` and
 *   `relamanhua.com` serve a certificate browsers reject. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'relamanhua',
  label: '熱辣漫畫',
  matches: DOMAINS.map((domain) => `*://*.${domain}/*`),
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
