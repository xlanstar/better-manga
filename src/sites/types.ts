import type { SiteFeatures } from '@/features/settings';

/**
 * One site = one file in this folder exporting `site = defineSite({ … })`,
 * registered in `sites/index.ts`. Everything the site needs is a feature
 * (`features/`), so the user can turn it off:
 *
 * - `matches`: content script match patterns (these feed the manifest).
 * - `features`: site defaults / adapters, keyed by feature id (layering in
 *   `features/settings.ts`). Shared reading features apply unless set to
 *   `false`; site-specific ones (ad blocking, auto-continue, …) only when
 *   configured here, with this site's selectors and URL rules. `{}` = only
 *   the shared features, with the global defaults.
 */
export type Site<Name extends string = string> = {
  name: Name;
  /** Human-readable name, shown in the popup. */
  label: string;
  matches: string[];
  features: SiteFeatures;
};

/**
 * Identity helper that keeps `name` as a literal type, so `SiteName` is a
 * union of the registered names.
 */
export const defineSite = <const Name extends string>(site: Site<Name>) => site;
