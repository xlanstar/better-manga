import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { MatchPattern } from 'wxt/utils/match-patterns';
import { featureIds, features as featureDefs, type FeatureId } from '@/features';
import {
  allMatches,
  followsSections,
  sectionFor,
  siteHosts,
  siteFor,
  sites,
  type Site,
  type SiteName,
} from './index';
import { sectionFeatures } from './layers';
import { defineSite } from './types';

const name = (url: string) => siteFor(url)?.name;
const covers = (site: Site, url: string) =>
  site.matches.some((pattern) => new MatchPattern(pattern).includes(url));
const testSite = (...matches: string[]): Site => ({ name: 't', label: 'T', matches });
/** What each section of a site runs with: its own layer merged over the site's. */
const sectionLayers = (site: Site) =>
  (['main', 'reader'] as const).map((section) => sectionFeatures(site, section));

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
    for (const layer of sites.flatMap(sectionLayers)) {
      for (const id of Object.keys(layer)) expect(featureIds).toContain(id as never);
    }
  });

  test('site feature configs give their feature something to act on', () => {
    for (const layer of sites.flatMap(sectionLayers)) {
      for (const [id, config] of Object.entries(layer)) {
        const { isUsable } = featureDefs[id as FeatureId] as { isUsable?: (c: object) => boolean };
        if (config && isUsable) expect(isUsable(config)).toBe(true);
      }
    }
  });

  // The content script treats a page as one site (disabling it retires the
  // whole instance) and `siteFor` returns the first match, so no two sites
  // may claim the same host. Checked against every site's patterns, not
  // `siteFor`, which would hide a later site's overlap. A site may match
  // only some paths of a host (8comic's reader), so its own `/` may not be.
  test('no host belongs to two sites', () => {
    for (const site of sites) {
      for (const host of siteHosts(site)) {
        const others = sites.filter((s) => s !== site && covers(s, `https://${host}/`));
        expect(others.map((s) => s.name)).toEqual([]);
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
    ['18mh', ['https://18mh.org/', 'https://m.18mh.org/manga/abc', 'http://www.18mh.org/']],
    ['hipmh', ['https://reader.hipmh.top/', 'https://reader.hipmh.top/chapter/123']],
    [
      'baozimh-com',
      [
        'https://www.baozimh.com/',
        'https://cn.webmota.com/comic/x',
        'https://www.twbzmg.com/comic/chapter/yiquanchaoren-one/0_400.html',
      ],
    ],
    ['copymanga', ['https://www.mangacopy.com/comic/baoye', 'https://copy4000.com/']],
    ['relamanhua', ['https://www.manga2026.xyz/comic/x', 'https://m.2024manga.com/']],
    ['manhuagui', ['https://www.manhuagui.com/comic/32602/', 'https://m.manhuagui.com/']],
    ['zaimanhua', ['https://zaimanhua.com/', 'https://m.zaimanhua.com/pages/comic/page?x=1']],
    ['dm5', ['https://www.dm5.com/m491499/', 'https://tel.dm5.com/', 'https://www.dm5.cn/']],
    ['1kkk', ['https://www.1kkk.com/ch1-491499/', 'https://m.1kkk.com/']],
    ['manhuaren', ['https://www.manhuaren.com/m491499/', 'https://manhuaren.com/']],
    ['mangabz', ['https://mangabz.com/m8759/']],
    ['xmanhua', ['https://www.xmanhua.com/m8759/']],
    ['yymanhua', ['https://yymanhua.com/54yy/']],
    ['komiic', ['https://komiic.com/comic/533', 'https://www.komiic.cc/']],
    [
      '8comic',
      [
        'https://www.8comic.com/html/102.html',
        'https://articles.onemoreplace.tw/online/new-102.html?ch=700',
      ],
    ],
    ['colamanga', ['https://www.yoyomanga.com/manga-pk25498/']],
    ['manwa', ['https://manwa.me/', 'https://www.manwarj.cc/book/1']],
    ['favcomic', ['https://www.favcomic.com/comic/chapter/1', 'https://m.favcomic.com/']],
    ['dogemanga', ['https://dogemanga.com/p/4jbpFwz9']],
    ['guazimanhua', ['https://www.guazimanhua.com/chapter.php?id=1602643']],
    ['liumanhua', ['https://www.liumanhua.com/219430/36808.html', 'https://m.liumanhua.com/']],
    ['mycomic', ['https://mycomic.com/chapters/810206']],
    ['vomicmh', ['https://www.vomicmh.com/', 'https://vomicmh.com/']],
    ['ykmh', ['https://www.ykmh.net/manhua/haibianzhiye/202619.html', 'https://m.ykmh.net/']],
    ['mhua5', ['https://www.mhua5.com/index.php/chapter/1871600', 'https://mhua5.com/']],
    ['miaoqumh', ['https://www.miaoqumh.org/233587/146728.html', 'https://m.miaoqumh.org/']],
    ['wmh1234', ['https://m.wmh1234.com/', 'https://reader.hqread.cc/r/NTUwNDkt']],
    ['mh160mh', ['https://www.mh160mh.com/kanmanhua/x/1.html', 'https://m.mh160mh.com/']],
    ['92mh', ['https://www.92mh.com/']],
    ['cmanhua', ['https://cmanhua.com/ReadComic?id=69d4da0bf111574e5c5e567b']],
    ['bilimanga', ['https://www.bilimanga.net/read/1/2.html']],
    ['gfmh', ['https://gfmh.app/376509/112565.html', 'https://www.gfmh.app/']],
    ['manben', ['https://www.manben.com/m497346/']],
    ['18comic', ['https://18comic.ink/photo/1438783', 'https://18comic.vip/']],
    ['wnacg', ['https://www.wnacg.com/photos-slide-aid-394133.html', 'https://www.wn002.cfd/']],
    ['noyacg', ['https://noymanga.com/', 'https://www.noymanga.com/']],
    ['hanime1', ['https://hanime1.me/', 'https://hanimeone.me/comic/159839/1']],
    ['roumanwu', ['https://rouman5.com/books/x/3', 'https://roum29.xyz/']],
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
    // Other sites, services or redirect-only hosts of supported domains.
    'https://www.mhgui.com/',
    'https://cf.mhgui.com/',
    'https://i.zaimanhua.com/',
    'https://www.komiic.com/',
    'https://articles.onemoreplace.tw/',
    'https://onemoreplace.tw/',
    'https://m.dm5.cn/',
    'https://yoyomanga.com/',
    'https://www.colamanga.com/',
    'https://mwmissing11.cc/',
    'https://www.dogemanga.com/',
    'https://www.cmanhua.com/',
    'https://guazimanhua.com/',
    'https://hqread.cc/',
    'https://mh160mh.com/',
    'https://www.bilicomic.net/',
    'https://2025copy.com/',
    'https://relamanhua.org/',
    'https://18comic.org/',
    'https://noy1.top/',
    'https://umami.noymanga.com/',
    'https://www.hanime1.me/',
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
    expect(sites as Site[]).toContain(siteFor('https://g-mh.org/')!);
  });
});

describe('siteHosts', () => {
  test.each([
    ['baozimh', ['baozimh.org', 'bzmh.org', 'm.baozimh.one']],
    ['g-mh', ['m.g-mh.org', 'g-mh.org', 'godamh.com']],
    ['18mh', ['18mh.org']],
    ['hipmh', ['reader.hipmh.top']],
    ['8comic', ['www.8comic.com', 'articles.onemoreplace.tw']],
    ['relamanhua', ['manga2024.com', '2024manga.com', 'manga2025.com', 'manga2026.xyz']],
  ])('registered site %s', (siteName, hosts) => {
    expect(siteHosts(sites.find((s) => s.name === siteName)!)).toEqual(hosts);
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

const rewriteLink = () => null;

describe.each([
  [
    'baozimh-com',
    ['https://tw.twmanga.com/comic/chapter/x/0_1.html'],
    ['https://tw.twmanga.com/comic/x'],
  ],
  [
    'copymanga',
    ['https://www.mangacopy.com/comic/baoye/chapter/10d06a94'],
    ['https://www.mangacopy.com/comic/baoye'],
  ],
  [
    'relamanhua',
    ['https://www.manga2026.xyz/comic/x/chapter/765e73fe'],
    ['https://www.manga2026.xyz/comic/x'],
  ],
  [
    'manhuagui',
    ['https://tw.manhuagui.com/comic/32602/441494.html'],
    ['https://tw.manhuagui.com/comic/32602/'],
  ],
  [
    'zaimanhua',
    [
      'https://manhua.zaimanhua.com/view/x/64645/128172',
      'https://m.zaimanhua.com/pages/comic/page?comic_id=64645&chapter_id=128172',
    ],
    ['https://manhua.zaimanhua.com/details/64645', 'https://www.zaimanhua.com/info/x.html'],
  ],
  ['dogemanga', ['https://dogemanga.com/p/4jbpFwz9'], ['https://dogemanga.com/m/gt9rgUMw']],
  ['mycomic', ['https://mycomic.com/cn/chapters/810206'], ['https://mycomic.com/comics/6591']],
  ['cmanhua', ['https://cmanhua.com/ReadComic?id=69d4'], ['https://cmanhua.com/comic/fangsi']],
])('sectionFor %s', (siteName, readerUrls, mainUrls) => {
  const site = sites.find((s) => s.name === siteName)!;
  test.each(readerUrls)('reader: %s', (url) => expect(sectionFor(site, url)).toBe('reader'));
  test.each(mainUrls)('main site: %s', (url) => expect(sectionFor(site, url)).toBe('main'));
});

describe('sectionFor (registered sites)', () => {
  const baozimh = sites.find((s) => s.name === 'baozimh')!;

  test.each([
    'https://bzmh.org/manga/hailangdepaomo/29796-041047940-1',
    'https://m.baozimh.org/manga/abc/1-2-3/',
    'https://m.baozimh.one/manga/abc/1',
  ])('包子漫畫 reader: %s', (url) => {
    expect(sectionFor(baozimh, url)).toBe('reader');
  });

  test.each([
    'https://bzmh.org/',
    'https://bzmh.org/manga/hailangdepaomo',
    'https://bzmh.org/manga',
  ])('包子漫畫 main site: %s', (url) => {
    expect(sectionFor(baozimh, url)).toBe('main');
  });

  const mh18 = sites.find((s) => s.name === '18mh')!;

  test.each([
    'https://18mh.org/manga/nizhao/36-14192-25',
    'https://www.18mh.org/manga/1227-zhenzhengdemaji/5539-30043-9',
  ])('18漫畫 reader: %s', (url) => {
    expect(sectionFor(mh18, url)).toBe('reader');
  });

  test.each(['https://18mh.org/', 'https://18mh.org/manga/nizhao', 'https://18mh.org/hots'])(
    '18漫畫 main site: %s',
    (url) => {
      expect(sectionFor(mh18, url)).toBe('main');
    },
  );
});

describe('sections', () => {
  const hide = ['.ad'];
  const site: Site = {
    ...testSite('*://a.test/*', '*://reader.a.test/*'),
    features: { blockAds: { hide }, pageKeys: { container: '#c' } },
    sections: {
      main: { features: { autoContinue: { selector: '.go' } } },
      reader: {
        matches: ['*://reader.a.test/*', '*://a.test/read/*'],
        features: {
          blockAds: { remove: ['#x'] },
          skipRedirects: { rewriteLink },
          pageKeys: false,
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

  describe('followsSections', () => {
    test('follows the top frame of a site with a reader', () => {
      expect(followsSections(site, 'https:', true)).toBe(true);
      expect(followsSections(site, 'http:', true)).toBe(true);
    });

    test.each([
      ['a subframe', 'https:', false],
      ['a top frame without an http(s) URL', 'about:', true],
    ] as const)('not %s', (_, protocol, isTop) => {
      expect(followsSections(site, protocol, isTop)).toBe(false);
    });

    test('not a site without a reader', () => {
      expect(followsSections(testSite('*://a.test/*'), 'https:', true)).toBe(false);
    });
  });
});
