import { keepHidden, keepRemoved } from '@/utils/dom';
import type { FeatureResolvedConfig } from '../index';
import type { FeatureStart } from '../types';

// Turning it off stops hiding (the stylesheet goes) and removing; nodes
// already removed stay gone until a reload.
export const startBlockAds: FeatureStart<FeatureResolvedConfig<'blockAds'>> = (
  { hide, remove },
  signal,
) => {
  if (hide?.length) keepHidden(hide, signal);
  if (remove?.length) keepRemoved(remove, signal);
};
