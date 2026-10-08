import { describe, expect, test } from 'bun:test';
import { PAGE_KEYS_DURATION, PAGE_KEYS_HOLD_SPEED, PAGE_KEYS_RATIO, pageKeys } from './index';

const { defaults } = pageKeys;
const sanitizeOptions = pageKeys.sanitizeOptions!;
const { min, max } = PAGE_KEYS_RATIO;

describe.each([
  ['PAGE_KEYS_RATIO', PAGE_KEYS_RATIO, defaults.ratio],
  ['PAGE_KEYS_DURATION', PAGE_KEYS_DURATION, defaults.duration],
  ['PAGE_KEYS_HOLD_SPEED', PAGE_KEYS_HOLD_SPEED, defaults.holdSpeed],
])('%s', (_, range, fallback) => {
  test('is a non-empty positive range', () => {
    expect(range.min).toBeGreaterThan(0);
    expect(range.min).toBeLessThan(range.max);
  });

  test('step divides the range evenly (the slider reaches both ends)', () => {
    const steps = (range.max - range.min) / range.step;
    expect(steps).toBeCloseTo(Math.round(steps), 9);
  });

  test('holds the default, on a slider step', () => {
    expect(fallback).toBeGreaterThanOrEqual(range.min);
    expect(fallback).toBeLessThanOrEqual(range.max);
    const n = (fallback - range.min) / range.step;
    expect(n).toBeCloseTo(Math.round(n), 9);
  });
});

test('PAGE_KEYS_RATIO stays within one screen', () => {
  expect(max).toBeLessThanOrEqual(1);
});

describe('pageKeys.defaults', () => {
  test('is enabled, 70 % per press, smooth: 150 ms per press, 2 screens/s held', () => {
    expect(defaults).toEqual({
      enabled: true,
      ratio: 0.7,
      smooth: true,
      duration: 150,
      holdSpeed: 2,
    });
  });

  test('has no container (that is a site adapter, not a default)', () => {
    expect('container' in defaults).toBe(false);
  });
});

describe('pageKeys.sanitizeOptions', () => {
  test('empty input gives an empty layer', () => {
    expect(sanitizeOptions({})).toEqual({});
  });

  describe('ratio', () => {
    test.each([0.3, 0.35, 0.5, 0.7, 0.95, 1])('keeps in-range %p as is', (ratio) => {
      expect(sanitizeOptions({ ratio })).toEqual({ ratio });
    });

    test('snaps in-range values to the nearest step, free of float noise', () => {
      expect(sanitizeOptions({ ratio: 0.333 })).toEqual({ ratio: 0.35 });
      expect(sanitizeOptions({ ratio: 0.1 + 0.2 + 0.3 })).toEqual({ ratio: 0.6 });
    });

    test.each([0.29, 0.1, 0, -0, -0.5, -1e9, Number.MIN_VALUE, -Number.MAX_VALUE])(
      'clamps %p up to the minimum',
      (ratio) => {
        expect(sanitizeOptions({ ratio })).toEqual({ ratio: min });
      },
    );

    test.each([1.0001, 1.5, 2, 100, Number.MAX_VALUE])('clamps %p down to the maximum', (ratio) => {
      expect(sanitizeOptions({ ratio })).toEqual({ ratio: max });
    });

    test.each([Number.NaN, Infinity, -Infinity])('drops non-finite %p', (ratio) => {
      expect(sanitizeOptions({ ratio })).toEqual({});
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
      expect(sanitizeOptions({ ratio })).toEqual({});
    });
  });

  describe('smooth', () => {
    test.each([true, false])('keeps boolean %p', (smooth) => {
      expect(sanitizeOptions({ smooth })).toEqual({ smooth });
    });

    test.each([['true'], [1], [null], [new Boolean(true)]])('drops %p', (smooth) => {
      expect(sanitizeOptions({ smooth })).toEqual({});
    });
  });

  describe('duration and holdSpeed', () => {
    test('snap to the nearest step', () => {
      expect(sanitizeOptions({ duration: 170, holdSpeed: 1.3 })).toEqual({
        duration: 150,
        holdSpeed: 1.5,
      });
    });

    test('clamp out-of-range values', () => {
      expect(sanitizeOptions({ duration: 0, holdSpeed: 99 })).toEqual({
        duration: PAGE_KEYS_DURATION.min,
        holdSpeed: PAGE_KEYS_HOLD_SPEED.max,
      });
    });

    test.each([[Number.NaN], ['300'], [null], [[300]]])('drop %p', (bad) => {
      expect(sanitizeOptions({ duration: bad, holdSpeed: bad })).toEqual({});
    });
  });

  test('sanitizes each option on its own', () => {
    expect(sanitizeOptions({ ratio: 'x', smooth: false, duration: 1e9, holdSpeed: 1 })).toEqual({
      smooth: false,
      duration: PAGE_KEYS_DURATION.max,
      holdSpeed: 1,
    });
  });

  test('leaves `enabled` to the framework', () => {
    expect(sanitizeOptions({ enabled: false })).toEqual({});
    expect(sanitizeOptions({ enabled: false, ratio: 0.5 })).toEqual({ ratio: 0.5 });
    expect(sanitizeOptions({ enabled: true, ratio: 5 })).toEqual({ ratio: max });
  });

  test('drops unknown keys, including the site-only `container`', () => {
    expect(sanitizeOptions({ container: '#reader', speed: 3, ratio: 0.5 })).toEqual({ ratio: 0.5 });
  });

  test('never sets a key to undefined', () => {
    const out = sanitizeOptions({ ratio: undefined });
    expect(Object.keys(out)).toEqual([]);
    for (const raw of [{ enabled: 1 }, { ratio: Number.NaN }, { enabled: true, ratio: '1' }]) {
      for (const v of Object.values(sanitizeOptions(raw))) expect(v).not.toBeUndefined();
    }
  });

  test('does not mutate its input', () => {
    const raw = { enabled: 'yes', ratio: 9, extra: 1 };
    sanitizeOptions(raw);
    expect(raw).toEqual({ enabled: 'yes', ratio: 9, extra: 1 });
  });

  test('returns a fresh object', () => {
    const raw = { ratio: 0.5 };
    expect(sanitizeOptions(raw)).not.toBe(raw);
  });

  test('ignores inherited properties of a prototype-less object', () => {
    const raw = Object.assign(Object.create(null), { ratio: 0.4 });
    expect(sanitizeOptions(raw)).toEqual({ ratio: 0.4 });
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
      const once = sanitizeOptions(raw);
      expect(sanitizeOptions(once)).toEqual(once);
    }
  });

  test('output ratio is always inside the range', () => {
    for (let r = -2; r <= 3; r += 0.01) {
      const { ratio } = sanitizeOptions({ ratio: r });
      expect(ratio).toBeGreaterThanOrEqual(min);
      expect(ratio).toBeLessThanOrEqual(max);
    }
  });
});
