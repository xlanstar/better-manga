import { MatchPattern } from 'wxt/utils/match-patterns';
import type { FeatureId } from '@/features';
import type { SiteFeatures } from '@/features/settings';
import type { Site, SiteSection } from './types';
import { site as baozimh } from './baozimh';
import { site as gmh } from './g-mh';
import { site as hipmh } from './hipmh';

/**
 * Registry of sites — add a file next to this one, then one line here. Each
 * site's own logic is in its `features` and `sections` config (see `types.ts`).
 */
export const sites = [baozimh, gmh, hipmh];

export type { Site, SiteSection } from './types';
export type SiteName = (typeof sites)[number]['name'];

export const allMatches = sites.flatMap((s) => s.matches);

// Parsed once; an invalid pattern throws here, i.e. already at build time
// (WXT evaluates the content script's `matches`).
const sitePatterns = sites.map((s) => s.matches.map((p) => new MatchPattern(p)));

/**
 * The site whose match patterns cover `url`; `null` for anything unparsable.
 * At most one does: sites never share a host (enforced by the registry test).
 */
export function siteFor(url: string): Site<SiteName> | null {
  const href = matchableHref(url);
  if (!href) return null;
  return sites.find((_, i) => sitePatterns[i]?.some((pattern) => pattern.includes(href))) ?? null;
}

/**
 * Which section of `site` `url` is on: the reader when its patterns match,
 * else the main site. A frame matched by its ancestor's origin only (see
 * `utils/site-url`) has no path, so it counts as the main site unless the
 * reader has a host of its own.
 */
export function sectionFor(site: Site, url: string): SiteSection {
  const href = matchableHref(url);
  const reader = site.sections?.reader?.matches ?? [];
  return href && reader.some((p) => new MatchPattern(p).includes(href)) ? 'reader' : 'main';
}

const SECTIONS: readonly SiteSection[] = ['main', 'reader'];

/** The site layer on pages of `section`: `Site.features`, the section's on top. */
export function sectionFeatures(site: Site, section: SiteSection): SiteFeatures {
  const merged: Record<string, unknown> = { ...site.features };
  for (const [id, config] of Object.entries(site.sections?.[section]?.features ?? {})) {
    const base = merged[id];
    merged[id] = config && base ? { ...base, ...config } : (config ?? base);
  }
  return merged as SiteFeatures;
}

/**
 * The site layer the user settings are shown and pruned against, as they
 * cover every section: each feature as the first section that configures it,
 * so it is listed if it applies anywhere. Sections set no user options, so
 * the defaults agree whichever section it comes from.
 */
export function settingsFeatures(site: Site): SiteFeatures {
  if (!site.sections) return site.features ?? {};
  const layers = SECTIONS.map((section) => sectionFeatures(site, section));
  const merged: Record<string, unknown> = {};
  for (const id of new Set(layers.flatMap(Object.keys)) as Set<FeatureId>) {
    const values = layers.map((layer) => layer[id]);
    // `undefined` (shared features apply) beats `false` (off) when none is configured.
    merged[id] = values.find(Boolean) ?? (values.includes(undefined) ? undefined : false);
  }
  return merged as SiteFeatures;
}

/**
 * `url` as match patterns should see it, `null` if unparsable (the popup
 * passes any tab URL). Chrome matches `example.com.` (fully-qualified,
 * trailing dot) like `example.com` and injects there; the library doesn't.
 * A string, not a URL: `includes()` checks `instanceof Location`, which
 * doesn't exist in workers.
 */
function matchableHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.replace(/\.$/, '');
    return parsed.href;
  } catch {
    return null;
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

/**
 * Whether `site` matches a search: its label, name or one of its hosts
 * contains `query` (case-insensitive), or `query` is a URL / host the site
 * covers (`https://m.bzmh.org/manga/x`, `m.bzmh.org`). A blank query matches.
 */
export function siteMatchesQuery(site: Site, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [site.label, site.name, ...siteHosts(site)].map((s) => s.toLowerCase());
  if (haystack.some((s) => s.includes(q))) return true;
  if (!q.includes('.')) return false;
  const url = /^[a-z][a-z\d+.-]*:\/\//.test(q) ? q : `https://${q}`;
  return siteFor(url)?.name === site.name;
}
