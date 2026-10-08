import { defineSite } from './types';

/**
 * 無限動漫: main site on `www.8comic.com`, reader on another host.
 *
 * - Routes: works `www.8comic.com/html/<id>.html`. Chapter links are JS
 *   (`cview()`) to `articles.onemoreplace.tw/online/new-<id>.html?ch=<n>`
 *   (members with the `CKVP` cookie: `www.8comic.com/view/<id>.html?ch=<n>`,
 *   not inspected). Without a referrer from the main site, the reader host
 *   shows a board-game blog; only `/online/` is the reader.
 * - Reader: one strip, `#comics-pics .comics-pic > img`, images on
 *   `img<n>.8comic.com` (`n` varies by work); the first few have a `src`,
 *   the rest get one as they near the screen, from a URL-encoded URL in
 *   their `s` attribute, so no preloading. Prev / next chapter are JS
 *   (`nv()`). The only link to the work (`#pt`) has the chapter and page
 *   count in its text, so no reading history.
 * - Ads: Google Ad Manager slots (`data-slot-path` `/…/onemoreplace_…`)
 *   between the pages and around the strip; an anchor ad (`.tpb-author`).
 * - Domains: `www.comicabc.com`, `www.comicbus.com` and the `8comic.com`
 *   apex redirect to `www.8comic.com`; the older reader hosts
 *   `8.twobili.com`, `a.twobili.com` don't respond. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: '8comic',
  label: '無限動漫',
  matches: ['*://www.8comic.com/*', '*://articles.onemoreplace.tw/online/*'],
  features: {
    blockAds: {
      hide: ['div[data-slot-path*="/onemoreplace_"]', '.tpb-author'],
    },
    reloadBrokenImages: {
      images: { selector: '#comics-pics .comics-pic > img', src: 'src' },
    },
  },
});
