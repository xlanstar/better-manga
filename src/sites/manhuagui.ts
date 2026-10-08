import { defineSite } from './types';

/**
 * 漫畫櫃 (看漫画): server-rendered, desktop `www.` (簡體) and `tw.` (繁體),
 * mobile `m.` (a mobile browser on `www.` is redirected there).
 *
 * - Routes: works `/comic/<id>/`, chapter `/comic/<id>/<chapter>.html`.
 * - Reader: paged, one image at a time (desktop `#mangaFile`, the next one
 *   preloaded in `#imgPreLoad`; mobile `#manga > img`), so no image-based
 *   config. Desktop's optional 下拉 mode (`localStorage.pageFunc` 3) appends
 *   the pages to `#mangaMoreBox` one by one as you scroll. Images on a host
 *   picked per visitor from `{i,eu,eu1,eu2,us,us1,us2,us3}.hamreus.com`
 *   (`localStorage.imgHost`); on a failed image the reader tries another
 *   host itself. Prev / next chapter are JS (`SMH.nextC()`). The work and
 *   chapter titles: desktop `h1 > a` (work link) and `h2`; mobile only
 *   `#mangaTitle`, the work link followed by the chapter title as text, so
 *   there the chapter title includes the work's. Records the chapter in
 *   `localStorage.viewed`.
 * - Ads: desktop slots `.gg_728`, `.gg_950`; Sitemaji banners
 *   (`.sitemaji_banner*`) on both.
 * - Not handled: mobile's OneAD video overlay (`#onead-layout0`, injected
 *   by its script).
 * - Domains: `mhgui.com` hosts (`www.`, `m.`, apex) redirect to
 *   `www.manhuagui.com`, path kept, so they're not matched; `cf.mhgui.com`
 *   serves the static assets. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'manhuagui',
  label: '漫畫櫃',
  matches: ['*://www.manhuagui.com/*', '*://tw.manhuagui.com/*', '*://m.manhuagui.com/*'],
  features: {
    blockAds: {
      hide: ['.gg_728', '.gg_950', '.sitemaji_banner', '.sitemaji_banner_popup'],
    },
  },
  sections: {
    reader: {
      matches: [
        '*://www.manhuagui.com/comic/*/*.html',
        '*://tw.manhuagui.com/comic/*/*.html',
        '*://m.manhuagui.com/comic/*/*.html',
      ],
      features: {
        readingHistory: {
          work: '.title h1 > a, #mangaTitle > a',
          chapter: '.title h2, #mangaTitle',
        },
      },
    },
  },
});
