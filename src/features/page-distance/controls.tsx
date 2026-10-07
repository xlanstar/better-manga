import { OptionSlider } from '@/components/option-slider';
import { formatPercent } from '@/utils/format';
import { i18n } from '@/utils/i18n';
import type { FeatureOptionsProps } from '../types';
import {
  PAGE_DISTANCE_RATIO,
  type PageDistanceResolvedConfig,
  type PageDistanceUserOptions,
} from './index';

export function PageDistanceOptions({
  value,
  defaults,
  onChange,
}: FeatureOptionsProps<PageDistanceUserOptions, PageDistanceResolvedConfig>) {
  return (
    <OptionSlider
      defaultValue={defaults.ratio}
      disabled={!value.enabled}
      format={formatPercent}
      label={i18n.t('pageDistance.ratio')}
      onChange={(ratio, persist) => onChange({ ratio }, persist)}
      range={PAGE_DISTANCE_RATIO}
      value={value.ratio}
    />
  );
}
