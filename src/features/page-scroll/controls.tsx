import { i18n } from '@/utils/i18n';
import { FeatureToggle } from '@/components/feature-toggle';
import { Slider } from '@/components/ui/slider';
import { formatPercent, sliderToRatio } from '@/utils/format';
import type { FeatureControlsProps } from '../types';
import {
  PAGE_SCROLL_RATIO,
  type PageScrollResolvedConfig,
  type PageScrollUserConfig,
} from './index';

export function PageScrollControls({
  value,
  defaults,
  onChange,
}: FeatureControlsProps<PageScrollUserConfig, PageScrollResolvedConfig>) {
  const toRatio = (v: number | readonly number[]) => sliderToRatio(v, defaults.ratio);

  return (
    <div className="flex flex-col gap-3">
      <FeatureToggle
        checked={value.enabled}
        description={i18n.t('pageScroll.description')}
        onCheckedChange={(enabled) => onChange({ enabled }, true)}
        title={i18n.t('pageScroll.title')}
      />

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{i18n.t('pageScroll.ratio')}</span>
          <span className="font-medium tabular-nums">{formatPercent(value.ratio)}</span>
        </div>
        <Slider
          aria-label={i18n.t('pageScroll.ratio')}
          disabled={!value.enabled}
          max={PAGE_SCROLL_RATIO.max}
          min={PAGE_SCROLL_RATIO.min}
          onValueChange={(v) => onChange({ ratio: toRatio(v) }, false)}
          onValueCommitted={(v) => onChange({ ratio: toRatio(v) }, true)}
          step={PAGE_SCROLL_RATIO.step}
          value={value.ratio}
        />
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{formatPercent(PAGE_SCROLL_RATIO.min)}</span>
          <span>{i18n.t('pageScroll.default', [formatPercent(defaults.ratio)])}</span>
          <span>{formatPercent(PAGE_SCROLL_RATIO.max)}</span>
        </div>
      </div>
    </div>
  );
}
