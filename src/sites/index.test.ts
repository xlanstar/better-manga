import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { MatchPattern } from 'wxt/utils/match-patterns';
import { featureIds } from '@/features';
import {
  allMatches,
  siteHosts,
  siteMatchesQuery,
  sites,
  sitesFor,
  type Site,
  type SiteName,
} from './index';
import { defineSite } from './types';

const names = (url: string) => sitesFor(url).map((s) => s.name);
const testSite = (...matches: string[]): Site => ({ name: 't', label: 'T', matches });

describe('site registry', () => {
  test('names are unique', () => {
    const all = sites.map((s) => s.name);
    expect(new Set(all).size).toBe(all.length);
  });

  test('every site has a label and at least one match pattern', () => {
    for (const site of sites) {
      expect(site.label.trim()).not.toBe('');
      expect(site.matches.length).toBeGreaterThan(0);
    }
  });

  test('every match pattern parses', () => {
    for (const pattern of allMatches) expect(() => new MatchPattern(pattern)).not.toThrow();
  });

  test('no pattern is listed twice', () => {
    expect(new Set(allMatches).size).toBe(allMatches.length);
  });

  test('patterns only use http(s) schemes', () => {
    for (const pattern of allMatches) expect(pattern).toMatch(/^(\*|https?):\/\//);
  });

  test('site feature configs only name known features', () => {
    for (const site of sites) {
      for (const id of Object.keys(site.features ?? {})) expect(featureIds).toContain(id as never);
    }
  });

  test('site-specific features are configured with something to act on', () => {
    for (const site of sites) {
      const { blockAds, autoContinue, skipRedirects } = site.features ?? {};
      if (blockAds) expect([...(blockAds.hide ?? []), ...(blockAds.remove ?? [])]).not.toEqual([]);
      if (autoContinue) expect(autoContinue.selector?.trim()).toBeTruthy();
      if (skipRedirects) expect(skipRedirects.rewriteLink).toBeFunction();
    }
  });

  // The content script treats a page as one site (disabling it retires the
  // whole instance), so no two sites may claim the same host.
  test('no host belongs to two sites', () => {
    for (const site of sites) {
      for (const host of siteHosts(site)) {
        expect(sitesFor(`https://${host}/`).map((s) => s.name)).toEqual([site.name]);
      }
    }
  });

  test('docs/manga-sites.md lists every matched host', () => {
    const docs = readFileSync(new URL('../../docs/manga-sites.md', import.meta.url), 'utf8');
    for (const site of sites) {
      for (const host of siteHosts(site)) expect(docs).toContain(`\`${host}\``);
    }
  });
});

describe('allMatches', () => {
  test('is every site pattern, flattened in registry order', () => {
    expect(allMatches).toEqual(sites.flatMap((s) => s.matches));
  });
});

describe('defineSite', () => {
  test('returns its argument unchanged', () => {
    const input = { name: 'x', label: 'X', matches: ['*://x.test/*'] };
    expect(defineSite(input)).toBe(input);
  });
});

describe('sitesFor', () => {
  describe.each([
    [
      'baozimh',
      [
        'https://baozimh.org/',
        'https://m.baozimh.org/manga/abc',
        'https://www.baozimh.org/',
        'https://bzmh.org/',
        'https://www.bzmh.org/x',
        'https://m.bzmh.org/manga/abc/0_1.html',
        'https://a.b.bzmh.org/',
        'https://m.baozimh.one/',
        'http://m.baozimh.one/manga/abc',
      ],
    ],
    [
      'g-mh',
      [
        'https://g-mh.org/',
        'https://m.g-mh.org/manga/abc',
        'https://godamh.com/manga/abc',
        'http://godamh.com/',
      ],
    ],
    ['hipmh', ['https://reader.hipmh.top/', 'https://reader.hipmh.top/chapter/123']],
  ])('%s', (name, urls) => {
    test.each(urls)('matches %s', (url) => {
      expect(names(url)).toEqual([name as SiteName]);
    });
  });

  test.each([
    // Unrelated hosts sharing a name with a supported one (see site files).
    'https://baozimh.one/',
    'https://m.godamh.com/',
    'https://www.g-mh.org/',
    'https://www.godamh.com/',
    'https://m.hipmh.com/chapter/go?hid=1',
    'https://hipmh.top/',
    'https://hipmh.com/',
    // The original baozimh.com network is a different site.
    'https://www.baozimh.com/',
    // Lookalikes.
    'https://evilbaozimh.org/',
    'https://baozimh.org.evil.test/',
    'https://xg-mh.org/',
    'https://g-mh.org.evil.test/',
    'https://reader.hipmh.top.evil.test/',
    'https://evil.test/?u=https://g-mh.org/',
    'https://evil.test/g-mh.org/',
    'https://example.com/',
  ])('does not match %s', (url) => {
    expect(sitesFor(url)).toEqual([]);
  });

  test.each([
    'ftp://g-mh.org/',
    'ws://g-mh.org/',
    'wss://g-mh.org/',
    'file:///g-mh.org/',
    'chrome://extensions/',
    'about:blank',
    'about:srcdoc',
    'data:text/html,g-mh.org',
    'javascript:alert(1)',
    'blob:https://g-mh.org/uuid',
  ])('does not match non-http URL %s', (url) => {
    expect(sitesFor(url)).toEqual([]);
  });

  test.each([
    '',
    ' ',
    'g-mh.org',
    '//g-mh.org/',
    '/manga/abc',
    'not a url',
    'https://',
    'http://[',
  ])('gives [] for unparsable %p', (url) => {
    expect(sitesFor(url)).toEqual([]);
  });

  test('ignores case in scheme and host', () => {
    expect(names('HTTPS://G-MH.ORG/Manga')).toEqual(['g-mh']);
    expect(names('https://M.BaoZiMH.org/')).toEqual(['baozimh']);
  });

  test('ignores port, credentials, query and hash', () => {
    expect(names('https://g-mh.org:8443/x')).toEqual(['g-mh']);
    expect(names('https://user:pw@g-mh.org/')).toEqual(['g-mh']);
    expect(names('https://g-mh.org/a?b=c#d')).toEqual(['g-mh']);
  });

  test('matches a URL without a path', () => {
    expect(names('https://g-mh.org')).toEqual(['g-mh']);
  });

  test('matches a fully-qualified host with a trailing dot, like Chrome', () => {
    expect(names('https://g-mh.org./')).toEqual(['g-mh']);
    expect(names('https://m.baozimh.org./manga')).toEqual(['baozimh']);
    expect(names('https://reader.hipmh.top./chapter/1')).toEqual(['hipmh']);
  });

  test('strips only one trailing dot', () => {
    expect(sitesFor('https://g-mh.org../')).toEqual([]);
  });

  test('returns the registered site objects themselves', () => {
    const [site] = sitesFor('https://g-mh.org/');
    expect(sites).toContain(site!);
  });

  test('returns a new array each call', () => {
    expect(sitesFor('https://g-mh.org/')).not.toBe(sitesFor('https://g-mh.org/'));
  });
});

describe('siteHosts', () => {
  test('registered sites', () => {
    expect(Object.fromEntries(sites.map((s) => [s.name, siteHosts(s)]))).toEqual({
      baozimh: ['baozimh.org', 'bzmh.org', 'm.baozimh.one'],
      'g-mh': ['m.g-mh.org', 'g-mh.org', 'godamh.com'],
      hipmh: ['reader.hipmh.top'],
    });
  });

  test.each([
    ['*://*.example.com/*', 'example.com'],
    ['*://example.com/*', 'example.com'],
    ['https://example.com/*', 'example.com'],
    ['http://example.com/reader/*', 'example.com'],
    ['*://m.example.com/', 'm.example.com'],
    ['*://*.m.example.com/a/b/*', 'm.example.com'],
  ])('%s → %s', (pattern, host) => {
    expect(siteHosts(testSite(pattern))).toEqual([host]);
  });

  test('keeps pattern order', () => {
    expect(siteHosts(testSite('*://b.test/*', '*://a.test/*'))).toEqual(['b.test', 'a.test']);
  });

  test('lists a host once, even if several patterns cover it', () => {
    expect(siteHosts(testSite('*://*.a.test/*', 'https://a.test/x/*', '*://b.test/*'))).toEqual([
      'a.test',
      'b.test',
    ]);
  });

  test('keeps a non-leading wildcard as is', () => {
    expect(siteHosts(testSite('*://*/*'))).toEqual(['*']);
  });

  test('no patterns gives no hosts', () => {
    expect(siteHosts(testSite())).toEqual([]);
  });

  test('returns a new array each call', () => {
    const [site] = sites;
    expect(siteHosts(site!)).not.toBe(siteHosts(site!));
  });
});

describe('siteMatchesQuery', () => {
  const site = {
    name: 'baozimh',
    label: '包子漫畫',
    matches: ['*://*.bzmh.org/*'],
  } satisfies Site;
  const [baozimh] = sites;

  test.each(['', '  ', '包子', 'BAOZI', 'bzmh', 'zmh.o', ' bzmh.org '])('matches %p', (q) => {
    expect(siteMatchesQuery(site, q)).toBe(true);
  });

  test.each(['g站', 'hipmh', 'bzmh.com', 'evil.test'])('does not match %p', (q) => {
    expect(siteMatchesQuery(site, q)).toBe(false);
  });

  test('a URL or subdomain the site covers matches', () => {
    expect(siteMatchesQuery(baozimh!, 'https://m.bzmh.org/manga/abc')).toBe(true);
    expect(siteMatchesQuery(baozimh!, 'www.bzmh.org/x')).toBe(true);
    expect(siteMatchesQuery(baozimh!, 'https://evil.test/?u=bzmh')).toBe(false);
  });
});
