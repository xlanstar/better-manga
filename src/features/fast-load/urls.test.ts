import { describe, expect, test } from 'bun:test';
import { otherPageUrl } from './urls';

const PAGE = 'https://a.test/manga/x/1';

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
