import { OptionSlider } from '@/components/option-slider';
import { i18n } from '@/utils/i18n';
import type { FeatureOptionsProps } from '../types';
import {
  SMOOTH_SCROLL_DURATION,
  SMOOTH_SCROLL_HOLD_SPEED,
  type SmoothScrollResolvedConfig,
  type SmoothScrollUserOptions,
} from './index';

const formatDuration = (ms: number) => i18n.t('smoothScroll.durationValue', [String(ms)]);
const formatHoldSpeed = (screens: number) =>
  i18n.t('smoothScroll.holdSpeedValue', [String(screens)]);

export function SmoothScrollOptions({
  value,
  defaults,
  onChange,
}: FeatureOptionsProps<SmoothScrollUserOptions, SmoothScrollResolvedConfig>) {
  return (
    <div className="flex flex-col gap-4">
      <OptionSlider
        defaultValue={defaults.duration}
        disabled={!value.enabled}
        format={formatDuration}
        formatEnd={String}
        label={i18n.t('smoothScroll.duration')}
        onChange={(duration, persist) => onChange({ duration }, persist)}
        range={SMOOTH_SCROLL_DURATION}
        value={value.duration}
      />
      <OptionSlider
        defaultValue={defaults.holdSpeed}
        disabled={!value.enabled}
        format={formatHoldSpeed}
        formatEnd={String}
        label={i18n.t('smoothScroll.holdSpeed')}
        onChange={(holdSpeed, persist) => onChange({ holdSpeed }, persist)}
        range={SMOOTH_SCROLL_HOLD_SPEED}
        value={value.holdSpeed}
      />
    </div>
  );
}
