/**
 * Popup side of the features, kept out of `index.ts` so the content script
 * doesn't bundle React.
 */
import type { ComponentType } from 'react';
import { i18n } from '@/utils/i18n';
import { FastLoadOptions } from './fast-load/controls';
import type { FeatureId, FeatureOptions, FeatureResolvedConfig } from './index';
import { PageKeysOptions } from './page-keys/controls';
import type { FeatureOptionsProps } from './types';

/** Props of feature `K`'s options controls. */
type OptionsPropsOf<K extends FeatureId> = FeatureOptionsProps<
  FeatureOptions<K>,
  FeatureResolvedConfig<K>
>;

/** The popup's feature groups, in display order. */
export const featureGroups = ['distractions', 'loading', 'reading'] as const;

/**
 * What the popup shows for each feature besides its on/off switch: its
 * `Options` controls if it has any, under its `group`'s heading. Typed over
 * every `FeatureId`, so a new feature can't be forgotten here.
 */
export const featureControls: {
  [K in FeatureId]: {
    group: (typeof featureGroups)[number];
    Options?: ComponentType<OptionsPropsOf<K>>;
  };
} = {
  blockAds: { group: 'distractions' },
  skipRedirects: { group: 'distractions' },
  autoContinue: { group: 'distractions' },
  fastLoad: { group: 'loading', Options: FastLoadOptions },
  reloadBrokenImages: { group: 'loading' },
  readingHistory: { group: 'reading' },
  pageKeys: { group: 'reading', Options: PageKeysOptions },
};

/**
 * A feature's switch label and description, from the locales' `<id>.title` and
 * `<id>.description`. Functions, so the text follows the language picker.
 */
export const featureTitle = (id: FeatureId) => i18n.t(`${id}.title`);
export const featureDescription = (id: FeatureId) => i18n.t(`${id}.description`);
