import { defineSite } from './types';

/**
 * NoyAcg, R18: no site config, only the shared features.
 *
 * - Front end: React single-page app.
 * - Routes (from its bundle): works `/manga/<id>`, reader
 *   `/reader/<bid>/<cid>`.
 * - Every page sends a visitor who isn't logged in to `/login`, so the
 *   reader couldn't be inspected.
 * - Domains: `www.noymanga.com` serves the same app. `noy1.top` is only a
 *   page that redirects to `noymanga.com` by script, so it isn't matched.
 *   Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'noyacg',
  label: 'NoyAcg',
  matches: ['*://noymanga.com/*', '*://www.noymanga.com/*'],
});
