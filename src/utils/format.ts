/** Pure display / input helpers for the popup controls. */

/** `0.7` → `"70%"`, rounded to a whole percent. */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/**
 * A slider value as a ratio rounded to two decimals. Slider steps are floats
 * (`0.3 + 0.05 * n`); rounding keeps stored values clean so they compare equal
 * to the defaults. The coss Slider is typed for ranges too; for a range, the
 * first thumb counts, and an empty range gives `fallback`.
 */
export function sliderToRatio(value: number | readonly number[], fallback: number): number {
  const raw = typeof value === 'number' ? value : (value[0] ?? fallback);
  return Math.round(raw * 100) / 100;
}
