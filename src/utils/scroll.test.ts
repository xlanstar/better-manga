import { describe, expect, test } from 'bun:test';
import { pageKeyDirection, type PageKeyEvent } from './scroll';

const key = (k: string, extra: Partial<PageKeyEvent> = {}): PageKeyEvent => ({
  key: k,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
  defaultPrevented: false,
  ...extra,
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
