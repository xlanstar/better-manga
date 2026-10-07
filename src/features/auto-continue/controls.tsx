import { FeatureToggle } from '@/components/feature-toggle';
import { i18n } from '@/utils/i18n';
import type { FeatureControlsProps } from '../types';
import type { AutoContinueResolvedConfig, AutoContinueUserConfig } from './index';

export function AutoContinueControls({
  value,
  onChange,
}: FeatureControlsProps<AutoContinueUserConfig, AutoContinueResolvedConfig>) {
  return (
    <FeatureToggle
      checked={value.enabled}
      description={i18n.t('autoContinue.description')}
      onCheckedChange={(enabled) => onChange({ enabled }, true)}
      title={i18n.t('autoContinue.title')}
    />
  );
}
