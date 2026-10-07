import { describe, expect, test } from 'bun:test';
import { hideRules } from './dom';

describe('hideRules', () => {
  test('one selector gives one rule', () => {
    expect(hideRules(['.ad'])).toBe('.ad { display: none !important; }');
  });

  test('one rule per selector, one per line, in order', () => {
    expect(hideRules(['.baozi-ad', '.mobadsq'])).toBe(
      '.baozi-ad { display: none !important; }\n.mobadsq { display: none !important; }',
    );
  });

  test('keeps a selector list together as one rule', () => {
    expect(hideRules(['.a, .b'])).toBe('.a, .b { display: none !important; }');
  });

  test('keeps complex selectors verbatim', () => {
    const selector = 'div[data-x="1"] > a:not(.keep)::after';
    expect(hideRules([selector])).toBe(`${selector} { display: none !important; }`);
  });

  test('trims whitespace around selectors', () => {
    expect(hideRules(['  .ad\n'])).toBe('.ad { display: none !important; }');
  });

  test('skips blank selectors', () => {
    expect(hideRules(['', '   ', '.ad', '\n'])).toBe('.ad { display: none !important; }');
  });

  test('no selectors gives an empty stylesheet', () => {
    expect(hideRules([])).toBe('');
    expect(hideRules([''])).toBe('');
  });

  test('keeps duplicates (harmless) and does not mutate the input', () => {
    const selectors = ['.ad', '.ad'];
    expect(hideRules(selectors).split('\n')).toHaveLength(2);
    expect(selectors).toEqual(['.ad', '.ad']);
  });
});
