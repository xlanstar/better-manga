import { clickOnAppear } from '@/utils/dom';
import type { FeatureStart } from '../types';
import type { AutoContinueResolvedConfig } from './index';

export const startAutoContinue: FeatureStart<AutoContinueResolvedConfig> = (
  { selector },
  signal,
) => {
  if (selector) clickOnAppear(selector, signal);
};
