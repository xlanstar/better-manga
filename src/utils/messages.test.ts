import { describe, expect, test } from 'bun:test';
import { LOCALES, lookupMessage, parseLocalePreference } from './messages';

describe('parseLocalePreference', () => {
  test('keeps known locales', () => {
    expect(parseLocalePreference('zh_TW')).toBe('zh_TW');
  });

  test('falls back to auto', () => {
    expect(parseLocalePreference(undefined)).toBe('auto');
    expect(parseLocalePreference('fr')).toBe('auto');
    expect(parseLocalePreference(1)).toBe('auto');
  });
});

describe('lookupMessage', () => {
  const zh = { pageScroll_default: { message: '預設 $1' }, extName: { message: 'Better Manga' } };
  const en = { pageScroll_title: { message: 'Page Up / Down scrolling' } };

  test('maps dotted keys and substitutes', () => {
    expect(lookupMessage([zh], 'pageScroll.default', ['70%'])).toBe('預設 70%');
  });

  test('falls through catalogs in order', () => {
    expect(lookupMessage([zh, en], 'pageScroll.title')).toBe('Page Up / Down scrolling');
  });

  test('missing key or substitution', () => {
    expect(lookupMessage([zh, en], 'nope')).toBeUndefined();
    expect(lookupMessage([zh], 'pageScroll.default')).toBe('預設 ');
  });

  test('$$ is a literal dollar', () => {
    expect(lookupMessage([{ a: { message: '$$1' } }], 'a', ['x'])).toBe('$1');
  });

  test('ignores malformed entries', () => {
    expect(lookupMessage([{ a: { message: 1 } }, { a: { message: 'ok' } }], 'a')).toBe('ok');
  });
});

test('LOCALES matches src/locales', async () => {
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(new URL('../locales', import.meta.url)).map((f) =>
    f.replace(/\.yml$/, ''),
  );
  expect<string[]>([...LOCALES].toSorted()).toEqual(files.toSorted());
});
