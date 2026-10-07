import { keepHidden, keepRemoved } from '@/utils/dom';
import type { FeatureStart } from '../types';
import { whileEnabled } from '../while-enabled';
import type { BlockAdsResolvedConfig } from './index';

// Turning it off stops hiding (the stylesheet goes) and removing; nodes
// already removed stay gone until a reload.
export const startBlockAds: FeatureStart<BlockAdsResolvedConfig> = (getConfig, subscribe) =>
  whileEnabled(getConfig, subscribe, ({ hide = [], remove = [] }) => {
    const stops = [
      hide.length ? keepHidden(...hide) : null,
      remove.length ? keepRemoved(...remove) : null,
    ];
    return () => {
      for (const stop of stops) stop?.();
    };
  });
