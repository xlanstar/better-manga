import { describe, expect, test } from 'bun:test';
import { hideRules, matches, queryAll, queryOne } from './dom';

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

/** What the DOM does with an invalid selector. */
function invalid(): never {
  throw new SyntaxError('not a valid selector');
}

describe('guarded queries', () => {
  // No DOM under `bun test`: stand-ins that answer like one, or throw like
  // one does on an invalid selector.
  const el = { matches: () => true } as unknown as Element;
  const root = {
    querySelectorAll: () => [el],
    querySelector: () => el,
  } as unknown as ParentNode;
  const badRoot = { querySelectorAll: invalid, querySelector: invalid } as unknown as ParentNode;
  const badEl = { matches: invalid } as unknown as Element;

  test('pass through what a valid selector finds', () => {
    expect(queryAll('img', root)).toEqual([el]);
    expect(queryOne('img', root)).toBe(el);
    expect(matches(el, 'img')).toBe(true);
  });

  test('an invalid selector matches nothing', () => {
    expect(queryAll('img[', badRoot)).toEqual([]);
    expect(queryOne('img[', badRoot)).toBeNull();
    expect(matches(badEl, 'img[')).toBe(false);
  });
});
