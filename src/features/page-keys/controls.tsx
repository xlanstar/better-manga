import { OptionSlider } from '@/components/option-slider';
import { OptionSwitch } from '@/components/option-switch';
import { formatPercent } from '@/utils/format';
import { i18n } from '@/utils/i18n';
import type { FeatureOptionsProps } from '../types';
import {
  PAGE_KEYS_DURATION,
  PAGE_KEYS_HOLD_SPEED,
  PAGE_KEYS_RATIO,
  type PageKeysResolvedConfig,
  type PageKeysUserOptions,
} from './index';

const formatDuration = (ms: number) => i18n.t('pageKeys.durationValue', [String(ms)]);
const formatHoldSpeed = (screens: number) => i18n.t('pageKeys.holdSpeedValue', [String(screens)]);

/** The distance, then the smooth switch with its timing under it. */
export function PageKeysOptions({
  value,
  defaults,
  onChange,
}: FeatureOptionsProps<PageKeysUserOptions, PageKeysResolvedConfig>) {
  const disabled = !value.enabled;
  return (
    <div className="flex flex-col gap-4">
      <OptionSlider
        defaultValue={defaults.ratio}
        disabled={disabled}
        format={formatPercent}
        label={i18n.t('pageKeys.ratio')}
        onChange={(ratio, persist) => onChange({ ratio }, persist)}
        range={PAGE_KEYS_RATIO}
        value={value.ratio}
      />
      <div className="flex flex-col gap-2">
        <OptionSwitch
          checked={value.smooth}
          description={i18n.t('pageKeys.smoothDescription')}
          disabled={disabled}
          label={i18n.t('pageKeys.smooth')}
          onChange={(smooth) => onChange({ smooth }, true)}
        />
        {value.smooth && (
          <>
            <OptionSlider
              defaultValue={defaults.duration}
              disabled={disabled}
              format={formatDuration}
              formatEnd={String}
              label={i18n.t('pageKeys.duration')}
              onChange={(duration, persist) => onChange({ duration }, persist)}
              range={PAGE_KEYS_DURATION}
              value={value.duration}
            />
            <OptionSlider
              defaultValue={defaults.holdSpeed}
              disabled={disabled}
              format={formatHoldSpeed}
              formatEnd={String}
              label={i18n.t('pageKeys.holdSpeed')}
              onChange={(holdSpeed, persist) => onChange({ holdSpeed }, persist)}
              range={PAGE_KEYS_HOLD_SPEED}
              value={value.holdSpeed}
            />
          </>
        )}
      </div>
    </div>
  );
}
