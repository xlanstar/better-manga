import { describe, expect, test } from 'bun:test';
import { featureIds, features } from './index';
import { featureStarters } from './starters';

describe('feature registry', () => {
  test('featureIds lists every feature, in registry order', () => {
    expect(featureIds).toEqual(Object.keys(features) as typeof featureIds);
    expect(featureIds).toContain('pageScroll');
  });

  test('ids are unique', () => {
    expect(new Set(featureIds).size).toBe(featureIds.length);
  });

  test('every feature has a content-script starter', () => {
    expect(Object.keys(featureStarters).toSorted()).toEqual([...featureIds].toSorted());
    for (const id of featureIds) expect(featureStarters[id]).toBeFunction();
  });

  describe.each(featureIds)('%s', (id) => {
    const { defaults, sanitize } = features[id];

    test('defaults are a plain object without undefined values', () => {
      expect(Object.getPrototypeOf(defaults)).toBe(Object.prototype);
      for (const v of Object.values(defaults)) expect(v).not.toBeUndefined();
    });

    test('sanitize of an empty object is empty', () => {
      expect(sanitize({})).toEqual({});
    });

    test('sanitize keeps every user field the defaults set, unchanged', () => {
      const clean = sanitize({ ...defaults }) as Record<string, unknown>;
      for (const [k, v] of Object.entries(clean)) {
        expect(v).toEqual((defaults as Record<string, unknown>)[k]);
      }
    });

    test('sanitize is idempotent on the defaults', () => {
      const once = sanitize({ ...defaults });
      expect(sanitize({ ...once })).toEqual(once);
    });
  });
});
