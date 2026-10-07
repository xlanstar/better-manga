import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { PAGE_SCROLL_RATIO } from '@/features/page-scroll';
import type { FeatureControlsProps } from './index';

export function PageScrollControls({
  value,
  defaults,
  onChange,
}: FeatureControlsProps<'pageScroll'>) {
  // Slider steps are floats; keep stored values clean so they compare equal.
  // The coss Slider is typed for ranges too; this one has a single thumb.
  const round = (v: number | readonly number[]) =>
    Math.round((typeof v === 'number' ? v : (v[0] ?? defaults.ratio)) * 100) / 100;

  return (
    <div className="flex flex-col gap-3">
      <Label className="items-start justify-between gap-3">
        <span className="flex flex-col gap-1">
          Page Up / Down 捲動
          <span className="text-xs font-normal text-muted-foreground">
            每次捲動畫面高度的固定比例，保留重疊方便接續閱讀。
          </span>
        </span>
        <Switch
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ enabled }, true)}
        />
      </Label>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">捲動比例</span>
          <span className="font-medium tabular-nums">{percent(value.ratio)}</span>
        </div>
        <Slider
          aria-label="捲動比例"
          disabled={!value.enabled}
          max={PAGE_SCROLL_RATIO.max}
          min={PAGE_SCROLL_RATIO.min}
          onValueChange={(v) => onChange({ ratio: round(v) }, false)}
          onValueCommitted={(v) => onChange({ ratio: round(v) }, true)}
          step={PAGE_SCROLL_RATIO.step}
          value={value.ratio}
        />
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{percent(PAGE_SCROLL_RATIO.min)}</span>
          <span>預設 {percent(defaults.ratio)}</span>
          <span>{percent(PAGE_SCROLL_RATIO.max)}</span>
        </div>
      </div>
    </div>
  );
}

const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;
