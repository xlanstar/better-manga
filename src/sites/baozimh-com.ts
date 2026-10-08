import { defineSite } from './types';

/** Domains; every subdomain belongs to the site. */
const DOMAINS = [
  'baozimh.com',
  'webmota.com',
  'kukuc.co',
  'twmanga.com',
  'dinnerku.com',
  'twbzmg.com',
  'baozimh.vip',
];

/**
 * 包子漫畫 (baozimh.com): the original 包子漫畫, not GoDa's `baozimh`
 * (baozimh.org).
 *
 * - Front end: server-rendered Nuxt AMP pages (`cdn.ampproject.org`), the
 *   same on every domain; `www.` / `tw.` traditional, `cn.` simplified.
 * - Routes (any host): works `/comic/<slug>`, chapter
 *   `/comic/chapter/<slug>/<section>_<chapter>.html`, long chapters split
 *   into pages `…_<chapter>_2.html`, …. Chapter links on works pages go via
 *   `/user/page_direct?…` to `www.` / `cn.` / `tw.twbzmg.com`.
 * - Reader: a vertical strip of `amp-img.comic-contain__item`; AMP adds each
 *   one's `<img>` (`src` set) only as it nears the screen. On some hosts a
 *   script then races mirrors (`s1.baozimh.com`, `s1-*.bzcdn.net`) and
 *   swaps every image's host; the HTML has `s1.bzcdn.net`. A failed image
 *   shows 「圖片加載失敗了」 with a 「重新加載」 button. `#next-chapter` is the
 *   next page or chapter, same origin; missing on the last one.
 * - Ads: `.mobadsq` slots between and below the images (Outbrain, prebid),
 *   reader only.
 * - Not handled: reading history (the chapter page names its work nowhere
 *   but in `<title>`; its work links read 「目錄」 or nothing); preloading
 *   images or the next chapter (AMP builds images lazily, and the mirror
 *   race changes their URLs).
 * - Domains: `www.baozimh.com` sits behind a JS challenge,
 *   `baozimh.vip` behind Cloudflare's (unverified). `appcn.` / `appgb.` are
 *   the app's hosts (no pages), matched with the rest. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'baozimh-com',
  label: '包子漫畫（baozimh.com）',
  matches: DOMAINS.map((domain) => `*://*.${domain}/*`),
  sections: {
    reader: {
      matches: DOMAINS.map((domain) => `*://*.${domain}/comic/chapter/*`),
      features: {
        blockAds: { hide: ['.mobadsq'] },
        fastLoad: { origins: ['https://s1.bzcdn.net'] },
        // AMP's `<img>`, once built. Retrying it also clears AMP's fallback.
        reloadBrokenImages: { images: { selector: '.comic-contain__item > img', src: 'src' } },
      },
    },
  },
});
