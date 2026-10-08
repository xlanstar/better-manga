/**
 * Content-script side of the features, kept out of `index.ts` so the popup
 * doesn't bundle it.
 */
import type { Site, SiteSection } from '@/sites';
import { sectionFeatures, settingsFeatures } from '@/sites/layers';
import { isAlive, lifetimeSignal, retire } from '@/utils/lifecycle';
import { startAutoContinue } from './auto-continue/start';
import { startBlockAds } from './block-ads/start';
import { startFastLoad } from './fast-load/start';
import { featureIds, type FeatureId, type FeatureResolvedConfig } from './index';
import { startPageKeys } from './page-keys/start';
import { startReadingHistory } from './reading-history/start';
import { startReloadBrokenImages } from './reload-broken-images/start';
import { createFeatureRunner } from './runner';
import { startSkipRedirects } from './skip-redirects/start';
import { resolveFeatures, type ResolvedFeatures } from './settings';
import { subscribeStoredSettings, type StoredSettings } from './settings-storage';
import type { FeatureStart } from './types';

/**
 * How to start each feature. Typed over every `FeatureId`, so a new feature
 * can't be forgotten here.
 */
export const featureStarters: { [K in FeatureId]: FeatureStart<FeatureResolvedConfig<K>> } = {
  blockAds: startBlockAds,
  skipRedirects: startSkipRedirects,
  autoContinue: startAutoContinue,
  fastLoad: startFastLoad,
  reloadBrokenImages: startReloadBrokenImages,
  readingHistory: startReadingHistory,
  pageKeys: startPageKeys,
};

/**
 * Wire up the features for `site`, configured for the page's `section`. They
 * start synchronously (some must beat the page's own scripts) with the site's
 * defaults, then restart with the user settings once storage has loaded and
 * whenever they change, so popup changes apply without a reload (see
 * `runner.ts`). An orphaned instance (see `utils/lifecycle`) stops acting and
 * watching: everything is tied to its lifetime signal.
 *
 * Returns `setSection`, for when the page moves to another section without a
 * load (client-side navigation): the features restart with that section's
 * config, under the latest user settings.
 *
 * If the user disabled the site (or a feature), it stops once storage answers;
 * on a disabled site the whole instance retires. So it may act for the first
 * few milliseconds of a page load.
 *
 * Never throws, so the content script needs no guard of its own: a feature
 * that throws is logged and skipped, and without storage the features keep
 * the site defaults.
 */
export function startFeatures(site: Site, section: SiteSection): (section: SiteSection) => void {
  const lifetime = lifetimeSignal();
  const context = { siteName: site.name };
  let stored: StoredSettings | null = null;

  // Generic so TS ties each starter to its own feature's config type.
  const createRunner = <K extends FeatureId>(id: K) => {
    const update = createFeatureRunner(featureStarters[id], lifetime, context);
    return (resolved: ResolvedFeatures) => {
      try {
        update(resolved[id]);
      } catch (err) {
        // Never break the host page, or the other features, over one of them.
        console.debug(`[better-manga] ${site.name} (${section}) ${id} failed`, err);
      }
    };
  };
  // `null` = the feature fits no section of this site; don't install it at all.
  const available = resolveFeatures(settingsFeatures(site));
  const runners = featureIds.filter((id) => available[id]).map(createRunner);
  const runAll = () => {
    const resolved = resolveFeatures(
      sectionFeatures(site, section),
      stored?.global,
      stored?.bySite[site.name],
    );
    for (const run of runners) run(resolved);
  };
  runAll();

  const setSection = (next: SiteSection) => {
    if (next === section || !isAlive()) return;
    section = next;
    runAll();
  };
  if (!isAlive()) return setSection;
  try {
    const unsubscribe = subscribeStoredSettings([site.name], (settings) => {
      // Also notices the extension being gone, which aborts `lifetime`.
      if (!isAlive()) return;
      if (settings.disabledSites.has(site.name)) return retire();
      stored = settings;
      runAll();
    });
    lifetime.addEventListener('abort', unsubscribe, { once: true });
  } catch (err) {
    // `browser.storage` can be missing or throw synchronously.
    console.debug(`[better-manga] ${site.name} settings unavailable`, err);
  }
  return setSection;
}
