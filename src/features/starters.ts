/**
 * Content-script side of the features, kept out of `index.ts` so the popup
 * doesn't bundle it.
 */
import type { Site } from '@/sites';
import { isAlive, lifetimeSignal, retire } from '@/utils/lifecycle';
import { startAutoContinue } from './auto-continue/start';
import { startBlockAds } from './block-ads/start';
import { featureIds, type FeatureId, type FeatureResolvedConfig } from './index';
import { startPageScroll } from './page-scroll/start';
import { createFeatureRunner } from './runner';
import { startSkipRedirects } from './skip-redirects/start';
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
  blockAds: startBlockAds,
  skipRedirects: startSkipRedirects,
  autoContinue: startAutoContinue,
  pageScroll: startPageScroll,
};

/**
 * Wire up the features for `site`. They start synchronously (some must beat
 * the page's own scripts) with the site's defaults, then restart with the
 * user settings once storage has loaded and whenever they change, so popup
 * changes apply without a reload (see `runner.ts`). An orphaned instance (see
 * `utils/lifecycle`) stops acting and watching: everything is tied to its
 * lifetime signal.
 *
 * If the user disabled the site (or a feature), it stops once storage answers;
 * on a disabled site the whole instance retires. So it may act for the first
 * few milliseconds of a page load.
 */
export function startFeatures(site: Site) {
  const lifetime = lifetimeSignal();
  const defaults = resolveFeatures(site.features);

  // Generic so TS ties each starter to its own feature's config type.
  const createRunner = <K extends FeatureId>(id: K) => {
    const update = createFeatureRunner(featureStarters[id], lifetime);
    return (resolved: ResolvedFeatures) => {
      try {
        update(resolved[id]);
      } catch (err) {
        // Never break the host page, or the other features, over one of them.
        console.debug(`[better-manga] ${site.name} ${id} failed`, err);
      }
    };
  };
  // `null` = the feature doesn't fit this site; don't install it at all.
  const runners = featureIds.filter((id) => defaults[id]).map(createRunner);
  const runAll = (resolved: ResolvedFeatures) => {
    for (const run of runners) run(resolved);
  };
  runAll(defaults);

  let global: UserSettings = {};
  let override: UserSettings = {};
  const apply = (change: StoredSettingsChange) => {
    if (change.disabledSites?.has(site.name)) return retire();
    if (change.global) global = change.global;
    if (change.bySite && site.name in change.bySite) override = change.bySite[site.name] ?? {};
    runAll(resolveFeatures(site.features, global, override));
  };

  if (!isAlive()) return;
  // Watch before loading so a change made while the load is in flight isn't
  // lost. A watched value is always newer than the load result, so the
  // (possibly slow) load must not overwrite what has arrived since.
  const watchedKeys = new Set<keyof StoredSettingsChange>();
  try {
    const unwatch = watchStoredSettings([site.name], (change) => {
      for (const key of Object.keys(change)) watchedKeys.add(key as keyof StoredSettingsChange);
      apply(change);
    });
    lifetime.addEventListener('abort', unwatch, { once: true });
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
