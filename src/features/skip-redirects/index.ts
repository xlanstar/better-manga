import type { Feature } from '../types';

/**
 * Point links that go through redirect pages straight at their target, right
 * before the browser follows them. A chain of cross-site redirects reveals
 * the browser toolbar in fullscreen (and gives ad scripts a hook).
 * Site-specific: each site supplies its own URL rule.
 */

export type SkipRedirectsSiteConfig = {
  /**
   * The direct URL for a link's `href` on a page at `origin`, or `null` to
   * leave the link alone. Pure, so it can be unit tested in the site file.
   */
  rewriteLink?: (href: string, origin: string) => string | null;
};

export const skipRedirects: Feature<SkipRedirectsSiteConfig> = {
  defaults: { enabled: true },
  siteSpecific: true,
  isUsable: ({ rewriteLink }) => typeof rewriteLink === 'function',
};
