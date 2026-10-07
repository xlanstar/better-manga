import { describe, expect, test } from 'bun:test';
import { PAGE_SCROLL_RATIO } from '@/features/page-scroll';
import { formatPercent, sliderToRatio } from './format';

describe('formatPercent', () => {
  test.each([
    [0, '0%'],
    [0.3, '30%'],
    [0.7, '70%'],
    [1, '100%'],
    [0.05, '5%'],
    [1.5, '150%'],
    [-0.25, '-25%'],
  ])('%p → %s', (ratio, expected) => {
    expect(formatPercent(ratio)).toBe(expected);
  });

  test('rounds to a whole percent', () => {
    expect(formatPercent(0.333)).toBe('33%');
    expect(formatPercent(0.666)).toBe('67%');
    expect(formatPercent(0.125)).toBe('13%'); // half rounds up
    expect(formatPercent(0.004)).toBe('0%');
  });

  test('is not fooled by float noise', () => {
    expect(formatPercent(0.1 + 0.2)).toBe('30%');
    expect(formatPercent(0.3 + 0.05 * 5)).toBe('55%');
  });

  test('every slider step shows a distinct multiple of 5%', () => {
    const { min, max, step } = PAGE_SCROLL_RATIO;
    const seen = new Set<string>();
    for (let i = 0; min + i * step <= max + 1e-9; i++) {
      const label = formatPercent(min + i * step);
      expect(label).toBe(`${30 + i * 5}%`);
      seen.add(label);
    }
    expect(seen.has('100%')).toBe(true);
  });
});

describe('sliderToRatio', () => {
  test('rounds a number to two decimals', () => {
    expect(sliderToRatio(0.7, 0)).toBe(0.7);
    expect(sliderToRatio(0.123, 0)).toBe(0.12);
    expect(sliderToRatio(0.126, 0)).toBe(0.13);
    expect(sliderToRatio(1, 0)).toBe(1);
    expect(sliderToRatio(0, 0.7)).toBe(0);
  });

  test('cleans float noise from slider steps', () => {
    expect(sliderToRatio(0.30000000000000004, 0)).toBe(0.3);
    expect(sliderToRatio(0.35000000000000003, 0)).toBe(0.35);
    expect(sliderToRatio(0.6499999999999999, 0)).toBe(0.65);
  });

  test('every slider step lands exactly on its decimal value', () => {
    const { min, max, step } = PAGE_SCROLL_RATIO;
    for (let i = 0; min + i * step <= max + 1e-9; i++) {
      const expected = Number((0.3 + i * 0.05).toFixed(2));
      expect(sliderToRatio(min + i * step, 0)).toBe(expected);
    }
  });

  test('accumulated steps compare equal to the default ratio', () => {
    let v = PAGE_SCROLL_RATIO.min;
    for (let i = 0; i < 8; i++) v += PAGE_SCROLL_RATIO.step;
    expect(v).not.toBe(0.7); // the raw float is off
    expect(sliderToRatio(v, 0)).toBe(0.7);
  });

  test('a range uses the first thumb', () => {
    expect(sliderToRatio([0.456], 0)).toBe(0.46);
    expect(sliderToRatio([0.4, 0.9], 0)).toBe(0.4);
  });

  test('an empty range uses the (rounded) fallback', () => {
    expect(sliderToRatio([], 0.7)).toBe(0.7);
    expect(sliderToRatio([], 0.704)).toBe(0.7);
  });

  test('ignores the fallback for a plain number', () => {
    expect(sliderToRatio(0.5, 0.9)).toBe(0.5);
  });

  test('passes non-finite values through (sanitize rejects them later)', () => {
    expect(sliderToRatio(Number.NaN, 0.7)).toBeNaN();
    expect(sliderToRatio(Infinity, 0.7)).toBe(Infinity);
  });

  test('is idempotent', () => {
    for (let r = 0; r <= 1; r += 0.0137) {
      const once = sliderToRatio(r, 0);
      expect(sliderToRatio(once, 0)).toBe(once);
    }
  });
});
