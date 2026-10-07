import type { SiteFeatures } from '@/features/settings';

/**
 * One site = one file in this folder with two named exports, kept apart so the
 * popup can import a site's metadata without bundling its fixes:
 *
 * - `site = defineSite({ … })`: metadata, registered in `sites/index.ts`.
 *   - `matches`: content script match patterns (these feed the manifest).
 *   - `features`: site defaults / adapters for shared reading features
 *     (`features/`, layering in `features/settings.ts`), keyed by feature id.
 *     Omit to use the global defaults; set a feature to `false` if it doesn't
 *     fit this site.
 * - `run()` (optional): site fixes only this site needs (ads, hijacks, …),
 *   registered in `sites/fixes.ts`. Runs synchronously at document_start on
 *   every matching page/frame; wrap DOM work in `onDomReady()` from `utils/dom`.
 */
export type Site<Name extends string = string> = {
  name: Name;
  /** Human-readable name, shown in the popup. */
  label: string;
  matches: string[];
  features?: SiteFeatures;
};

/**
 * Identity helper that keeps `name` as a literal type, so the registries can
 * be keyed by site name and a missing entry is a compile error.
 */
export const defineSite = <const Name extends string>(site: Site<Name>) => site;
