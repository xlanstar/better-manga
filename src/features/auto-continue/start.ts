import { clickOnAppear } from '@/utils/dom';
import type { FeatureStart } from '../types';
import { whileEnabled } from '../while-enabled';
import type { AutoContinueResolvedConfig } from './index';

export const startAutoContinue: FeatureStart<AutoContinueResolvedConfig> = (
  getConfig,
  subscribe,
  signal,
) =>
  whileEnabled(getConfig, subscribe, signal, ({ selector }, run) => {
    if (selector) clickOnAppear(selector, run);
  });
