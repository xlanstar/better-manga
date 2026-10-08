import { describe, expect, test } from 'bun:test';
import { snapToRange } from './range';

const RATIO = { min: 0.3, max: 1, step: 0.05 };
const WHOLE = { min: 2, max: 8, step: 1 };

describe('snapToRange', () => {
  test('keeps a value on a step', () => {
    expect(snapToRange(0.7, RATIO)).toBe(0.7);
    expect(snapToRange(5, WHOLE)).toBe(5);
  });

  test('snaps to the nearest step', () => {
    expect(snapToRange(0.333, RATIO)).toBe(0.35);
    expect(snapToRange(0.32, RATIO)).toBe(0.3);
    expect(snapToRange(4.4, WHOLE)).toBe(4);
    expect(snapToRange(4.6, WHOLE)).toBe(5);
  });

  test('clamps into the range', () => {
    expect(snapToRange(0, RATIO)).toBe(0.3);
    expect(snapToRange(-0, RATIO)).toBe(0.3);
    expect(snapToRange(1.04, RATIO)).toBe(1);
    expect(snapToRange(Number.MAX_VALUE, RATIO)).toBe(1);
    expect(snapToRange(-Number.MAX_VALUE, WHOLE)).toBe(2);
  });

  test('every step lands exactly on its decimal value', () => {
    for (let i = 0; i <= 14; i++) {
      const expected = Number((0.3 + i * 0.05).toFixed(2));
      expect(snapToRange(RATIO.min + i * RATIO.step, RATIO)).toBe(expected);
    }
  });

  test('accumulated steps compare equal to their decimal value', () => {
    let v = RATIO.min;
    for (let i = 0; i < 8; i++) v += RATIO.step;
    expect(v).not.toBe(0.7); // the raw float is off
    expect(snapToRange(v, RATIO)).toBe(0.7);
  });

  test.each([[Number.NaN], [Infinity], [-Infinity], ['0.5'], [null], [undefined], [[0.5]]])(
    'gives undefined for %p',
    (value) => {
      expect(snapToRange(value, RATIO)).toBeUndefined();
    },
  );

  test('is idempotent', () => {
    for (let v = -1; v <= 2; v += 0.0137) {
      const once = snapToRange(v, RATIO);
      expect(snapToRange(once, RATIO)).toBe(once);
    }
  });
});
