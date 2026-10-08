import { defineSite } from './types';

/**
 * 紳士漫畫, R18: no site config, only the shared features.
 *
 * - Front end: server-rendered (MeiuPic, jQuery).
 * - Routes: galleries `/photos-index-aid-<aid>.html` (one per work, no
 *   chapters), reader `/photos-slide-aid-<aid>.html`, single page
 *   `/photos-view-id-<id>.html`.
 * - Reader: its own script (`reader.m.mini.*.js`) gets the image list from
 *   `/photos-item-aid-<aid>.html` and fills empty `.v-slot` boxes near the
 *   screen: it downloads each image off-page and swaps it in once loaded,
 *   and shows its own retry button on a failure, so no image config. It
 *   keeps the reading position itself (`localStorage.wnacg_rp_<aid>`).
 *   Images on `img<n>.qy0.ru`. No title on the reader page, only a 返回
 *   link.
 * - Ads: a sponsored banner or two and a popunder script (`bn.js`); not
 *   handled.
 * - Domains: the bare hosts and `m.wnacg.com` redirect to `www.`. The
 *   footer names `wnacg.ru` as a main domain; its 發布頁 are `wnacg01.link`
 *   and `wnacg02.link`. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'wnacg',
  label: '紳士漫畫',
  matches: [
    '*://www.wnacg.com/*',
    '*://www.wnacg.ru/*',
    '*://www.wn001.cfd/*',
    '*://www.wn002.cfd/*',
  ],
});
