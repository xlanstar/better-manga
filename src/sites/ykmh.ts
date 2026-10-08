import { defineSite } from './types';

/**
 * 優酷漫畫: SinMH (漫畫堆-style) front end, Yii backend.
 *
 * - Front end: server-rendered (jQuery); desktop on `www.`, a mobile build
 *   on `m.` (each sends the other's devices across).
 * - Routes: works `/manhua/<slug>/`, chapter `/manhua/<slug>/<cid>.html`.
 * - Reader: one page at a time by default (`#images`, a scroll mode is a
 *   user setting), so no image config. Images on `fm.haotuyk.top` (the only
 *   line in `SinConf.resHost`). The desktop header names the work (link
 *   `/manhua/<slug>/`) and the chapter; the mobile reader has no work link.
 *   Records the chapter in `localStorage.history` as it opens.
 * - No `nextChapter`: without image config, a prefetched chapter couldn't
 *   preload its images.
 * - Ads: no slots seen. Not handled: third-party ad scripts on mobile.
 * - Domains: the bare host redirects to `www.`. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'ykmh',
  label: '優酷漫畫',
  matches: ['*://www.ykmh.net/*', '*://m.ykmh.net/*'],
  features: {
    fastLoad: { origins: ['https://fm.haotuyk.top'] },
    readingHistory: {
      work: '.head_title > h1 > a',
      chapter: '.head_title > h2',
    },
  },
});
