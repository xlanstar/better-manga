import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images. */
const images: ChapterImages = { selector: '#manga-imgs img.lazy-read', src: 'data-src' };

/**
 * 古風漫畫: server-rendered (MCCMS, jQuery), one mobile layout for all.
 *
 * - Routes (one host): works `/<id>.html`, chapter `/<id>/<chapter>.html`.
 * - Reader: decrypts the chapter's image list (`params`, `pic.js`) into a
 *   vertical strip of `img.lazy-read[data-src]` in `#manga-imgs`, on
 *   `s2.325784.xyz` (a proxy of GoDa's `6wm.top` images; some chapters'
 *   images are missing there). Each image is downloaded off-page and only
 *   swapped in once loaded, so a failed one stays a placeholder and is never
 *   a broken image: no `reloadBrokenImages`. The next-chapter link
 *   (`.chapterhead a.xia`) is empty on the last chapter. No work title or
 *   chapter title on the chapter page (only `<title>`), so no reading
 *   history. Nothing written to localStorage.
 * - Ads: none seen.
 * - Domains: `www.` serves the same site. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'gfmh',
  label: '古風漫畫',
  matches: ['*://gfmh.app/*', '*://www.gfmh.app/*'],
  features: {
    fastLoad: {
      origins: ['https://s2.325784.xyz'],
      images,
      nextChapter: { link: '.chapterhead a.xia[href$=".html"]' },
    },
  },
});
