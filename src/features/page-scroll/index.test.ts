import { describe, expect, test } from 'bun:test';
import { PAGE_SCROLL_RATIO, pageScroll } from './index';

const { sanitize, defaults } = pageScroll;
const { min, max, step } = PAGE_SCROLL_RATIO;

describe('PAGE_SCROLL_RATIO', () => {
  test('is a non-empty range inside (0, 1]', () => {
    expect(min).toBeGreaterThan(0);
    expect(max).toBeLessThanOrEqual(1);
    expect(min).toBeLessThan(max);
  });

  test('step divides the range evenly (the slider reaches both ends)', () => {
    const steps = (max - min) / step;
    expect(steps).toBeCloseTo(Math.round(steps), 9);
    expect(step).toBeGreaterThan(0);
  });
});

describe('pageScroll.defaults', () => {
  test('is enabled with a ratio that leaves overlap', () => {
    expect(defaults).toEqual({ enabled: true, ratio: 0.7 });
  });

  test('ratio lies inside the slider range and on a slider step', () => {
    expect(defaults.ratio).toBeGreaterThanOrEqual(min);
    expect(defaults.ratio).toBeLessThanOrEqual(max);
    const n = (defaults.ratio - min) / step;
    expect(n).toBeCloseTo(Math.round(n), 9);
  });

  test('has no container (that is a site adapter, not a default)', () => {
    expect('container' in defaults).toBe(false);
  });

  test('survives sanitize unchanged', () => {
    expect(sanitize({ ...defaults })).toEqual({ enabled: true, ratio: 0.7 });
  });
});

describe('pageScroll.sanitize', () => {
  test('empty input gives an empty layer', () => {
    expect(sanitize({})).toEqual({});
  });

  describe('enabled', () => {
    test.each([true, false])('keeps boolean %p', (enabled) => {
      expect(sanitize({ enabled })).toEqual({ enabled });
    });

    test.each([
      ['string "true"', 'true'],
      ['string "false"', 'false'],
      ['number 1', 1],
      ['number 0', 0],
      ['null', null],
      ['undefined', undefined],
      ['object', {}],
      ['array', [true]],
      ['Boolean object', new Boolean(true)],
    ])('drops non-boolean (%s)', (_, enabled) => {
      expect(sanitize({ enabled })).toEqual({});
    });
  });

  describe('ratio', () => {
    test.each([0.3, 0.35, 0.5, 0.7, 0.95, 1])('keeps in-range %p as is', (ratio) => {
      expect(sanitize({ ratio })).toEqual({ ratio });
    });

    test('keeps in-range values that are not on a step (no rounding)', () => {
      expect(sanitize({ ratio: 0.333 })).toEqual({ ratio: 0.333 });
      expect(sanitize({ ratio: 0.1 + 0.2 + 0.3 })).toEqual({ ratio: 0.1 + 0.2 + 0.3 });
    });

    test.each([0.29, 0.1, 0, -0, -0.5, -1e9, Number.MIN_VALUE, -Number.MAX_VALUE])(
      'clamps %p up to the minimum',
      (ratio) => {
        expect(sanitize({ ratio })).toEqual({ ratio: min });
      },
    );

    test.each([1.0001, 1.5, 2, 100, Number.MAX_VALUE])('clamps %p down to the maximum', (ratio) => {
      expect(sanitize({ ratio })).toEqual({ ratio: max });
    });

    test.each([Number.NaN, Infinity, -Infinity])('drops non-finite %p', (ratio) => {
      expect(sanitize({ ratio })).toEqual({});
    });

    test.each([
      ['numeric string', '0.5'],
      ['empty string', ''],
      ['null', null],
      ['undefined', undefined],
      ['boolean', true],
      ['bigint', 1n],
      ['array', [0.5]],
      ['object', { valueOf: () => 0.5 }],
      ['Number object', new Number(0.5)],
    ])('drops non-number (%s)', (_, ratio) => {
      expect(sanitize({ ratio })).toEqual({});
    });
  });

  test('handles both fields independently', () => {
    expect(sanitize({ enabled: false, ratio: 0.5 })).toEqual({ enabled: false, ratio: 0.5 });
    expect(sanitize({ enabled: 'no', ratio: 0.5 })).toEqual({ ratio: 0.5 });
    expect(sanitize({ enabled: false, ratio: 'x' })).toEqual({ enabled: false });
    expect(sanitize({ enabled: false, ratio: 5 })).toEqual({ enabled: false, ratio: max });
  });

  test('drops unknown keys, including the site-only `container`', () => {
    expect(sanitize({ container: '#reader', speed: 3, ratio: 0.5 })).toEqual({ ratio: 0.5 });
  });

  test('never sets a key to undefined', () => {
    const out = sanitize({ enabled: undefined, ratio: undefined });
    expect(Object.keys(out)).toEqual([]);
    for (const raw of [{ enabled: 1 }, { ratio: Number.NaN }, { enabled: true, ratio: '1' }]) {
      for (const v of Object.values(sanitize(raw))) expect(v).not.toBeUndefined();
    }
  });

  test('does not mutate its input', () => {
    const raw = { enabled: 'yes', ratio: 9, extra: 1 };
    sanitize(raw);
    expect(raw).toEqual({ enabled: 'yes', ratio: 9, extra: 1 });
  });

  test('returns a fresh object', () => {
    const raw = { enabled: true };
    expect(sanitize(raw)).not.toBe(raw);
  });

  test('ignores inherited properties of a prototype-less object', () => {
    const raw = Object.assign(Object.create(null), { ratio: 0.4 });
    expect(sanitize(raw)).toEqual({ ratio: 0.4 });
  });

  test('is idempotent', () => {
    const inputs: Record<string, unknown>[] = [
      {},
      { enabled: true },
      { enabled: 'x', ratio: -3 },
      { ratio: 0.55 },
      { ratio: 42, enabled: false },
      { ratio: Number.NaN, other: 1 },
    ];
    for (let r = -0.5; r <= 1.5; r += 0.05) inputs.push({ ratio: r });
    for (const raw of inputs) {
      const once = sanitize(raw);
      expect(sanitize(once)).toEqual(once);
    }
  });

  test('output ratio is always inside the range', () => {
    for (let r = -2; r <= 3; r += 0.01) {
      const { ratio } = sanitize({ ratio: r });
      expect(ratio).toBeGreaterThanOrEqual(min);
      expect(ratio).toBeLessThanOrEqual(max);
    }
  });
});
