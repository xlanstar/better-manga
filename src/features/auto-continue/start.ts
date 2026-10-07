import { clickOnAppear } from '@/utils/dom';
import type { FeatureStart } from '../types';
import { whileEnabled } from '../while-enabled';
import type { AutoContinueResolvedConfig } from './index';

export const startAutoContinue: FeatureStart<AutoContinueResolvedConfig> = (getConfig, subscribe) =>
  whileEnabled(getConfig, subscribe, ({ selector }) =>
    selector ? clickOnAppear(selector) : () => {},
  );
