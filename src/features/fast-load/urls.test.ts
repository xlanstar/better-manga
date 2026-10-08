import { describe, expect, test } from 'bun:test';
import { httpUrl, otherPageUrl } from './urls';

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

describe('otherPageUrl', () => {
  test.each([
    'https://a.test/manga/x/2',
    'https://a.test/manga/x/1?page=2',
    'https://a.test/manga/x/1/',
  ])('another page on the origin: %s', (href) => {
    expect(otherPageUrl(href, PAGE)).toBe(href);
  });

  test('resolves a relative href', () => {
    expect(otherPageUrl('2', PAGE)).toBe('https://a.test/manga/x/2');
  });

  test.each([
    ['this page', PAGE],
    ['this page, other hash', `${PAGE}#top`],
    ['another host', 'https://b.test/manga/x/2'],
    ['another subdomain', 'https://m.a.test/manga/x/2'],
    ['another scheme', 'http://a.test/manga/x/2'],
    ['a non-http URL', 'javascript:void(0)'],
  ])('null for %s', (_, href) => {
    expect(otherPageUrl(href, PAGE)).toBeNull();
  });
});
