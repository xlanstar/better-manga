/**
 * Popup side of the features, kept out of `index.ts` so the content script
 * doesn't bundle React.
 */
import type { ComponentType } from 'react';
import type { FeatureId, FeatureResolvedConfig, FeatureUserConfig } from './index';
import { PageScrollControls } from './page-scroll/controls';
import type { FeatureControlsProps } from './types';

/** Props of feature `K`'s popup controls. */
export type ControlsPropsOf<K extends FeatureId> = FeatureControlsProps<
  FeatureUserConfig<K>,
  FeatureResolvedConfig<K>
>;

/**
 * Popup controls per feature. Typed over every `FeatureId`, so a new feature
 * can't be forgotten here.
 */
export const featureControls: { [K in FeatureId]: ComponentType<ControlsPropsOf<K>> } = {
  pageScroll: PageScrollControls,
};
