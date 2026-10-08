import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images. */
const images: ChapterImages = { selector: '#acontentz img.imagecontent', src: 'data-src' };

/**
 * 嗶哩漫畫: server-rendered (jieqi CMS, jQuery), mobile layout only.
 *
 * - Routes (one host): works `/detail/<id>.html`, volumes
 *   `/detail/<id>/vol_<n>.html`, chapter `/read/<id>/<chapter>.html`.
 * - Reader: a vertical strip of lazysizes `img.imagecontent[data-src]` in
 *   `#acontentz`, on `i.motiezw.com`. Some visits (desktop browsers, a
 *   chapter opened without coming from the site) get a 「不支持桌面電腦端」
 *   notice instead of the images. Records the chapter in
 *   `localStorage.jieqiHistoryBooks` / `jieqiVisitedLinks`. No link to the
 *   work page (only `/detail/<id>/vol_<n>.html` in a script), so no reading
 *   history; prev / next chapter are JS (`.footlink a`), so no `nextChapter`.
 * - Ads: AdSense slots in the strip (`.ad-slot`, `.tl-gox`).
 * - Not handled: AdSense auto ads (anchor, vignette).
 * - Domains: the bare host redirects to `www.`; `www.bilicomic.net` (its
 *   簡體 twin) redirected here when checked. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'bilimanga',
  label: '嗶哩漫畫',
  matches: ['*://www.bilimanga.net/*'],
  features: {
    blockAds: {
      hide: ['.ad-slot', '.tl-gox'],
    },
    fastLoad: {
      origins: ['https://i.motiezw.com'],
      images,
    },
    reloadBrokenImages: { images },
  },
});
