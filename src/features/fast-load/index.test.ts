import { describe, expect, test } from 'bun:test';
import { FAST_LOAD_PARALLEL, fastLoad } from './index';

const { defaults } = fastLoad;
const sanitizeOptions = fastLoad.sanitizeOptions!;
const isUsable = fastLoad.isUsable!;
const { min, max } = FAST_LOAD_PARALLEL;

describe('FAST_LOAD_PARALLEL', () => {
  test('is a range of whole numbers, at least 2', () => {
    expect(min).toBeGreaterThanOrEqual(2);
    expect(min).toBeLessThan(max);
    expect(Number.isInteger(min) && Number.isInteger(max)).toBe(true);
    expect(FAST_LOAD_PARALLEL.step).toBe(1);
  });
});

describe('fastLoad.defaults', () => {
  test('every way on, 6 downloads at a time', () => {
    expect(defaults).toEqual({
      enabled: true,
      connect: true,
      preloadImages: true,
      parallel: 6,
      preloadNext: true,
    });
  });

  test('parallel lies inside the range', () => {
    expect(defaults.parallel).toBeGreaterThanOrEqual(min);
    expect(defaults.parallel).toBeLessThanOrEqual(max);
  });

  test('has no site adapters', () => {
    for (const key of ['origins', 'images', 'nextChapter']) expect(key in defaults).toBe(false);
  });
});

describe('fastLoad.isUsable', () => {
  test.each([
    ['origins', { origins: ['https://img.test'] }],
    ['images', { images: { selector: 'img[data-src]', src: 'data-src' } }],
    ['nextChapter', { nextChapter: { link: '#next' } }],
  ])('a site config with only %s', (_, config) => {
    expect(isUsable(config)).toBe(true);
  });

  test.each([
    ['nothing', {}],
    ['empty origins', { origins: [] }],
    ['a blank image selector', { images: { selector: ' ', src: 'data-src' } }],
    ['a blank link selector', { nextChapter: { link: '' } }],
  ])('not with %s', (_, config) => {
    expect(isUsable(config)).toBe(false);
  });
});

describe('fastLoad.sanitizeOptions', () => {
  test('keeps valid options', () => {
    const options = { connect: false, preloadImages: false, parallel: 3, preloadNext: false };
    expect(sanitizeOptions(options)).toEqual(options);
  });

  test.each(['connect', 'preloadImages', 'preloadNext'])('drops a non-boolean %s', (key) => {
    for (const bad of ['true', 1, null, {}]) expect(sanitizeOptions({ [key]: bad })).toEqual({});
  });

  test('rounds parallel to a whole number and clamps it to the range', () => {
    expect(sanitizeOptions({ parallel: 4.4 })).toEqual({ parallel: 4 });
    expect(sanitizeOptions({ parallel: 0 })).toEqual({ parallel: min });
    expect(sanitizeOptions({ parallel: 99 })).toEqual({ parallel: max });
  });

  test.each([[Number.NaN], [Infinity], ['4'], [null], [[4]]])('drops parallel %p', (parallel) => {
    expect(sanitizeOptions({ parallel })).toEqual({});
  });

  test('drops `enabled`, unknown keys and the site adapters', () => {
    expect(
      sanitizeOptions({
        enabled: false,
        origins: ['https://img.test'],
        images: {},
        nextChapter: {},
        speed: 1,
        connect: true,
      }),
    ).toEqual({ connect: true });
  });

  test('is idempotent', () => {
    for (const raw of [
      { parallel: 2.6, connect: 'x' },
      { preloadNext: true, parallel: -1 },
    ]) {
      const once = sanitizeOptions(raw);
      expect(sanitizeOptions({ ...once })).toEqual(once);
    }
  });
});
