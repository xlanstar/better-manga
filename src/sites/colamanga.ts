import { defineSite } from './types';

/**
 * COLAMANGA: no site config, only the shared features.
 *
 * - Routes: works `/manga-<id>/`, chapter `/manga-<id>/<n>/<n>.html`
 *   (archive.org). Assets and covers on `res.yoyomanga.com`.
 * - Not inspected: only the (cached) home page loaded; every other page
 *   answered Cloudflare 522 / 523 (origin unreachable).
 * - Domains: `www.colamanga.com` (and its apex) redirects to
 *   `www.yoyomanga.com`; the 發布頁 `acloudmerge.com` links only that. The
 *   apex `yoyomanga.com` answers 523. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'colamanga',
  label: 'COLAMANGA',
  matches: ['*://www.yoyomanga.com/*'],
});
