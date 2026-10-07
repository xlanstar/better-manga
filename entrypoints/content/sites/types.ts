import type { SiteFeatures } from '@/utils/settings';

/**
 * One site = one file in this folder, default-exporting a `Site`.
 *
 * - `matches`: content script match patterns (these feed the manifest).
 * - `features`: site defaults / adapters for shared reading features
 *   (see `utils/settings.ts`). Omit to use the global defaults; set a feature
 *   to `false` if it doesn't fit this site.
 * - `run`: site fixes only this site needs (ads, hijacks, …). Runs
 *   synchronously at document_start on every matching page/frame; wrap DOM
 *   work in `onDomReady()` from `utils/dom`.
 */
export type Site = {
  name: string;
  /** Human-readable name, shown in the popup. */
  label: string;
  matches: string[];
  features?: SiteFeatures;
  run?: () => void;
};
