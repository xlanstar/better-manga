import { describe, expect, test } from 'bun:test';
import { httpUrl } from './url';

const PAGE = 'https://a.test/manga/x/1';

describe('httpUrl', () => {
  test.each([
    ['https://img.test/1.webp', 'https://img.test/1.webp'],
    ['//img.test/1.webp', 'https://img.test/1.webp'],
    ['/img/1.webp', 'https://a.test/img/1.webp'],
    ['2.webp', 'https://a.test/manga/x/2.webp'],
    ['http://img.test/1.webp', 'http://img.test/1.webp'],
  ])('resolves %p', (raw, url) => {
    expect(httpUrl(raw, PAGE)).toBe(url);
  });

  test.each([null, '', '  ', 'data:image/gif;base64,R0lG', 'javascript:alert(1)', 'http://[::1'])(
    'null for %p',
    (raw) => {
      expect(httpUrl(raw, PAGE)).toBeNull();
    },
  );
});
