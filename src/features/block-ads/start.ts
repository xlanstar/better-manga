import { keepHidden, keepRemoved } from '@/utils/dom';
import type { FeatureStart } from '../types';
import { whileEnabled } from '../while-enabled';
import type { BlockAdsResolvedConfig } from './index';

// Turning it off stops hiding (the stylesheet goes) and removing; nodes
// already removed stay gone until a reload.
export const startBlockAds: FeatureStart<BlockAdsResolvedConfig> = (getConfig, subscribe, signal) =>
  whileEnabled(getConfig, subscribe, signal, ({ hide = [], remove = [] }, run) => {
    if (hide.length) keepHidden(hide, run);
    if (remove.length) keepRemoved(remove, run);
  });
