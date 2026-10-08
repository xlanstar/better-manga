import { siteFor, siteHosts } from './index';
import type { Site } from './types';

/**
 * A site search: matches a site whose label, name or one of its hosts
 * contains `query` (case-insensitive), or that covers `query` as a URL / host
 * (`https://m.bzmh.org/manga/x`, `m.bzmh.org`). A blank query matches all.
 * The URL is looked up here, once per query, not once per site filtered.
 */
export function siteSearch(query: string): (site: Site) => boolean {
  const q = query.trim().toLowerCase();
  if (!q) return () => true;
  const url = /^[a-z][a-z\d+.-]*:\/\//.test(q) ? q : `https://${q}`;
  const covering = q.includes('.') ? siteFor(url)?.name : undefined;
  return (site) =>
    site.name === covering ||
    [site.label, site.name, ...siteHosts(site)].some((s) => s.toLowerCase().includes(q));
}
