import { isAlive } from '@/utils/lifecycle';
import { contributePageKeyScroll } from '@/utils/scroll';
import type { FeatureStart } from '../types';
import type { SmoothScrollResolvedConfig } from './index';

// An orphaned instance (extension removed) gets no abort, so it checks on use.
export const startSmoothScroll: FeatureStart<SmoothScrollResolvedConfig> = (
  { container, duration, holdSpeed },
  signal,
) => {
  const smooth = { duration, holdSpeed };
  contributePageKeyScroll(() => (isAlive() ? { smooth, container } : null), signal);
};
