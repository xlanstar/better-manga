import { describe, expect, test } from 'bun:test';
import { sites, type Site } from './index';
import { siteSearch } from './search';

describe('siteSearch', () => {
  const site = {
    name: 'baozimh',
    label: '包子漫畫',
    matches: ['*://*.bzmh.org/*'],
  } satisfies Site;
  const [baozimh] = sites;

  test.each(['', '  ', '包子', 'BAOZI', 'bzmh', 'zmh.o', ' bzmh.org '])('matches %p', (q) => {
    expect(siteSearch(q)(site)).toBe(true);
  });

  test.each(['g站', 'hipmh', 'bzmh.com', 'evil.test'])('does not match %p', (q) => {
    expect(siteSearch(q)(site)).toBe(false);
  });

  test('a URL or subdomain the site covers matches', () => {
    expect(siteSearch('https://m.bzmh.org/manga/abc')(baozimh!)).toBe(true);
    expect(siteSearch('www.bzmh.org/x')(baozimh!)).toBe(true);
    expect(siteSearch('https://evil.test/?u=bzmh')(baozimh!)).toBe(false);
  });
});
