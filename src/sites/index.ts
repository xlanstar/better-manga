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

/**
 * The site whose match patterns cover `url`; `null` for anything unparsable.
 * At most one does: sites never share a host (enforced by the registry test).
 * Only the sites listing one of the URL's host suffixes are checked, so the
 * lookup doesn't grow with the registry.
 */
export function siteFor(url: string): Site<SiteName> | null {
  const parsed = matchableUrl(url);
  if (!parsed) return null;
  const index = sitesByHost();
  const candidates = hostSuffixes(parsed.hostname).flatMap((host) => index.get(host) ?? []);
  return candidates.find((site) => matchesAny(site.matches, parsed.href)) ?? null;
}

let hostIndex: Map<string, Site<SiteName>[]> | undefined;

/** Sites by the hosts their patterns name (`siteHosts`), built on first use. */
function sitesByHost(): Map<string, Site<SiteName>[]> {
  if (hostIndex) return hostIndex;
  const index = new Map<string, Site<SiteName>[]>();
  for (const site of sites) {
    for (const host of siteHosts(site)) index.set(host, [...(index.get(host) ?? []), site]);
  }
  return (hostIndex = index);
}

/**
 * The keys a pattern covering `hostname` is indexed under: the host itself,
 * each parent domain (`*.` patterns) and `*` (any host).
 * `m.bzmh.org` → `m.bzmh.org`, `bzmh.org`, `org`, `*`.
 */
function hostSuffixes(hostname: string): string[] {
  const labels = hostname.split('.');
  return [...labels.map((_, i) => labels.slice(i).join('.')), '*'];
}

/** Parsed patterns by their source list, so each list is parsed once. */
const parsedPatterns = new WeakMap<readonly string[], MatchPattern[]>();

function matchesAny(patterns: readonly string[], href: string): boolean {
  let parsed = parsedPatterns.get(patterns);
  if (!parsed) {
    parsed = patterns.map((pattern) => new MatchPattern(pattern));
    parsedPatterns.set(patterns, parsed);
  }
  return parsed.some((pattern) => pattern.includes(href));
}

/**
 * Which section of `site` `url` is on: the reader when its patterns match,
 * else the main site. A frame matched by its ancestor's origin only (see
 * `utils/site-url`) has no path, so it counts as the main site unless the
 * reader has a host of its own.
 */
export function sectionFor(site: Site, url: string): SiteSection {
  const parsed = matchableUrl(url);
  const reader = site.sections?.reader?.matches;
  return parsed && reader && matchesAny(reader, parsed.href) ? 'reader' : 'main';
}

/**
 * Whether a frame must follow its URL to keep its section current, as
 * client-side navigation can move a page between the main site and the
 * reader without a load. Only on a site with a reader, and only for the top
 * frame's own http(s) URL: other frames may be matched by their ancestor's
 * origin, which has no path (see `utils/site-url`).
 */
export function followsSections(site: Site, protocol: string, isTopFrame: boolean): boolean {
  return isTopFrame && /^https?:$/.test(protocol) && Boolean(site.sections?.reader);
}

const SECTIONS: readonly SiteSection[] = ['main', 'reader'];

/**
 * The site layer on pages of `section`: `Site.features`, the section's on top.
 * Field by field, the section's wins, except lists (selectors, …): those add
 * to the site's.
 */
export function sectionFeatures(site: Site, section: SiteSection): SiteFeatures {
  const merged: Record<string, unknown> = { ...site.features };
  for (const [id, config] of Object.entries(site.sections?.[section]?.features ?? {})) {
    const base = merged[id];
    merged[id] = config && base ? mergeConfig(base, config) : (config ?? base);
  }
  return merged as SiteFeatures;
}

function mergeConfig(base: object, config: object): object {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(config)) {
    const below = merged[key];
    merged[key] = Array.isArray(below) && Array.isArray(value) ? [...below, ...value] : value;
  }
  return merged;
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
 * Pass its `href` to `includes()`, not the URL: that checks
 * `instanceof Location`, which doesn't exist in workers.
 */
function matchableUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.replace(/\.$/, '');
    return parsed;
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
