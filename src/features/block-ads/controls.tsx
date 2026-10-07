import { FeatureToggle } from '@/components/feature-toggle';
import { i18n } from '@/utils/i18n';
import type { FeatureControlsProps } from '../types';
import type { BlockAdsResolvedConfig, BlockAdsUserConfig } from './index';

export function BlockAdsControls({
  value,
  onChange,
}: FeatureControlsProps<BlockAdsUserConfig, BlockAdsResolvedConfig>) {
  return (
    <FeatureToggle
      checked={value.enabled}
      description={i18n.t('blockAds.description')}
      onCheckedChange={(enabled) => onChange({ enabled }, true)}
      title={i18n.t('blockAds.title')}
    />
  );
}
