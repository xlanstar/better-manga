import { MatchPattern } from 'wxt/utils/match-patterns';
import type { Site, SiteSection } from './types';
import { site as comic18 } from './18comic';
import { site as mh18 } from './18mh';
import { site as kkk1 } from './1kkk';
import { site as comic8 } from './8comic';
import { site as mh92 } from './92mh';
import { site as baozimh } from './baozimh';
import { site as baozimhCom } from './baozimh-com';
import { site as bilimanga } from './bilimanga';
import { site as cmanhua } from './cmanhua';
import { site as colamanga } from './colamanga';
import { site as copymanga } from './copymanga';
import { site as dm5 } from './dm5';
import { site as dogemanga } from './dogemanga';
import { site as favcomic } from './favcomic';
import { site as gmh } from './g-mh';
import { site as gfmh } from './gfmh';
import { site as guazimanhua } from './guazimanhua';
import { site as hanime1 } from './hanime1';
import { site as hipmh } from './hipmh';
import { site as komiic } from './komiic';
import { site as liumanhua } from './liumanhua';
import { site as manben } from './manben';
import { site as mangabz } from './mangabz';
import { site as manhuagui } from './manhuagui';
import { site as manhuaren } from './manhuaren';
import { site as manwa } from './manwa';
import { site as mh160mh } from './mh160mh';
import { site as mhua5 } from './mhua5';
import { site as miaoqumh } from './miaoqumh';
import { site as mycomic } from './mycomic';
import { site as noyacg } from './noyacg';
import { site as relamanhua } from './relamanhua';
import { site as roumanwu } from './roumanwu';
import { site as vomicmh } from './vomicmh';
import { site as wmh1234 } from './wmh1234';
import { site as wnacg } from './wnacg';
import { site as xmanhua } from './xmanhua';
import { site as ykmh } from './ykmh';
import { site as yymanhua } from './yymanhua';
import { site as zaimanhua } from './zaimanhua';

/**
 * Registry of sites — add a file next to this one, then one line here. Each
 * site's own logic is in its `features` and `sections` config (see `types.ts`).
 */
export const sites = [
  baozimh,
  gmh,
  mh18,
  hipmh,
  baozimhCom,
  copymanga,
  relamanhua,
  manhuagui,
  zaimanhua,
  dm5,
  kkk1,
  manhuaren,
  mangabz,
  xmanhua,
  yymanhua,
  komiic,
  comic8,
  colamanga,
  manwa,
  favcomic,
  dogemanga,
  guazimanhua,
  liumanhua,
  mycomic,
  vomicmh,
  ykmh,
  mhua5,
  miaoqumh,
  wmh1234,
  mh160mh,
  mh92,
  cmanhua,
  bilimanga,
  gfmh,
  manben,
  comic18,
  wnacg,
  noyacg,
  hanime1,
  roumanwu,
];

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
