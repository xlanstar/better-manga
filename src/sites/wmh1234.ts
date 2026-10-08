import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images. */
const images: ChapterImages = { selector: '.reader-content > img.reader-image', src: 'data-src' };

/**
 * 漫畫1234: MCCMS, `modern` (mint) template.
 *
 * - Main site: desktop `www.wmh1234.com`, mobile `m.wmh1234.com`; works
 *   `/comic/<id>.html`. Chapter links go to `/go/<token>`, a page that
 *   sends the tab on to the reader by script.
 * - Reader: `reader.hqread.cc/r/<token>`, the mobile build on every device.
 *   A server-rendered strip, `.reader-content img.reader-image`,
 *   lazy-loaded from `data-src`; images on `wmh1234.wszwhg.net` (signed
 *   URLs). Its work link is an icon without text, so no reading history.
 *   Records the chapter in `localStorage.mint_last_read` and
 *   `last_read_<work id>` as it opens; `keepStorage` can't name the second,
 *   so no `nextChapter`.
 * - Ads: iframe slots between the pages (`.reader-ad-slot`).
 * - Not handled: the `/go/` hop; skipping it would hard-code the reader's
 *   host.
 * - Domains: the bare host redirects to `m.`. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'wmh1234',
  label: '漫畫1234',
  matches: ['*://m.wmh1234.com/*', '*://www.wmh1234.com/*', '*://reader.hqread.cc/*'],
  features: {
    blockAds: {
      hide: ['.reader-ad-slot'],
    },
    fastLoad: { origins: ['https://wmh1234.wszwhg.net'], images },
    reloadBrokenImages: { images },
  },
});
