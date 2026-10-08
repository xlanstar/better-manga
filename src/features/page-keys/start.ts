import { handlePageKeys } from '@/utils/scroll';
import type { FeatureResolvedConfig } from '../index';
import type { FeatureStart } from '../types';

export const startPageKeys: FeatureStart<FeatureResolvedConfig<'pageKeys'>> = handlePageKeys;
