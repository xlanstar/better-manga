import type { Feature } from '../types';

/**
 * Hide ad slots and remove the nodes ad scripts hook into, on sites that list
 * them. Site-specific: each site names its own selectors.
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side, registered in `features/starters.ts`.
 * - Popup group: in `features/controls.ts`; title and description: in the
 *   locales (`<id>.title`, `<id>.description`).
 */

export type BlockAdsSiteConfig = {
  /** Hidden with a stylesheet, now and later (ad slots, banners). */
  hide?: string[];
  /**
   * Removed as soon as the parser inserts them, before the page's deferred
   * scripts run (e.g. a config node an ad-redirect script reads).
   */
  remove?: string[];
};

export const blockAds: Feature<BlockAdsSiteConfig> = {
  defaults: { enabled: true },
  siteSpecific: true,
  isUsable: ({ hide = [], remove = [] }) => hide.length + remove.length > 0,
};
