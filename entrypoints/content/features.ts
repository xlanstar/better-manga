import { featureIds, type FeatureId } from '@/features';
import { featureStarters } from '@/features/runtime';
import type { Site } from '@/sites';
import { isAlive, onRetire } from '@/utils/lifecycle';
import {
  loadUserSettings,
  resolveFeatures,
  watchUserSettings,
  type ResolvedFeatures,
  type UserSiteSettings,
} from '@/utils/settings';

/**
 * Wire up the shared reading features for `site`. Listeners are installed
 * synchronously and read the effective settings on use, so user changes in
 * the popup apply without a reload. Until storage has loaded, features stay off.
 * An orphaned instance (see `utils/lifecycle`) stops acting and watching.
 */
export function startFeatures(site: Site) {
  let current: ResolvedFeatures | null = null;

  // Generic so TS ties each starter to its own feature's settings type.
  const start = <K extends FeatureId>(id: K) => {
    // `false` = the feature doesn't fit this site; don't install it at all.
    if (site.features?.[id] === false) return;
    onRetire(featureStarters[id](() => (isAlive() ? (current?.[id] ?? null) : null)));
  };
  for (const id of featureIds) start(id);

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
