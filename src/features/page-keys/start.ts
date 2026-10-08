import { handlePageKeys } from '@/utils/scroll';
import type { FeatureStart } from '../types';
import type { PageKeysResolvedConfig } from './index';

export const startPageKeys: FeatureStart<PageKeysResolvedConfig> = handlePageKeys;
