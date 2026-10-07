import { describe, expect, test } from 'bun:test';
import { directChapterUrl } from './hipmh';

const ORIGIN = 'https://reader.hipmh.top';
const direct = (href: string) => directChapterUrl(href, ORIGIN);

describe('directChapterUrl', () => {
  test('main-site redirect → chapter on this origin', () => {
    expect(direct('https://m.hipmh.com/chapter/go?hid=abc123')).toBe(`${ORIGIN}/chapter/abc123`);
  });

  test('same-origin redirect → chapter on this origin', () => {
    expect(direct(`${ORIGIN}/chapter/go?hid=abc123`)).toBe(`${ORIGIN}/chapter/abc123`);
  });

  test('any host, any scheme the URL parser accepts', () => {
    expect(direct('http://other.test/chapter/go?hid=1')).toBe(`${ORIGIN}/chapter/1`);
  });

  test('accepts a trailing slash', () => {
    expect(direct('https://m.hipmh.com/chapter/go/?hid=x')).toBe(`${ORIGIN}/chapter/x`);
  });

  test('keeps a path prefix', () => {
    expect(direct('https://m.hipmh.com/zh/chapter/go?hid=x')).toBe(`${ORIGIN}/zh/chapter/x`);
  });

  test('uses the given origin, including its port', () => {
    expect(directChapterUrl('https://m.hipmh.com/chapter/go?hid=7', 'http://localhost:3000')).toBe(
      'http://localhost:3000/chapter/7',
    );
  });

  test('drops other query params and the hash', () => {
    expect(direct('https://m.hipmh.com/chapter/go?from=list&hid=9&x=1#top')).toBe(
      `${ORIGIN}/chapter/9`,
    );
  });

  test('uses the first hid when repeated', () => {
    expect(direct('https://m.hipmh.com/chapter/go?hid=a&hid=b')).toBe(`${ORIGIN}/chapter/a`);
  });

  describe('encodes the hid as one path segment', () => {
    test.each([
      ['a/b', 'a%2Fb'],
      ['a b', 'a%20b'],
      ['a+b', 'a%20b'], // `+` in a query string is a space
      ['a%2Bb', 'a%2Bb'],
      ['a?b', 'a%3Fb'],
      ['a#b', 'a'], // `#` starts the hash, so the hid ends before it
      ['a%23b', 'a%23b'],
      ['中文', '%E4%B8%AD%E6%96%87'],
      ['%E4%B8%AD', '%E4%B8%AD'],
      ['a%2F..%2Fb', 'a%2F..%2Fb'],
    ])('hid=%s → /chapter/%s', (hid, segment) => {
      expect(direct(`https://m.hipmh.com/chapter/go?hid=${hid}`)).toBe(
        `${ORIGIN}/chapter/${segment}`,
      );
    });
  });

  test('a dot-segment hid cannot leave the origin', () => {
    for (const hid of ['.', '..', '%2E%2E']) {
      const url = direct(`https://m.hipmh.com/chapter/go?hid=${hid}`);
      expect(url).not.toBeNull();
      expect(new URL(url!).origin).toBe(ORIGIN);
    }
  });

  test.each([
    ['no hid', 'https://m.hipmh.com/chapter/go'],
    ['empty hid', 'https://m.hipmh.com/chapter/go?hid='],
    ['hid without value', 'https://m.hipmh.com/chapter/go?hid'],
    ['other param only', 'https://m.hipmh.com/chapter/go?id=1'],
    ['hid only in the hash', 'https://m.hipmh.com/chapter/go#hid=1'],
    ['a real chapter', 'https://reader.hipmh.top/chapter/123'],
    ['a real chapter with hid', 'https://reader.hipmh.top/chapter/123?hid=1'],
    ['go not last', 'https://m.hipmh.com/chapter/go/x?hid=1'],
    ['longer last segment', 'https://m.hipmh.com/chapter/gone?hid=1'],
    ['longer chapter segment', 'https://m.hipmh.com/xchapter/go?hid=1'],
    ['no chapter segment', 'https://m.hipmh.com/go?hid=1'],
    ['double trailing slash', 'https://m.hipmh.com/chapter/go//?hid=1'],
    ['case differs', 'https://m.hipmh.com/Chapter/Go?hid=1'],
    ['root', 'https://m.hipmh.com/?hid=1'],
  ])('null for %s', (_, href) => {
    expect(direct(href)).toBeNull();
  });

  test.each([
    '',
    'chapter/go?hid=1',
    '/chapter/go?hid=1',
    '//m.hipmh.com/chapter/go?hid=1',
    'not a url',
  ])('null for unparsable (relative) href %p', (href) => {
    expect(direct(href)).toBeNull();
  });

  test.each(['javascript:/chapter/go?hid=1', 'data:text/html,/chapter/go?hid=1', 'mailto:x?hid=1'])(
    'never builds a URL from opaque %s',
    (href) => {
      const url = direct(href);
      expect(url === null || new URL(url).origin === ORIGIN).toBe(true);
    },
  );

  test('the result is a fixed point: it is not a redirect itself', () => {
    const url = direct('https://m.hipmh.com/chapter/go?hid=go')!;
    expect(url).toBe(`${ORIGIN}/chapter/go`);
    // `/chapter/go` without a hid is left alone.
    expect(direct(url)).toBeNull();
  });
});
