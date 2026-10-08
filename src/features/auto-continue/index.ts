import type { Feature } from '../types';

/**
 * Click buttons like 「點擊繼續閱讀」 (click to continue reading) once each,
 * as they appear. Site-specific: each site names its button.
 */

export type AutoContinueSiteConfig = {
  /** The button(s) to click. */
  selector?: string;
};

export const autoContinue: Feature<AutoContinueSiteConfig> = {
  defaults: { enabled: true },
  siteSpecific: true,
  isUsable: ({ selector }) => !!selector?.trim(),
};
