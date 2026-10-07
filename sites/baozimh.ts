import { clickOnAppear, keepHidden } from '@/utils/dom';
import { defineSite } from './types';

/**
 * GoDa network, 包子 front end. Same operator and content backend as `g-mh`
 * (same manga ids, chapter slugs, chapter API `api-get-v3.mgsearcher.com` and
 * image CDN `*.6wm.top`), but a different front end with its own ad stack:
 *
 * - Built assets under `/_astro/`.
 * - Loads the TrafficStars ad SDK (`cdn.tsyndicate.com`) plus trackers
 *   (`pxltag`, `uuidksinc`) and a `18gallery.com` banner; `g-mh` has none.
 * - An inline script opens a rotating ad URL when a chapter link is clicked
 *   (`.chapteritem`, `#nextchaptera`, `#prevchaptera`). Not handled yet.
 *
 * `m.baozimh.one` (branded Bun漫畫) serves this same front end; the bare
 * `baozimh.one` is an unrelated news site, hence no wildcard there.
 * `www.baozimh.org` 301s to the apex, covered by the wildcard anyway.
 * All domains: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'baozimh',
  label: '包子漫畫',
  matches: ['*://*.baozimh.org/*', '*://*.bzmh.org/*', '*://m.baozimh.one/*'],
});

export function run() {
  // Class only, no tag — the ad containers are injected by the
  // page's own scripts and are not always <div>.
  // Not present in a headless probe on 2026-10-07 (desktop or mobile UA);
  // likely injected by the ad SDK only for real browsers / some regions.
  // Re-check on a real browser before relying on or removing these.
  keepHidden('.baozi-ad', '.mobadsq');
  // 「點擊繼續閱讀」之類的按鈕，出現就按一次。
  clickOnAppear('.pure-button', 500);
}
