import { isAlive, onRetire } from '@/utils/lifecycle';
import { overridePageKeyScroll } from '@/utils/scroll';
import {
  loadUserSettings,
  resolveFeatures,
  watchUserSettings,
  type ResolvedFeatures,
  type UserSiteSettings,
} from '@/utils/settings';
import type { Site } from './sites';

/**
 * Wire up the shared reading features for `site`. Listeners are installed
 * synchronously and read the effective settings on use, so user changes in
 * the popup apply without a reload. Until storage has loaded, features stay off.
 * An orphaned instance (see `utils/lifecycle`) stops acting and watching.
 */
export function startFeatures(site: Site) {
  let current: ResolvedFeatures | null = null;

  if (site.features?.pageScroll !== false) {
    const stop = overridePageKeyScroll(() => {
      if (!isAlive()) return null;
      const s = current?.pageScroll;
      return s?.enabled ? s : null;
    });
    onRetire(stop);
  }

  const apply = (user: UserSiteSettings) => {
    current = resolveFeatures(site.features, user);
  };
  loadUserSettings(site.name)
    .then(apply)
    .catch(() => apply({})) // storage unavailable — fall back to defaults
    .finally(() => {
      if (isAlive()) onRetire(watchUserSettings(site.name, apply));
    });
}
