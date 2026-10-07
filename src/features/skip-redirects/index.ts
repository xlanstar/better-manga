import { sanitizeToggle, type ToggleUserConfig } from '../toggle';
import type { Feature } from '../types';

/**
 * Point links that go through redirect pages straight at their target, right
 * before the browser follows them. A chain of cross-site redirects reveals
 * the browser toolbar in fullscreen (and gives ad scripts a hook).
 * Site-specific: each site supplies its own URL rule.
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side, registered in `features/starters.ts`.
 * - `controls.tsx`: popup controls, registered in `features/controls.ts`.
 */

export type SkipRedirectsSiteConfig = {
  /**
   * The direct URL for a link's `href` on a page at `origin`, or `null` to
   * leave the link alone. Pure, so it can be unit tested in the site file.
   */
  rewriteLink?: (href: string, origin: string) => string | null;
};
export type SkipRedirectsUserConfig = ToggleUserConfig;
export type SkipRedirectsResolvedConfig = SkipRedirectsSiteConfig & { enabled: boolean };

export const skipRedirects: Feature<
  SkipRedirectsSiteConfig,
  SkipRedirectsUserConfig,
  SkipRedirectsResolvedConfig
> = {
  defaults: { enabled: true },
  sanitize: sanitizeToggle,
  siteSpecific: true,
};
