/**
 * Content-script side of the features, kept out of `index.ts` so the popup
 * doesn't bundle it.
 */
import type { Site } from '@/sites';
import { isAlive, onRetire } from '@/utils/lifecycle';
import { featureIds, type FeatureId, type FeatureResolvedConfig } from './index';
import { startPageScroll } from './page-scroll/start';
import { resolveFeatures, type ResolvedFeatures, type UserSettings } from './settings';
import { loadUserSettings, watchUserSettings } from './settings-storage';
import type { FeatureStart } from './types';

/**
 * How to start each feature. Typed over every `FeatureId`, so a new feature
 * can't be forgotten here.
 */
export const featureStarters: { [K in FeatureId]: FeatureStart<FeatureResolvedConfig<K>> } = {
  pageScroll: startPageScroll,
};

/**
 * Wire up the shared reading features for `site`. Listeners are installed
 * synchronously and read the effective settings on use, so user changes in
 * the popup apply without a reload. Until storage has loaded, features stay off.
 * An orphaned instance (see `utils/lifecycle`) stops acting and watching.
 */
export function startFeatures(site: Site) {
  let resolved: ResolvedFeatures | null = null;
  const applyUserSettings = (user: UserSettings) => {
    resolved = resolveFeatures(site.features, user);
  };

  // Generic so TS ties each starter to its own feature's config type.
  const startFeature = <K extends FeatureId>(id: K) => {
    // `false` = the feature doesn't fit this site; don't install it at all.
    if (site.features?.[id] === false) return;
    const getConfig = () => (isAlive() ? (resolved?.[id] ?? null) : null);
    onRetire(featureStarters[id](getConfig));
  };
  for (const id of featureIds) startFeature(id);

  if (!isAlive()) return;
  // Watch before loading so a change made while the load is in flight isn't
  // lost. A watched value is always newer than the load result, so once one
  // has arrived the (possibly slow) load must not overwrite it.
  let hasWatchedValue = false;
  try {
    onRetire(
      watchUserSettings(site.name, (user) => {
        hasWatchedValue = true;
        applyUserSettings(user);
      }),
    );
  } catch {
    // storage unavailable — the load below falls back to defaults
  }
  loadUserSettings(site.name)
    .catch(() => ({})) // storage unavailable — fall back to defaults
    .then((user) => {
      if (!hasWatchedValue) applyUserSettings(user);
    });
}
