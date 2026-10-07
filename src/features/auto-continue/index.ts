import type { Feature } from '../types';

/**
 * Click buttons like 「點擊繼續閱讀」 (click to continue reading) once each,
 * as they appear. Site-specific: each site names its button.
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side, registered in `features/starters.ts`.
 * - Popup title and description: in `features/controls.ts`.
 */

export type AutoContinueSiteConfig = {
  /** The button(s) to click. */
  selector?: string;
};
export type AutoContinueResolvedConfig = AutoContinueSiteConfig & { enabled: boolean };

export const autoContinue: Feature<AutoContinueSiteConfig, AutoContinueResolvedConfig> = {
  defaults: { enabled: true },
  siteSpecific: true,
  isUsable: ({ selector }) => !!selector?.trim(),
};
