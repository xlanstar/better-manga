import type { ComponentType } from 'react';
import type { FeatureId, FeatureResolved, FeatureUserConfig } from '@/features';
import { PageScrollControls } from './page-scroll';

export type FeatureControlsProps<K extends FeatureId> = {
  value: FeatureResolved<K>;
  defaults: FeatureResolved<K>;
  /**
   * Merged into the user layer. `persist: false` updates the UI only (e.g.
   * while dragging a slider).
   */
  onChange: (patch: FeatureUserConfig<K>, persist: boolean) => void;
};

/**
 * Popup controls per feature. Typed over every `FeatureId`, so a new feature
 * can't be forgotten here.
 */
export const featureControls: {
  [K in FeatureId]: ComponentType<FeatureControlsProps<K>>;
} = {
  pageScroll: PageScrollControls,
};
