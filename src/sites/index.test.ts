import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { MatchPattern } from 'wxt/utils/match-patterns';
import { featureIds } from '@/features';
import type { SectionFeatures } from '@/features/settings';
import {
  allMatches,
  sectionFeatures,
  sectionFor,
  settingsFeatures,
  siteHosts,
  siteMatchesQuery,
  siteFor,
  sites,
  type Site,
  type SiteName,
} from './index';
import { defineSite } from './types';

const name = (url: string) => siteFor(url)?.name;
const covers = (site: Site, url: string) =>
  site.matches.some((pattern) => new MatchPattern(pattern).includes(url));
const testSite = (...matches: string[]): Site => ({ name: 't', label: 'T', matches });
/** A site's own layer and its sections' layers. */
const featureLayers = (site: Site) => [
  site.features,
  site.sections?.main?.features,
  site.sections?.reader?.features,
];

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
    const readerMatches = sites.flatMap((s) => s.sections?.reader?.matches ?? []);
    for (const pattern of [...allMatches, ...readerMatches]) {
      expect(() => new MatchPattern(pattern)).not.toThrow();
    }
  });

  test("a reader's hosts belong to its site", () => {
    for (const site of sites) {
      const reader = site.sections?.reader;
      if (!reader) continue;
      for (const host of siteHosts({ ...site, matches: reader.matches })) {
        expect(covers(site, `https://${host}/`)).toBe(true);
      }
    }
  });

  test('no pattern is listed twice', () => {
    expect(new Set(allMatches).size).toBe(allMatches.length);
  });

  test('patterns only use http(s) schemes', () => {
    for (const pattern of allMatches) expect(pattern).toMatch(/^(\*|https?):\/\//);
  });

  test('site feature configs only name known features', () => {
    for (const layer of sites.flatMap(featureLayers)) {
      for (const id of Object.keys(layer ?? {})) expect(featureIds).toContain(id as never);
    }
  });

  test('site-specific features are configured with something to act on', () => {
    for (const layer of sites.flatMap(featureLayers)) {
      const { blockAds, autoContinue, skipRedirects } = layer ?? {};
      if (blockAds) expect([...(blockAds.hide ?? []), ...(blockAds.remove ?? [])]).not.toEqual([]);
      if (autoContinue) expect(autoContinue.selector?.trim()).toBeTruthy();
      if (skipRedirects) expect(skipRedirects.rewriteLink).toBeFunction();
    }
  });

  // The content script treats a page as one site (disabling it retires the
  // whole instance) and `siteFor` returns the first match, so no two sites
  // may claim the same host. Checked against every site's patterns, not
  // `siteFor`, which would hide a later site's overlap.
  test('no host belongs to two sites', () => {
    for (const site of sites) {
      for (const host of siteHosts(site)) {
        const url = `https://${host}/`;
        expect(sites.filter((s) => covers(s, url)).map((s) => s.name)).toEqual([site.name]);
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

describe('siteFor', () => {
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
  ])('%s', (siteName, urls) => {
    test.each(urls)('matches %s', (url) => {
      expect(name(url)).toBe(siteName as SiteName);
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
    expect(siteFor(url)).toBeNull();
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
    expect(siteFor(url)).toBeNull();
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
  ])('gives null for unparsable %p', (url) => {
    expect(siteFor(url)).toBeNull();
  });

  test('ignores case in scheme and host', () => {
    expect(name('HTTPS://G-MH.ORG/Manga')).toBe('g-mh');
    expect(name('https://M.BaoZiMH.org/')).toBe('baozimh');
  });

  test('ignores port, credentials, query and hash', () => {
    expect(name('https://g-mh.org:8443/x')).toBe('g-mh');
    expect(name('https://user:pw@g-mh.org/')).toBe('g-mh');
    expect(name('https://g-mh.org/a?b=c#d')).toBe('g-mh');
  });

  test('matches a URL without a path', () => {
    expect(name('https://g-mh.org')).toBe('g-mh');
  });

  test('matches a fully-qualified host with a trailing dot, like Chrome', () => {
    expect(name('https://g-mh.org./')).toBe('g-mh');
    expect(name('https://m.baozimh.org./manga')).toBe('baozimh');
    expect(name('https://reader.hipmh.top./chapter/1')).toBe('hipmh');
  });

  test('strips only one trailing dot', () => {
    expect(siteFor('https://g-mh.org../')).toBeNull();
  });

  test('returns the registered site object itself', () => {
    expect(sites).toContain(siteFor('https://g-mh.org/')!);
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

const rewriteLink = () => null;

describe('sections', () => {
  const hide = ['.ad'];
  const site: Site = {
    ...testSite('*://a.test/*', '*://reader.a.test/*'),
    features: { blockAds: { hide }, pageDistance: { container: '#c' } },
    sections: {
      main: { features: { autoContinue: { selector: '.go' } } },
      reader: {
        matches: ['*://reader.a.test/*', '*://a.test/read/*'],
        features: {
          blockAds: { remove: ['#x'] },
          skipRedirects: { rewriteLink },
          pageDistance: false,
        },
      },
    },
  };

  describe('sectionFor', () => {
    test.each([
      ['https://reader.a.test/chapter/1', 'reader'],
      ['https://a.test/read/1', 'reader'],
      ['https://a.test/', 'main'],
      ['https://a.test/manga/read', 'main'],
      ['https://reader.a.test./x', 'reader'],
      ['not a url', 'main'],
    ])('%s is on the %s', (url, section) => {
      expect(sectionFor(site, url)).toBe(section as 'main' | 'reader');
    });

    test('a site without a reader is all main site', () => {
      expect(sectionFor(testSite('*://a.test/*'), 'https://a.test/read/1')).toBe('main');
    });
  });

  describe('sectionFeatures', () => {
    test("merges the section's configs over the site's, feature by feature", () => {
      expect(sectionFeatures(site, 'reader')).toEqual({
        blockAds: { hide, remove: ['#x'] },
        skipRedirects: { rewriteLink },
        pageDistance: false,
      });
      expect(sectionFeatures(site, 'main')).toEqual({
        blockAds: { hide },
        pageDistance: { container: '#c' },
        autoContinue: { selector: '.go' },
      });
    });

    test('a section can configure a feature the site turned off', () => {
      const s: Site = {
        ...site,
        features: { blockAds: false },
        sections: { main: { features: { blockAds: { hide } } } },
      };
      expect(sectionFeatures(s, 'main').blockAds).toEqual({ hide });
    });

    test('undefined section values keep the site config', () => {
      const s: Site = { ...site, sections: { main: { features: { blockAds: undefined } } } };
      expect(sectionFeatures(s, 'main').blockAds).toEqual({ hide });
    });

    test('without sections, it is the site layer', () => {
      expect(sectionFeatures(testSite(), 'reader')).toEqual({});
    });

    test('sections set adapters, not user option defaults', () => {
      // @ts-expect-error `ratio` is a user option: its default is per site.
      const features: SectionFeatures = { pageDistance: { ratio: 0.5 } };
      expect(features).toBeDefined();
    });
  });

  describe('settingsFeatures', () => {
    test('lists a feature any section configures', () => {
      const layer = settingsFeatures(site);
      expect(layer.autoContinue).toEqual({ selector: '.go' });
      expect(layer.skipRedirects).toEqual({ rewriteLink });
      // On in the main site, off in the reader: still listed.
      expect(layer.pageDistance).toEqual({ container: '#c' });
    });

    test('is false only where every section turns it off', () => {
      const s: Site = {
        ...site,
        features: { smoothScroll: false },
        sections: { reader: { matches: ['*://a.test/r/*'], features: { pageDistance: false } } },
      };
      expect(settingsFeatures(s).smoothScroll).toBe(false);
      expect(settingsFeatures(s).pageDistance).toBeUndefined();
    });

    test('without sections, it is the site layer', () => {
      const features = { blockAds: { hide } };
      expect(settingsFeatures({ ...testSite(), features })).toBe(features);
    });
  });
});
