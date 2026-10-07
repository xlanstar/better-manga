import { describe, expect, test } from 'bun:test';
import { siteUrlFor, type FrameLocation } from './site-url';

/** A `FrameLocation` for `href`, as the browser would expose it. */
function at(href: string, ancestorOrigins?: string[]): FrameLocation {
  const { protocol, origin, pathname, search } = new URL(href);
  return { protocol, origin, pathname, search, ancestorOrigins };
}

describe('siteUrlFor', () => {
  describe('http(s) frames use their own URL', () => {
    test.each([
      ['https://g-mh.org/', 'https://g-mh.org/'],
      ['http://g-mh.org/manga/abc', 'http://g-mh.org/manga/abc'],
      ['https://g-mh.org/a?b=c', 'https://g-mh.org/a?b=c'],
      ['https://g-mh.org:8443/a', 'https://g-mh.org:8443/a'],
    ])('%s → %s', (href, expected) => {
      expect(siteUrlFor(at(href), '')).toBe(expected);
    });

    test('drops the hash and credentials', () => {
      expect(siteUrlFor(at('https://u:p@g-mh.org/a?b#c'), '')).toBe('https://g-mh.org/a?b');
    });

    test('ignores ancestors and referrer', () => {
      const loc = at('https://g-mh.org/x', ['https://evil.test']);
      expect(siteUrlFor(loc, 'https://other.test/')).toBe('https://g-mh.org/x');
    });
  });

  describe('about:blank / about:srcdoc frames', () => {
    test('use the outermost ancestor origin', () => {
      const loc = at('about:blank', ['https://ads.test', 'https://g-mh.org']);
      expect(siteUrlFor(loc, 'https://ads.test/frame')).toBe('https://g-mh.org/');
    });

    test('a single ancestor', () => {
      expect(siteUrlFor(at('about:srcdoc', ['https://reader.hipmh.top']), '')).toBe(
        'https://reader.hipmh.top/',
      );
    });

    test('keep the ancestor port', () => {
      expect(siteUrlFor(at('about:blank', ['http://localhost:3000']), '')).toBe(
        'http://localhost:3000/',
      );
    });

    test('fall back to the referrer origin without ancestorOrigins (Firefox)', () => {
      expect(siteUrlFor(at('about:blank'), 'https://m.g-mh.org/manga/abc?x#y')).toBe(
        'https://m.g-mh.org/',
      );
    });

    test('fall back to the referrer with an empty ancestor list', () => {
      expect(siteUrlFor(at('about:blank', []), 'https://g-mh.org/a')).toBe('https://g-mh.org/');
    });

    test('give "" with neither ancestors nor referrer', () => {
      expect(siteUrlFor(at('about:blank'), '')).toBe('');
      expect(siteUrlFor(at('about:blank', []), '')).toBe('');
    });

    test.each([
      ['opaque ancestor', ['null'], ''],
      ['opaque outermost ancestor', ['https://g-mh.org', 'null'], ''],
      // A non-empty list wins over the referrer, even if its entry is unusable.
      ['empty ancestor string', [''], ''],
    ])('%s gives ""', (_, origins, expected) => {
      expect(siteUrlFor(at('about:blank', origins), 'https://g-mh.org/x')).toBe(expected);
    });

    test.each(['not a url', 'about:blank', 'data:text/html,x', 'null'])(
      'give "" for an unusable referrer %p',
      (referrer) => {
        expect(siteUrlFor(at('about:blank'), referrer)).toBe('');
      },
    );
  });

  test.each(['data:text/html,x', 'blob:https://g-mh.org/uuid', 'file:///tmp/a.html'])(
    'other non-http frames (%s) resolve the same way',
    (href) => {
      expect(siteUrlFor(at(href, ['https://g-mh.org']), '')).toBe('https://g-mh.org/');
      expect(siteUrlFor(at(href), '')).toBe('');
    },
  );

  test('accepts a DOMStringList-like ancestorOrigins', () => {
    const list = { length: 2, 0: 'https://a.test', 1: 'https://g-mh.org' };
    const loc: FrameLocation = { ...at('about:blank'), ancestorOrigins: list };
    expect(siteUrlFor(loc, '')).toBe('https://g-mh.org/');
  });
});
