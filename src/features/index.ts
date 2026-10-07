import { pageScroll } from './page-scroll';

/**
 * Registry of feature definitions — add a file next to this one, then one line
 * here, one in `starters.ts` (content script) and one in `controls.ts`
 * (popup). The key is the
 * feature id, also its key in `Site.features` and in stored user settings, so
 * never rename one.
 */
export const features = { pageScroll };

export type FeatureId = keyof typeof features;
export const featureIds = Object.keys(features) as FeatureId[];

type ConfigTypes<K extends FeatureId> = NonNullable<(typeof features)[K]['types']>;
export type FeatureSiteConfig<K extends FeatureId> = ConfigTypes<K>['site'];
export type FeatureUserConfig<K extends FeatureId> = ConfigTypes<K>['user'];
export type FeatureResolvedConfig<K extends FeatureId> = ConfigTypes<K>['resolved'];
