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
import { startSmoothScroll } from './smooth-scroll/start';
import { resolveFeatures, type ResolvedFeatures } from './settings';
import { subscribeStoredSettings } from './settings-storage';
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
  smoothScroll: startSmoothScroll,
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
 *
 * Never throws, so the content script needs no guard of its own: a feature
 * that throws is logged and skipped, and without storage the features keep
 * the site defaults.
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

  if (!isAlive()) return;
  try {
    const unsubscribe = subscribeStoredSettings([site.name], (stored) => {
      // Also notices the extension being gone, which aborts `lifetime`.
      if (!isAlive()) return;
      if (stored.disabledSites.has(site.name)) return retire();
      runAll(resolveFeatures(site.features, stored.global, stored.bySite[site.name]));
    });
    lifetime.addEventListener('abort', unsubscribe, { once: true });
  } catch (err) {
    // `browser.storage` can be missing or throw synchronously.
    console.debug(`[better-manga] ${site.name} settings unavailable`, err);
  }
}
