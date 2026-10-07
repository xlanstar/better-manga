import type { Site } from './types';
import { site as baozimh } from './baozimh';
import { site as gmh } from './g-mh';
import { site as hipmh } from './hipmh';

/**
 * Registry of site metadata — add a file next to this one, then one line here
 * (and one in `runtime.ts`). Imports only each file's `site` export, so the
 * popup doesn't bundle site fixes.
 */
export const sites = [baozimh, gmh, hipmh];

export type { Site } from './types';
export type SiteName = (typeof sites)[number]['name'];

export const allMatches = sites.flatMap((s) => s.matches);

/** Sites whose match patterns cover `url`. */
export function sitesFor(url: string): typeof sites {
  return sites.filter((s) => s.matches.some((p) => matchPattern(p).test(url)));
}

/** `*://*.baozimh.org/*` → `baozimh.org`, for display. */
export function siteHosts(site: Site): string {
  const hosts = site.matches.map((p) =>
    p
      .replace(/^[^:]+:\/\//, '')
      .replace(/^\*\./, '')
      .replace(/\/.*$/, ''),
  );
  return [...new Set(hosts)].join('、');
}

// Enough of the match-pattern grammar for our own patterns.
// Swap in `browser.runtime.getManifest()` parsing only if patterns get exotic.
function matchPattern(pattern: string): RegExp {
  const [scheme = '*', rest = ''] = pattern.split('://');
  const slash = rest.indexOf('/');
  const host = slash === -1 ? rest : rest.slice(0, slash);
  const path = slash === -1 ? '/*' : rest.slice(slash);
  const esc = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // `*.example.com` also matches the bare `example.com`, per the spec.
  const hostRe = host.startsWith('*.')
    ? `(?:[^/]+\\.)?${esc(host.slice(2))}`
    : esc(host).replace(/\*/g, '[^/]*');
  return new RegExp(
    `^${scheme === '*' ? 'https?' : esc(scheme)}://${hostRe}${esc(path).replace(/\*/g, '.*')}$`,
  );
}
