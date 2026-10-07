import { overridePageKeyScroll } from '@/utils/scroll';
import type { FeatureStart } from '../types';
import type { PageScrollResolvedConfig } from './index';

export const startPageScroll: FeatureStart<PageScrollResolvedConfig> = (getConfig) =>
  overridePageKeyScroll(() => {
    const config = getConfig();
    return config?.enabled ? config : null;
  });
