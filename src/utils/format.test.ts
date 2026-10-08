import { describe, expect, test } from 'bun:test';
import { PAGE_KEYS_RATIO } from '@/features/page-keys';
import { formatTimeAgo, formatPercent } from './format';

describe('formatPercent', () => {
  test.each([
    [0, '0%'],
    [0.3, '30%'],
    [0.7, '70%'],
    [1, '100%'],
    [0.05, '5%'],
    [1.5, '150%'],
    [-0.25, '-25%'],
  ])('%p → %s', (ratio, expected) => {
    expect(formatPercent(ratio)).toBe(expected);
  });

  test('rounds to a whole percent', () => {
    expect(formatPercent(0.333)).toBe('33%');
    expect(formatPercent(0.666)).toBe('67%');
    expect(formatPercent(0.125)).toBe('13%'); // half rounds up
    expect(formatPercent(0.004)).toBe('0%');
  });

  test('is not fooled by float noise', () => {
    expect(formatPercent(0.1 + 0.2)).toBe('30%');
    expect(formatPercent(0.3 + 0.05 * 5)).toBe('55%');
  });

  test('every slider step shows a distinct multiple of 5%', () => {
    const { min, max, step } = PAGE_KEYS_RATIO;
    const seen = new Set<string>();
    for (let i = 0; min + i * step <= max + 1e-9; i++) {
      const label = formatPercent(min + i * step);
      expect(label).toBe(`${30 + i * 5}%`);
      seen.add(label);
    }
    expect(seen.has('100%')).toBe(true);
  });
});

describe('formatTimeAgo', () => {
  const NOW = Date.UTC(2026, 9, 8, 12);
  const ago = (ms: number) => formatTimeAgo(NOW - ms, NOW, 'en');
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  test.each([
    [0, 'now'],
    [59_000, 'now'],
    [MINUTE, '1 minute ago'],
    [5 * MINUTE + 59_000, '5 minutes ago'],
    [3 * HOUR, '3 hours ago'],
    [DAY, 'yesterday'],
    [6 * DAY, '6 days ago'],
    [7 * DAY, 'last week'],
    [45 * DAY, 'last month'],
    [400 * DAY, 'last year'],
  ])('%p ms ago → %p', (ms, text) => {
    expect(ago(ms)).toBe(text);
  });

  test('a time in the future (clock change) is now', () => {
    expect(ago(-HOUR)).toBe('now');
  });

  test('follows the language', () => {
    expect(formatTimeAgo(NOW - DAY, NOW, 'zh-Hant')).toBe('昨天');
  });
});
