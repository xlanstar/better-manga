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

  if (!isAlive()) return;
  // Watch before loading so a change made while the load is in flight isn't
  // lost. A watcher value is always newer than the load result, so once it has
  // fired the (possibly slow) load must not overwrite it.
  let watched = false;
  try {
    onRetire(
      watchUserSettings(site.name, (user) => {
        watched = true;
        apply(user);
      }),
    );
  } catch {
    // storage unavailable — the load below falls back to defaults
  }
  loadUserSettings(site.name)
    .catch(() => ({})) // storage unavailable — fall back to defaults
    .then((user) => {
      if (!watched) apply(user);
    });
}
