import { defineSite } from './types';

/**
 * 92漫畫: no site config, only the shared features.
 *
 * - Not inspected: every page (apex and `www.`) is behind a Cloudflare
 *   challenge that headless and headed Chromium don't pass.
 * - Domains: only `www.` is matched (`m.92mh.com` points elsewhere and
 *   doesn't answer). Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: '92mh',
  label: '92漫畫',
  matches: ['*://www.92mh.com/*'],
});
