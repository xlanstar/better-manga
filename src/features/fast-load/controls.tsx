import { OptionSlider } from '@/components/option-slider';
import { OptionSwitch } from '@/components/option-switch';
import { i18n } from '@/utils/i18n';
import type { FeatureOptionsProps } from '../types';
import { FAST_LOAD_PARALLEL } from './index';

const formatParallel = (n: number) => i18n.t('fastLoad.parallelValue', [String(n)]);

/** One switch per way of speeding up; the parallel downloads under theirs. */
export function FastLoadOptions({ value, defaults, onChange }: FeatureOptionsProps<'fastLoad'>) {
  const disabled = !value.enabled;
  return (
    <div className="flex flex-col gap-4">
      <OptionSwitch
        checked={value.connect}
        description={i18n.t('fastLoad.connectDescription')}
        disabled={disabled}
        label={i18n.t('fastLoad.connect')}
        onChange={(connect) => onChange({ connect }, true)}
      />
      <div className="flex flex-col gap-2">
        <OptionSwitch
          checked={value.preloadImages}
          description={i18n.t('fastLoad.preloadImagesDescription')}
          disabled={disabled}
          label={i18n.t('fastLoad.preloadImages')}
          onChange={(preloadImages) => onChange({ preloadImages }, true)}
        />
        {value.preloadImages && (
          <OptionSlider
            defaultValue={defaults.parallel}
            disabled={disabled}
            format={formatParallel}
            formatEnd={String}
            label={i18n.t('fastLoad.parallel')}
            onChange={(parallel, persist) => onChange({ parallel }, persist)}
            range={FAST_LOAD_PARALLEL}
            value={value.parallel}
          />
        )}
      </div>
      <OptionSwitch
        checked={value.preloadNext}
        description={i18n.t('fastLoad.preloadNextDescription')}
        disabled={disabled}
        label={i18n.t('fastLoad.preloadNext')}
        onChange={(preloadNext) => onChange({ preloadNext }, true)}
      />
    </div>
  );
}
