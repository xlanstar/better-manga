/**
 * Content-script side of the features, kept out of `index.ts` so the popup
 * doesn't bundle it.
 */
import type { Site } from '@/sites';
import { isAlive, onRetire, retire } from '@/utils/lifecycle';
import { featureIds, type FeatureId, type FeatureResolvedConfig } from './index';
import { startPageScroll } from './page-scroll/start';
import { resolveFeatures, type ResolvedFeatures, type UserSettings } from './settings';
import {
  loadStoredSettings,
  watchStoredSettings,
  type StoredSettings,
  type StoredSettingsChange,
} from './settings-storage';
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
 *
 * If the user disabled the site, the whole instance retires (site fixes too,
 * as they also clean up on retire). Fixes run before storage can answer, so
 * on a disabled site they act for the first few milliseconds of a page load.
 */
export function startFeatures(site: Site) {
  let resolved: ResolvedFeatures | null = null;
  let global: UserSettings = {};
  let override: UserSettings = {};
  const apply = (change: StoredSettingsChange) => {
    if (change.disabledSites?.has(site.name)) return retire();
    if (change.global) global = change.global;
    if (change.bySite && site.name in change.bySite) override = change.bySite[site.name] ?? {};
    resolved = resolveFeatures(site.features, global, override);
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
  // lost. A watched value is always newer than the load result, so the
  // (possibly slow) load must not overwrite what has arrived since.
  const watchedKeys = new Set<keyof StoredSettingsChange>();
  try {
    onRetire(
      watchStoredSettings([site.name], (change) => {
        for (const key of Object.keys(change)) watchedKeys.add(key as keyof StoredSettingsChange);
        apply(change);
      }),
    );
  } catch {
    // storage unavailable — the load below falls back to defaults
  }
  loadStoredSettings([site.name])
    .catch((): StoredSettings => ({ global: {}, bySite: {}, disabledSites: new Set() }))
    .then((stored) => {
      if (!isAlive()) return;
      const fresh: StoredSettingsChange = {};
      if (!watchedKeys.has('global')) fresh.global = stored.global;
      if (!watchedKeys.has('bySite'))
        fresh.bySite = { [site.name]: stored.bySite[site.name] ?? {} };
      if (!watchedKeys.has('disabledSites')) fresh.disabledSites = stored.disabledSites;
      apply(fresh);
    });
}
