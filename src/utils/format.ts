/** Pure display / input helpers for the popup controls. */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Units for `formatTimeAgo`, largest first, with their length in ms. */
const TIME_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * DAY_MS],
  ['month', 30 * DAY_MS],
  ['week', 7 * DAY_MS],
  ['day', DAY_MS],
  ['hour', HOUR_MS],
  ['minute', MINUTE_MS],
];

/**
 * How long before `now` `time` was, in the largest whole unit, in `lang`
 * (a BCP 47 tag): "5 minutes ago", "yesterday", "now".
 */
export function formatTimeAgo(time: number, now: number, lang: string): string {
  const format = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const elapsed = now - time;
  for (const [unit, ms] of TIME_UNITS) {
    if (elapsed >= ms) return format.format(-Math.floor(elapsed / ms), unit);
  }
  return format.format(0, 'second');
}

/** `0.7` → `"70%"`, rounded to a whole percent. */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/**
 * A slider value rounded to two decimals. Slider steps are floats
 * (`0.3 + 0.05 * n`); rounding keeps stored values clean so they compare equal
 * to the defaults. The coss Slider is typed for ranges too; for a range, the
 * first thumb counts, and an empty range gives `fallback`.
 */
export function sliderValue(value: number | readonly number[], fallback: number): number {
  const raw = typeof value === 'number' ? value : (value[0] ?? fallback);
  return Math.round(raw * 100) / 100;
}
