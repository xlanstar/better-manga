import { pageScroll } from './page-scroll';

/**
 * Registry of feature definitions — add a file next to this one, then one line
 * here, one in `runtime.ts` (content script) and one in
 * `entrypoints/popup/features/index.ts` (popup controls). The key is the
 * feature id, also its key in `Site.features` and in stored user settings, so
 * never rename one.
 */
export const features = { pageScroll };

export type FeatureId = keyof typeof features;
export const featureIds = Object.keys(features) as FeatureId[];

type Types<K extends FeatureId> = NonNullable<(typeof features)[K]['types']>;
export type FeatureSiteConfig<K extends FeatureId> = Types<K>['site'];
export type FeatureUserConfig<K extends FeatureId> = Types<K>['user'];
export type FeatureResolved<K extends FeatureId> = Types<K>['resolved'];
