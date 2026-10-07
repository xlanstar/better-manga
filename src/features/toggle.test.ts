import { describe, expect, test } from 'bun:test';
import { sanitizeToggle } from './toggle';

describe('sanitizeToggle', () => {
  test.each([true, false])('keeps boolean %p', (enabled) => {
    expect(sanitizeToggle({ enabled })).toEqual({ enabled });
  });

  test.each([['true'], [1], [0], [null], [undefined], [{}], [new Boolean(true)]])(
    'drops non-boolean %p',
    (enabled) => {
      expect(sanitizeToggle({ enabled })).toEqual({});
    },
  );

  test('drops unknown keys, including site adapters', () => {
    expect(sanitizeToggle({ enabled: false, hide: ['.ad'], selector: 'a' })).toEqual({
      enabled: false,
    });
  });
});
