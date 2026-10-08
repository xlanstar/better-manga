import { describe, expect, test } from 'bun:test';
import { isSameChapter, workIdFromHref } from './chapter';

const BASE = 'https://bzmh.org/manga/a/1-2-3';

describe('workIdFromHref', () => {
  test.each([
    ['/manga/conggebulindaogebulinshen', '/manga/conggebulindaogebulinshen'],
    ['/manga/a/', '/manga/a'],
    [
      'https://m.hipmh.com/works/bTo0Njg5-ba-jian-jiu-yi-ci-4681',
      '/works/bTo0Njg5-ba-jian-jiu-yi-ci-4681',
    ],
    ['../b?x=1#y', '/manga/b'],
  ])('%s → %s', (href, id) => {
    expect(workIdFromHref(href, BASE)).toBe(id);
  });

  test('the same work on another domain has the same id', () => {
    expect(workIdFromHref('https://m.baozimh.one/manga/a', BASE)).toBe(
      workIdFromHref('https://baozimh.org/manga/a/', BASE),
    );
  });

  test.each([null, '', '  ', '/', 'https://bzmh.org', 'javascript:alert(1)', 'mailto:a@b.c'])(
    'null for %p',
    (href) => {
      expect(workIdFromHref(href, BASE)).toBeNull();
    },
  );
});

describe('isSameChapter', () => {
  test.each([
    ['https://bzmh.org/manga/a/1', 'https://bzmh.org/manga/a/1'],
    ['https://bzmh.org/manga/a/1', 'https://m.baozimh.one/manga/a/1'],
    ['https://bzmh.org/manga/a/1/', 'https://bzmh.org/manga/a/1'],
    ['https://bzmh.org/manga/a/1', 'https://bzmh.org/manga/a/1#top'],
  ])('%s is %s', (a, b) => {
    expect(isSameChapter(a, b)).toBe(true);
  });

  test.each([
    ['https://bzmh.org/manga/a/1', 'https://bzmh.org/manga/a/2'],
    ['https://bzmh.org/manga/a/1', 'https://bzmh.org/manga/a/1?page=2'],
    ['https://bzmh.org/manga/a/1', 'not a url'],
  ])('%s is not %s', (a, b) => {
    expect(isSameChapter(a, b)).toBe(false);
  });
});
