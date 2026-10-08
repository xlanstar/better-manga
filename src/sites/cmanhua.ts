import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images, lazy-loaded behind a `loading.gif` placeholder. */
const images: ChapterImages = { selector: 'img.chapter-image', src: 'data-src' };

/**
 * CManhua.
 *
 * - Front end: ASP.NET Web Forms, server-rendered.
 * - Routes (one host): works `/comic/<slug>`, chapter `/ReadComic?id=<id>`.
 * - Reader: a vertical strip with every page image in the HTML, on
 *   `manhua.5um.net`. The chapter title is `#MainContent_lblChapterTitle`,
 *   but nothing links back to the work, so no reading history. Previous /
 *   next chapter and the chapter select are form postbacks, not links.
 * - Ads: none seen.
 * - Domains: `www.cmanhua.com` is a default IIS page, not the site. Full
 *   list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'cmanhua',
  label: 'CManhua',
  matches: ['*://cmanhua.com/*'],
  sections: {
    reader: {
      matches: ['*://cmanhua.com/ReadComic*'],
      features: {
        fastLoad: { origins: ['https://manhua.5um.net'], images },
        reloadBrokenImages: { images },
      },
    },
  },
});
