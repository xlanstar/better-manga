import { FeatureToggle } from '@/components/feature-toggle';
import { i18n } from '@/utils/i18n';
import type { FeatureControlsProps } from '../types';
import type { SkipRedirectsResolvedConfig, SkipRedirectsUserConfig } from './index';

export function SkipRedirectsControls({
  value,
  onChange,
}: FeatureControlsProps<SkipRedirectsUserConfig, SkipRedirectsResolvedConfig>) {
  return (
    <FeatureToggle
      checked={value.enabled}
      description={i18n.t('skipRedirects.description')}
      onCheckedChange={(enabled) => onChange({ enabled }, true)}
      title={i18n.t('skipRedirects.title')}
    />
  );
}
