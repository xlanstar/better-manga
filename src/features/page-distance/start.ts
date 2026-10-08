import { contributePageKeyScroll } from '@/utils/scroll';
import type { FeatureStart } from '../types';
import type { PageDistanceResolvedConfig } from './index';

export const startPageDistance: FeatureStart<PageDistanceResolvedConfig> = (
  { ratio, container },
  signal,
) => contributePageKeyScroll({ ratio, container }, signal);
