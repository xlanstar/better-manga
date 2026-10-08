import { autoContinue } from './auto-continue';
import { blockAds } from './block-ads';
import { fastLoad } from './fast-load';
import { pageDistance } from './page-distance';
import { readingHistory } from './reading-history';
import { reloadBrokenImages } from './reload-broken-images';
import { skipRedirects } from './skip-redirects';
import { smoothScroll } from './smooth-scroll';

/**
 * Registry of feature definitions — add a folder next to this one, then one
 * line here, one in `starters.ts` (content script) and one in `controls.ts`
 * (popup group and options), plus `<id>.title` and `<id>.description` in the
 * locales. The key is the feature id, also its key in `Site.features` and in
 * stored user settings: renaming one means listing the old id in
 * `renamedFeatureIds`, or users lose their settings. The order here is the
 * order in the popup / options page.
 */
export const features = {
  blockAds,
  skipRedirects,
  autoContinue,
  fastLoad,
  reloadBrokenImages,
  readingHistory,
  pageDistance,
  smoothScroll,
};

export type FeatureId = keyof typeof features;

/**
 * Former feature ids, old → new. Stored settings may still use an old one;
 * `sanitizeUserSettings` reads it as the new one, and the next save drops it.
 */
export const renamedFeatureIds: Readonly<Record<string, FeatureId>> = {
  pageScroll: 'pageDistance',
};
export const featureIds = Object.keys(features) as FeatureId[];

type ConfigTypes<K extends FeatureId> = NonNullable<(typeof features)[K]['types']>;
export type FeatureSiteConfig<K extends FeatureId> = ConfigTypes<K>['site'];
/** The user settings besides `enabled`. */
export type FeatureOptions<K extends FeatureId> = ConfigTypes<K>['options'];
export type FeatureUserConfig<K extends FeatureId> = FeatureOptions<K> & { enabled?: boolean };
export type FeatureResolvedConfig<K extends FeatureId> = ConfigTypes<K>['resolved'];
