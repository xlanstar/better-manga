import { clickOnAppear } from '@/utils/dom';
import type { FeatureResolvedConfig } from '../index';
import type { FeatureStart } from '../types';

export const startAutoContinue: FeatureStart<FeatureResolvedConfig<'autoContinue'>> = (
  { selector },
  signal,
) => {
  if (selector) clickOnAppear(selector, signal);
};
