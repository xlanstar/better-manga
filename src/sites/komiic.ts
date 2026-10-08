import { defineSite } from './types';

/**
 * Komiic: Vue single-page app, GraphQL API `/api/query`.
 *
 * - Routes (from its bundle): works `/comic/<id>`, chapter
 *   `/comic/<id>/chapter/<chapter>/page/<n>` or `…/images/all`.
 * - Every page but the login / register ones sends a visitor without the
 *   `komiic-access-token` cookie to `/login`, so the reader couldn't be
 *   inspected: only the shared features apply.
 * - Domains: `www.komiic.cc` serves the same app; `www.komiic.com` is a
 *   404. Full list: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'komiic',
  label: 'Komiic',
  matches: ['*://komiic.com/*', '*://komiic.cc/*', '*://www.komiic.cc/*'],
});
