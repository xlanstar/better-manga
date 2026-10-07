import type { SectionFeatures, SiteFeatures } from '@/features/settings';

/**
 * One site = one file in this folder exporting `site = defineSite({ … })`,
 * registered in `sites/index.ts`. Everything the site needs is a feature
 * (`features/`), so the user can turn it off:
 *
 * - `matches`: content script match patterns (these feed the manifest).
 * - `features`: site defaults / adapters, keyed by feature id (layering in
 *   `features/settings.ts`). Shared reading features apply unless set to
 *   `false`; site-specific ones (ad blocking, auto-continue, …) only when
 *   configured here, with this site's selectors and URL rules. Leave it out
 *   for only the shared features, with the global defaults.
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
 * merged over `Site.features`, feature by feature: its fields win, `false`
 * turns the feature off there. They are still one site to the user, with
 * one switch per feature.
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
