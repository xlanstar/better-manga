import { Slider } from '@/components/ui/slider';
import { i18n } from '@/utils/i18n';
import { type Range, snapToRange } from '@/utils/range';

/**
 * A feature option as a labelled slider: label and current value on top, then
 * the slider, then the range ends with the default in between.
 */
export function OptionSlider({
  label,
  value,
  defaultValue,
  range,
  format,
  formatEnd = format,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  /** What the value would be without the layer being edited. */
  defaultValue: number;
  range: Range;
  format: (value: number) => string;
  /** For the range ends, when `format` is too long to fit three in a row. */
  formatEnd?: (value: number) => string;
  disabled?: boolean;
  /** `persist: false` while dragging, `true` once let go. */
  onChange: (value: number, persist: boolean) => void;
}) {
  // Snapped as `sanitizeOptions` does, so the stored value is free of float
  // noise. The coss Slider is typed for ranges too: the first thumb counts.
  const toValue = (v: number | readonly number[]) =>
    snapToRange(typeof v === 'number' ? v : v[0], range) ?? defaultValue;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{format(value)}</span>
      </div>
      <Slider
        aria-label={label}
        disabled={disabled}
        max={range.max}
        min={range.min}
        onValueChange={(v) => onChange(toValue(v), false)}
        onValueCommitted={(v) => onChange(toValue(v), true)}
        step={range.step}
        value={value}
      />
      <div className="flex justify-between gap-2 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        <span>{formatEnd(range.min)}</span>
        <span>{i18n.t('optionSlider.default', [format(defaultValue)])}</span>
        <span>{formatEnd(range.max)}</span>
      </div>
    </div>
  );
}
