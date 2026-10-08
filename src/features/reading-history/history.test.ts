import { describe, expect, test } from 'bun:test';
import {
  CHAPTER_START,
  MAX_HISTORY_ENTRIES,
  sanitizeChange,
  sanitizeHistory,
  withChange,
  withEntry,
  withoutEntry,
  workKey,
  type HistoryEntry,
} from './history';

const entry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  site: 'baozimh',
  workId: '/manga/a',
  workTitle: 'A',
  chapterTitle: '第1话',
  url: 'https://bzmh.org/manga/a/1',
  position: { page: 3, offset: 0.5 },
  updatedAt: 1000,
  ...overrides,
});

describe('workKey', () => {
  test('differs by site and by work', () => {
    const keys = [
      entry(),
      entry({ site: 'g-mh' }),
      entry({ workId: '/manga/b' }),
      // No separator to confuse.
      entry({ site: 'a:b', workId: 'c' }),
      entry({ site: 'a', workId: 'b:c' }),
    ].map(workKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('withEntry', () => {
  test('puts the entry first', () => {
    const old = entry({ workId: '/manga/b' });
    const next = entry({ updatedAt: 2000 });
    expect(withEntry([old], next)).toEqual([next, old]);
  });

  test("replaces the work's entry", () => {
    const next = entry({ chapterTitle: '第2话', updatedAt: 2000 });
    const other = entry({ site: 'g-mh' });
    expect(withEntry([other, entry()], next)).toEqual([next, other]);
  });

  test(`keeps the latest ${MAX_HISTORY_ENTRIES} works`, () => {
    const full = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) =>
      entry({ workId: `/manga/${i}`, updatedAt: MAX_HISTORY_ENTRIES - i }),
    );
    const next = entry({ workId: '/manga/new', updatedAt: 9999 });
    const history = withEntry(full, next);
    expect(history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(history[0]).toBe(next);
    expect(history.at(-1)).toBe(full.at(-2)!);
  });
});

describe('withoutEntry', () => {
  test("drops the entry's work only", () => {
    const other = entry({ workId: '/manga/b' });
    expect(withoutEntry([entry(), other], entry({ chapterTitle: 'x' }))).toEqual([other]);
  });
});

describe('withChange', () => {
  const other = entry({ workId: '/manga/b' });

  test('saves an entry', () => {
    const next = entry({ updatedAt: 2000 });
    expect(withChange([other], { type: 'saveHistoryEntry', entry: next })).toEqual([next, other]);
  });

  test('removes an entry', () => {
    expect(withChange([entry(), other], { type: 'removeHistoryEntry', entry: entry() })).toEqual([
      other,
    ]);
  });

  test('clears the history', () => {
    expect(withChange([entry(), other], { type: 'clearHistory' })).toEqual([]);
  });
});

describe('sanitizeChange', () => {
  test.each(['saveHistoryEntry', 'removeHistoryEntry'] as const)('keeps a valid %s', (type) => {
    expect(sanitizeChange({ type, entry: entry() })).toEqual({ type, entry: entry() });
  });

  test('keeps a clear, dropping other fields', () => {
    expect(sanitizeChange({ type: 'clearHistory', entry: entry() })).toEqual({
      type: 'clearHistory',
    });
  });

  test('sanitizes the entry', () => {
    const change = sanitizeChange({ type: 'saveHistoryEntry', entry: { ...entry(), extra: 1 } });
    expect(change).toEqual({ type: 'saveHistoryEntry', entry: entry() });
  });

  test.each([
    undefined,
    null,
    'clearHistory',
    {},
    { type: 'other', entry: entry() },
    { type: 'saveHistoryEntry' },
    { type: 'removeHistoryEntry', entry: { ...entry(), url: 'javascript:alert(1)' } },
  ])('%p → null', (raw) => {
    expect(sanitizeChange(raw)).toBeNull();
  });
});

describe('sanitizeHistory', () => {
  test.each([undefined, null, 'x', 1, {}, { 0: entry() }])('%p → []', (raw) => {
    expect(sanitizeHistory(raw)).toEqual([]);
  });

  test('keeps valid entries as they are', () => {
    const history = [entry({ updatedAt: 2 }), entry({ workId: '/manga/b', updatedAt: 1 })];
    expect(sanitizeHistory(history)).toEqual(history);
  });

  test('drops entries with a missing or wrong field', () => {
    const bad = [
      null,
      'x',
      [],
      { ...entry(), site: '' },
      { ...entry(), workId: 1 },
      { ...entry(), workTitle: undefined },
      { ...entry(), chapterTitle: null },
      { ...entry(), url: 'javascript:alert(1)' },
      { ...entry(), url: '/manga/a/1' },
      { ...entry(), updatedAt: '1000' },
      { ...entry(), updatedAt: Number.NaN },
    ];
    expect(sanitizeHistory([...bad, entry()])).toEqual([entry()]);
  });

  test.each([
    undefined,
    null,
    { page: -1, offset: 0.5 },
    { page: 1.5, offset: 0.5 },
    { page: 1, offset: 1.5 },
    { page: 1, offset: -0.1 },
    { page: 1, offset: Number.NaN },
    { page: '1', offset: 0.5 },
  ])('an invalid position %p is the start', (position) => {
    expect(sanitizeHistory([{ ...entry(), position }])[0]?.position).toEqual(CHAPTER_START);
  });

  test('drops unknown fields', () => {
    expect(sanitizeHistory([{ ...entry(), extra: 1 }])).toEqual([entry()]);
  });

  test('sorts newest first and keeps the newest entry of each work', () => {
    const older = entry({ chapterTitle: 'old', updatedAt: 1 });
    const newer = entry({ chapterTitle: 'new', updatedAt: 3 });
    const other = entry({ workId: '/manga/b', updatedAt: 2 });
    expect(sanitizeHistory([older, other, newer])).toEqual([newer, other]);
  });

  test(`keeps at most ${MAX_HISTORY_ENTRIES} entries`, () => {
    const many = Array.from({ length: MAX_HISTORY_ENTRIES + 5 }, (_, i) =>
      entry({ workId: `/manga/${i}`, updatedAt: i }),
    );
    const history = sanitizeHistory(many);
    expect(history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(history[0]?.updatedAt).toBe(MAX_HISTORY_ENTRIES + 4);
  });

  test('is idempotent', () => {
    const once = sanitizeHistory([entry(), { ...entry(), updatedAt: 5 }, null]);
    expect(sanitizeHistory(once)).toEqual(once);
  });
});
