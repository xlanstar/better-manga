import { isAlive } from '@/utils/lifecycle';
import { overridePageKeyScroll } from '@/utils/scroll';
import type { FeatureStart } from '../types';
import type { PageScrollResolvedConfig } from './index';

// An orphaned instance (extension removed) gets no abort, so it checks on use.
export const startPageScroll: FeatureStart<PageScrollResolvedConfig> = (config, signal) =>
  overridePageKeyScroll(() => (isAlive() ? config : null), signal);
