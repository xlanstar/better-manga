import type { FeatureId, FeatureResolved } from './index';
import type { FeatureStart } from './types';
import { startPageScroll } from './page-scroll';

/**
 * How to start each feature, for the content script only. Typed over every
 * `FeatureId`, so a new feature can't be forgotten here.
 */
export const featureStarters: { [K in FeatureId]: FeatureStart<FeatureResolved<K>> } = {
  pageScroll: startPageScroll,
};
