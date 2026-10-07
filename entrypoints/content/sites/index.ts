import type { Site } from './types';
import baozimh from './baozimh';
import gmh from './g-mh';
import hipmh from './hipmh';

/** Registry — add a file next to this one, then one line here. */
export const sites: Site[] = [baozimh, gmh, hipmh];

export type { Site };

export const allMatches = sites.flatMap((s) => s.matches);

/** Sites whose match patterns cover `url`. */
export function sitesFor(url: string): Site[] {
  return sites.filter((s) => s.matches.some((p) => matchPattern(p).test(url)));
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
