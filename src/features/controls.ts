/**
 * Popup side of the features, kept out of `index.ts` so the content script
 * doesn't bundle React.
 */
import type { ComponentType } from 'react';
import { i18n } from '@/utils/i18n';
import { FastLoadOptions } from './fast-load/controls';
import type { FeatureId, FeatureOptions, FeatureResolvedConfig } from './index';
import { PageDistanceOptions } from './page-distance/controls';
import { SmoothScrollOptions } from './smooth-scroll/controls';
import type { FeatureOptionsProps } from './types';

/** Props of feature `K`'s options controls. */
type OptionsPropsOf<K extends FeatureId> = FeatureOptionsProps<
  FeatureOptions<K>,
  FeatureResolvedConfig<K>
>;

/**
 * What the popup shows for each feature: its on/off switch with `title` and
 * `description` (functions, so the text follows the language picker), then
 * its `Options` controls if it has any. Typed over every `FeatureId`, so a
 * new feature can't be forgotten here.
 */
export const featureControls: {
  [K in FeatureId]: {
    title: () => string;
    description: () => string;
    Options?: ComponentType<OptionsPropsOf<K>>;
  };
} = {
  blockAds: {
    title: () => i18n.t('blockAds.title'),
    description: () => i18n.t('blockAds.description'),
  },
  skipRedirects: {
    title: () => i18n.t('skipRedirects.title'),
    description: () => i18n.t('skipRedirects.description'),
  },
  autoContinue: {
    title: () => i18n.t('autoContinue.title'),
    description: () => i18n.t('autoContinue.description'),
  },
  fastLoad: {
    title: () => i18n.t('fastLoad.title'),
    description: () => i18n.t('fastLoad.description'),
    Options: FastLoadOptions,
  },
  pageDistance: {
    title: () => i18n.t('pageDistance.title'),
    description: () => i18n.t('pageDistance.description'),
    Options: PageDistanceOptions,
  },
  smoothScroll: {
    title: () => i18n.t('smoothScroll.title'),
    description: () => i18n.t('smoothScroll.description'),
    Options: SmoothScrollOptions,
  },
};
