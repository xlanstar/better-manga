import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/**
 * The chapter's page images, in the default full-chapter mode (the
 * `read-by-page` carousel has no `.scramble-page`).
 */
const images: ChapterImages = { selector: '.scramble-page > img', src: 'data-original' };

/**
 * 禁漫天堂, R18.
 *
 * - Front end: server-rendered (jQuery, Bootstrap), one responsive layout.
 * - Routes: works `/album/<id>/<slug>`, chapter `/photo/<id>` (the first
 *   chapter has the work's id); `?read_mode=read-by-page` is a paged
 *   carousel.
 * - Reader: every page is a `.scramble-page > img.lazy_img` loaded by
 *   jquery.lazyload from `data-original`; the script rewrites those to the
 *   CDN it picked (`cdn-msp`, `cdn-msp2`, `cdn-msp3` on the same domain,
 *   so no `origins`). Scrambled pages are then drawn unscrambled on a
 *   `<canvas>` next to the (hidden) image while on screen, so the image
 *   boxes don't give the reading position. The chapter page has no link to
 *   the work with its title (the 返回 link points to `/album/<chapter id>`,
 *   the heading mixes work and chapter), so no reading history.
 * - Ads: banner slots whose class changes (`nb_path`), popunder scripts
 *   (`bn.js`); on a detected ad blocker the page swaps chapter pages
 *   for an ad GIF. So no ad hiding, and no `nextChapter`.
 * - Inspected on `18comic.ink`; the other hosts are behind the Cloudflare
 *   challenge.
 * - Domains: `comic18j-ada.*` and `18comic.org` redirect to `18comic.vip`;
 *   `18comic-ive.club` is for sale and `18comic-aspa.org`,
 *   `18comic-wantgo.cc` redirect to a parking page, so none is matched. Full
 *   list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: '18comic',
  label: '禁漫天堂',
  matches: [
    '*://18comic.vip/*',
    '*://18comic.ink/*',
    '*://jmcomic-zzz.one/*',
    '*://jmcomic-zzz.org/*',
  ],
  features: {
    fastLoad: { images },
    reloadBrokenImages: { images },
  },
});
