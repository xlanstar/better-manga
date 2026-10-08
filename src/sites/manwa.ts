import { defineSite } from './types';

/**
 * 漫蛙: no site config, only the shared features.
 *
 * - Not inspected: from Taiwan every page answers 404 (`manwa.me` after its
 *   Cloudflare challenge, and the backup hosts); only static files load.
 *   Works were at `/book/<id>` (archive.org).
 * - Domains: the 走失頁 `mwmissing11.cc` lists `manwa.me` and a backup,
 *   `fuwbn.cc/mw666`, which picks the first of `manward.cc`, `manwarp.cc`,
 *   `manwaro.cc`, `manwarj.cc` that serves `/static/upload2/11.png` (the
 *   same file on all five hosts). The 走失頁, the redirector and the APP page
 *   `manwaxzba.cc` aren't matched. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'manwa',
  label: '漫蛙',
  matches: [
    '*://*.manwa.me/*',
    '*://*.manward.cc/*',
    '*://*.manwarp.cc/*',
    '*://*.manwaro.cc/*',
    '*://*.manwarj.cc/*',
  ],
});
