import { MatchPattern } from 'wxt/utils/match-patterns';
import type { Site } from './types';
import { site as baozimh } from './baozimh';
import { site as gmh } from './g-mh';
import { site as hipmh } from './hipmh';

/**
 * Registry of site metadata — add a file next to this one, then one line here
 * (and one in `fixes.ts`). Imports only each file's `site` export, so the
 * popup doesn't bundle site fixes.
 */
export const sites = [baozimh, gmh, hipmh];

export type { Site } from './types';
export type SiteName = (typeof sites)[number]['name'];

export const allMatches = sites.flatMap((s) => s.matches);

// Parsed once; an invalid pattern throws here, i.e. already at build time
// (WXT evaluates the content script's `matches`).
const sitePatterns = sites.map((s) => s.matches.map((p) => new MatchPattern(p)));

/** Sites whose match patterns cover `url`; none for anything unparsable. */
export function sitesFor(url: string): typeof sites {
  try {
    const parsed = new URL(url);
    // Chrome matches `example.com.` (fully-qualified, trailing dot) like
    // `example.com` and injects there; the library doesn't.
    parsed.hostname = parsed.hostname.replace(/\.$/, '');
    // A string, not the URL: `includes()` checks `instanceof Location`, which
    // doesn't exist in workers.
    const href = parsed.href;
    return sites.filter((_, i) => sitePatterns[i]?.some((pattern) => pattern.includes(href)));
  } catch {
    // Unparsable URL (the popup passes any tab URL). `includes()` would also
    // throw for `ftp://` / `urn:` patterns, should one ever be added.
    return [];
  }
}

/** Hosts a site covers, for display: `*://*.baozimh.org/*` → `baozimh.org`. */
export function siteHosts(site: Site): string[] {
  return [...new Set(site.matches.map(patternHost))];
}

function patternHost(pattern: string): string {
  return pattern
    .replace(/^[^:]+:\/\//, '') // scheme
    .replace(/^\*\./, '') // subdomain wildcard
    .replace(/\/.*$/, ''); // path
}
