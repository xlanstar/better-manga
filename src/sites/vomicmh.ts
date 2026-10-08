import { defineSite } from './types';

/**
 * vomic漫: own Next.js front end.
 *
 * - Routes: works `/detail/<id>`, chapter `/chapter/<id>/<cid>`.
 * - Reader: chapter pages show only 「请先登录」 (log in first) without an
 *   account, so it couldn't be inspected; no site config.
 * - Domains: the bare host serves the same site. Full list:
 *   docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'vomicmh',
  label: 'vomic漫',
  matches: ['*://www.vomicmh.com/*', '*://vomicmh.com/*'],
});
