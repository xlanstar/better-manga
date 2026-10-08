import { defineSite } from './types';

/**
 * 喜漫漫畫: no site config, only the shared features.
 *
 * - Front end: server-rendered.
 * - Routes: works `/comic/detail/<id>`, chapter `/comic/chapter/<id>`.
 * - Reader: the page images (`#content img[data-src]`, on
 *   `cdn.favcomic.<tld>`) are encrypted; a worker
 *   (`decrypt.chapter.worker.js`) fetches and decrypts them into `blob:`
 *   URLs, so the image features can't follow them. Manga open in a paged
 *   swiper (canvases), webtoons (`.comic_chapter_box[direction="0"]`) as a
 *   vertical strip. The back button calls `back()` (no `<a href>` to the
 *   work), so no reading history; the next chapter is only a
 *   `<link rel="next">`.
 * - Ads: none seen.
 * - Domains: `.com`, `.xyz`, `.net`, `.cc` serve the same site (canonical
 *   `.com`); `m.` serves it too. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'favcomic',
  label: '喜漫漫畫',
  matches: [
    '*://*.favcomic.com/*',
    '*://*.favcomic.xyz/*',
    '*://*.favcomic.net/*',
    '*://*.favcomic.cc/*',
  ],
});
