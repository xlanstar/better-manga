import { describe, expect, test } from 'bun:test';
import { SMOOTH_SCROLL_DURATION, SMOOTH_SCROLL_HOLD_SPEED, smoothScroll } from './index';

const { defaults } = smoothScroll;
const sanitizeOptions = smoothScroll.sanitizeOptions!;

describe.each([
  ['SMOOTH_SCROLL_DURATION', SMOOTH_SCROLL_DURATION, defaults.duration],
  ['SMOOTH_SCROLL_HOLD_SPEED', SMOOTH_SCROLL_HOLD_SPEED, defaults.holdSpeed],
])('%s', (_, { min, max, step }, fallback) => {
  test('is a non-empty positive range', () => {
    expect(min).toBeGreaterThan(0);
    expect(min).toBeLessThan(max);
  });

  test('step divides the range evenly (the slider reaches both ends)', () => {
    const steps = (max - min) / step;
    expect(steps).toBeCloseTo(Math.round(steps), 9);
  });

  test('holds the default, on a slider step', () => {
    expect(fallback).toBeGreaterThanOrEqual(min);
    expect(fallback).toBeLessThanOrEqual(max);
    const n = (fallback - min) / step;
    expect(n).toBeCloseTo(Math.round(n), 9);
  });
});

describe('smoothScroll.defaults', () => {
  test('is enabled, 150 ms per press, 2 screens/s held', () => {
    expect(defaults).toEqual({ enabled: true, duration: 150, holdSpeed: 2 });
  });

  test('has no container (that is a site adapter, not a default)', () => {
    expect('container' in defaults).toBe(false);
  });
});

describe('smoothScroll.sanitizeOptions', () => {
  test('keeps in-range values', () => {
    expect(sanitizeOptions({ duration: 450, holdSpeed: 3.5 })).toEqual({
      duration: 450,
      holdSpeed: 3.5,
    });
  });

  test('snaps values to the nearest step', () => {
    expect(sanitizeOptions({ duration: 170, holdSpeed: 1.3 })).toEqual({
      duration: 150,
      holdSpeed: 1.5,
    });
  });

  test('clamps out-of-range values', () => {
    expect(sanitizeOptions({ duration: 0, holdSpeed: 99 })).toEqual({
      duration: SMOOTH_SCROLL_DURATION.min,
      holdSpeed: SMOOTH_SCROLL_HOLD_SPEED.max,
    });
    expect(sanitizeOptions({ duration: 1e9, holdSpeed: -1 })).toEqual({
      duration: SMOOTH_SCROLL_DURATION.max,
      holdSpeed: SMOOTH_SCROLL_HOLD_SPEED.min,
    });
  });

  test.each([[Number.NaN], [Infinity], ['300'], [null], [true], [[300]], [{}]])(
    'drops %p',
    (bad) => {
      expect(sanitizeOptions({ duration: bad, holdSpeed: bad })).toEqual({});
    },
  );

  test('sanitizes each option on its own', () => {
    expect(sanitizeOptions({ duration: 'x', holdSpeed: 1 })).toEqual({ holdSpeed: 1 });
  });

  test('drops `enabled`, unknown keys and the site-only `container`', () => {
    expect(sanitizeOptions({ enabled: false, container: '#r', speed: 3, duration: 200 })).toEqual({
      duration: 200,
    });
  });
});
