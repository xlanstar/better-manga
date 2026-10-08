import { contributePageKeyScroll } from '@/utils/scroll';
import type { FeatureStart } from '../types';
import type { SmoothScrollResolvedConfig } from './index';

export const startSmoothScroll: FeatureStart<SmoothScrollResolvedConfig> = (
  { container, duration, holdSpeed },
  signal,
) => {
  contributePageKeyScroll({ smooth: { duration, holdSpeed }, container }, signal);
};
