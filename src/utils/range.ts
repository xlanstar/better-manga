/** A numeric option's allowed values: `min` to `max` in steps of `step`. */
export type Range = { readonly min: number; readonly max: number; readonly step: number };

/**
 * `value` clamped into `range` and snapped to its nearest step, or undefined
 * if it isn't a finite number. Steps are floats (`0.3 + 0.05 * n`), so the
 * result is rounded to 10 decimals: stored values then compare equal to the
 * defaults.
 */
export function snapToRange(value: unknown, { min, max, step }: Range): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const snapped = min + Math.round((value - min) / step) * step;
  return Math.min(max, Math.max(min, Math.round(snapped * 1e10) / 1e10));
}
