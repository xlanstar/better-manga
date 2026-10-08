import type { SectionFeatures, SiteFeatures } from '@/features/settings';

/**
 * A site (adding one: see AGENTS.md).
 *
 * - `matches`: content script match patterns (these feed the manifest).
 * - `features`: site defaults / adapters (this site's selectors, URL rules,
 *   …), keyed by feature id; what `false` and a missing entry mean is in
 *   `features/settings.ts`. Leave it out for only the shared features, with
 *   the global defaults.
 * - `sections`: where the main site and the reader need different adapters
 *   (see `SiteSections`). Leave it out when one config fits every page.
 */
export type Site<Name extends string = string> = {
  name: Name;
  /** Human-readable name, shown in the popup. */
  label: string;
  matches: string[];
  features?: SiteFeatures;
  sections?: SiteSections;
};

export type SiteSection = keyof SiteSections;

/**
 * A site's main site (catalogue, works pages) and reader (chapter pages),
 * however it routes them (subdomain or path). Each section's `features` are
 * merged over `Site.features`, feature by feature: its fields win, except
 * lists (selectors, …), which add to the site's; `false` turns the feature
 * off there. They are still one site to the user, with one switch per
 * feature.
 */
export type SiteSections = {
  /** Every page the reader's patterns don't match. */
  main?: { features: SectionFeatures };
  reader?: {
    /** Match patterns for the reader's pages, within `Site.matches`; paths allowed. */
    matches: string[];
    features: SectionFeatures;
  };
};

/**
 * Identity helper that keeps `name` as a literal type, so `SiteName` is a
 * union of the registered names.
 */
export const defineSite = <const Name extends string>(site: Site<Name>) => site;
