import { defineSite } from './types';

/**
 * 妙趣漫畫: MCCMS, `tiantangmanhua` template.
 *
 * - Front end: server-rendered (jQuery); desktop on `www.`, a mobile build
 *   on `m.` (the desktop pages send phones there).
 * - Routes: works `/<slug>`, chapter `/<id>/<cid>.html`.
 * - Reader: a strip, `#manga-imgs img.lazy`, built by script from an
 *   encoded list; the real URLs stay in the script until each image scrolls
 *   into view (placeholder `lazyload.gif` until then), so there is nothing
 *   to preload and only failed images are retried. Images on `s2.bzcdn.net`.
 *   For the same reason a prefetched next chapter couldn't preload its
 *   images, so no `nextChapter`.
 * - Reading history: no page names the work (the work link reads 目录), so
 *   not configured.
 * - Ads: none in the reader. Not handled: on mobile, a third-party bottom
 *   banner built from randomly named tags.
 * - Domains: the bare host redirects to `www.`. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'miaoqumh',
  label: '妙趣漫畫',
  matches: ['*://www.miaoqumh.org/*', '*://m.miaoqumh.org/*'],
  features: {
    fastLoad: { origins: ['https://s2.bzcdn.net'] },
    reloadBrokenImages: { images: { selector: '#manga-imgs img.lazy', src: 'src' } },
  },
});
