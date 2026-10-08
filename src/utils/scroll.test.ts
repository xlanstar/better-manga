import { describe, expect, test } from 'bun:test';
import { mergePageKeyParts, pageKeyDirection, pageStep, type PageKeyEvent } from './scroll';

const key = (k: string, extra: Partial<PageKeyEvent> = {}): PageKeyEvent => ({
  key: k,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
  defaultPrevented: false,
  ...extra,
});

const SMOOTH = { duration: 300, holdSpeed: 2 };

describe('mergePageKeyParts', () => {
  test('nothing registered leaves the key to the browser', () => {
    expect(mergePageKeyParts([])).toBeNull();
  });

  test('a ratio alone jumps', () => {
    expect(mergePageKeyParts([{ ratio: 0.7 }])).toEqual({ ratio: 0.7 });
  });

  test('smooth alone keeps the browser step', () => {
    expect(mergePageKeyParts([{ smooth: SMOOTH }])).toEqual({ smooth: SMOOTH });
  });

  test('both combine, in either order', () => {
    const both = { ratio: 0.7, smooth: SMOOTH };
    expect(mergePageKeyParts([{ ratio: 0.7 }, { smooth: SMOOTH }])).toEqual(both);
    expect(mergePageKeyParts([{ smooth: SMOOTH }, { ratio: 0.7 }])).toEqual(both);
  });

  test('takes the container from whichever part has it', () => {
    expect(mergePageKeyParts([{ ratio: 0.5 }, { smooth: SMOOTH, container: '#r' }])).toEqual({
      ratio: 0.5,
      smooth: SMOOTH,
      container: '#r',
    });
  });

  test('a container alone changes nothing', () => {
    expect(mergePageKeyParts([{ container: '#r' }])).toBeNull();
  });
});

describe('pageStep', () => {
  test('scrolls `ratio` of the height', () => {
    expect(pageStep(1000, 0.7)).toBe(700);
  });

  test.each([
    [400, 360],
    [1000, 960],
    [1400, 1360],
    [200, 175],
  ])('without a ratio, matches the browser: %p px \u2192 %p px', (height, step) => {
    expect(pageStep(height)).toBe(step);
  });
});

describe('pageKeyDirection', () => {
  test('Page Down scrolls down', () => {
    expect(pageKeyDirection(key('PageDown'))).toBe(1);
  });

  test('Page Up scrolls up', () => {
    expect(pageKeyDirection(key('PageUp'))).toBe(-1);
  });

  test.each([
    'ArrowDown',
    'ArrowUp',
    ' ',
    'Space',
    'End',
    'Home',
    'Enter',
    'pagedown', // `key` values are case-sensitive
    'PAGEUP',
    'Next', // legacy names, not produced by current browsers
    'Prior',
    '',
  ])('ignores %p', (k) => {
    expect(pageKeyDirection(key(k))).toBe(0);
  });

  describe.each(['ctrlKey', 'altKey', 'metaKey', 'shiftKey'] as const)('with %s', (modifier) => {
    test.each(['PageDown', 'PageUp'])('leaves %s to the browser', (k) => {
      expect(pageKeyDirection(key(k, { [modifier]: true }))).toBe(0);
    });
  });

  test('ignores keys with several modifiers', () => {
    expect(pageKeyDirection(key('PageDown', { ctrlKey: true, shiftKey: true }))).toBe(0);
  });

  test.each(['PageDown', 'PageUp'])('ignores %s the page already handled', (k) => {
    expect(pageKeyDirection(key(k, { defaultPrevented: true }))).toBe(0);
  });
});
