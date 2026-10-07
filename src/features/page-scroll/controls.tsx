import { OptionSlider } from '@/components/option-slider';
import { formatPercent } from '@/utils/format';
import { i18n } from '@/utils/i18n';
import type { FeatureOptionsProps } from '../types';
import {
  PAGE_SCROLL_RATIO,
  type PageScrollResolvedConfig,
  type PageScrollUserOptions,
} from './index';

export function PageScrollOptions({
  value,
  defaults,
  onChange,
}: FeatureOptionsProps<PageScrollUserOptions, PageScrollResolvedConfig>) {
  return (
    <OptionSlider
      defaultValue={defaults.ratio}
      disabled={!value.enabled}
      format={formatPercent}
      label={i18n.t('pageScroll.ratio')}
      onChange={(ratio, persist) => onChange({ ratio }, persist)}
      range={PAGE_SCROLL_RATIO}
      value={value.ratio}
    />
  );
}
