import { describe, expect, test } from 'bun:test';
import { CHAPTER_START } from './history';
import { isNearStart, positionAt } from './position';

const box = (top: number, height = 1000) => ({ top, height });

describe('positionAt', () => {
  test('no images: the start', () => {
    expect(positionAt([])).toEqual(CHAPTER_START);
  });

  test('above the first image (e.g. a header on screen): the start', () => {
    expect(positionAt([box(200), box(1200)])).toEqual(CHAPTER_START);
  });

  test('the image reaching below the top of the screen, and how far into it', () => {
    expect(positionAt([box(-1250), box(-250), box(750)])).toEqual({ page: 1, offset: 0.25 });
  });

  test('an image just scrolled past is not the one on screen', () => {
    expect(positionAt([box(-1000), box(0)])).toEqual({ page: 1, offset: 0 });
  });

  test('in a gap between images: the next one, from its top', () => {
    expect(positionAt([box(-1100), box(50)])).toEqual({ page: 1, offset: 0 });
  });

  test('images not laid out yet are skipped, but keep their index', () => {
    expect(positionAt([box(-500, 0), box(-500), box(500, 0)])).toEqual({ page: 1, offset: 0.5 });
  });

  test('past the last image: its end', () => {
    expect(positionAt([box(-3000), box(-2000), box(-1000, 0)])).toEqual({ page: 1, offset: 1 });
  });

  test('none laid out: the start', () => {
    expect(positionAt([box(0, 0), box(0, 0)])).toEqual(CHAPTER_START);
  });

  test('rounds the offset to a thousandth', () => {
    expect(positionAt([box(-1, 3)]).offset).toBe(0.333);
  });
});

describe('isNearStart', () => {
  test.each([
    [CHAPTER_START, true],
    [{ page: 0, offset: 0.2 }, true],
    [{ page: 0, offset: 0.25 }, false],
    [{ page: 1, offset: 0 }, false],
  ])('%p → %p', (position, near) => {
    expect(isNearStart(position)).toBe(near);
  });
});
