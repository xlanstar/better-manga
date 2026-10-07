import { isAlive } from '@/utils/lifecycle';
import { contributePageKeyScroll } from '@/utils/scroll';
import type { FeatureStart } from '../types';
import type { PageScrollResolvedConfig } from './index';

// An orphaned instance (extension removed) gets no abort, so it checks on use.
export const startPageScroll: FeatureStart<PageScrollResolvedConfig> = (
  { ratio, container },
  signal,
) => contributePageKeyScroll(() => (isAlive() ? { ratio, container } : null), signal);
