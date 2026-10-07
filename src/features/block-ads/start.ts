import { keepHidden, keepRemoved } from '@/utils/dom';
import type { FeatureStart } from '../types';
import type { BlockAdsResolvedConfig } from './index';

// Turning it off stops hiding (the stylesheet goes) and removing; nodes
// already removed stay gone until a reload.
export const startBlockAds: FeatureStart<BlockAdsResolvedConfig> = ({ hide, remove }, signal) => {
  if (hide?.length) keepHidden(hide, signal);
  if (remove?.length) keepRemoved(remove, signal);
};
