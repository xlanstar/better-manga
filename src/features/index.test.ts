import { describe, expect, test } from 'bun:test';
import { featureIds, features, renamedFeatureIds } from './index';
import { featureStarters } from './starters';

describe('feature registry', () => {
  test('featureIds lists every feature, in registry order', () => {
    expect(featureIds).toEqual(Object.keys(features) as typeof featureIds);
    expect(featureIds).toContain('pageDistance');
  });

  test('ids are unique', () => {
    expect(new Set(featureIds).size).toBe(featureIds.length);
  });

  test('renamed ids point at current features and are not reused', () => {
    for (const [oldId, id] of Object.entries(renamedFeatureIds)) {
      expect(featureIds).toContain(id);
      expect(featureIds as string[]).not.toContain(oldId);
    }
  });

  test('every feature has a content-script starter', () => {
    expect(Object.keys(featureStarters).toSorted()).toEqual([...featureIds].toSorted());
    for (const id of featureIds) expect(featureStarters[id]).toBeFunction();
  });

  describe.each(featureIds)('%s', (id) => {
    const { defaults, sanitizeOptions } = features[id];

    test('defaults are a plain object without undefined values', () => {
      expect(Object.getPrototypeOf(defaults)).toBe(Object.prototype);
      for (const v of Object.values(defaults)) expect(v).not.toBeUndefined();
    });

    test('defaults include a boolean `enabled`', () => {
      expect(defaults.enabled).toBeBoolean();
    });

    if (!sanitizeOptions) return;

    test('sanitizeOptions of an empty object is empty', () => {
      expect(sanitizeOptions({})).toEqual({});
    });

    test('sanitizeOptions never returns `enabled` (the framework sanitizes it)', () => {
      for (const enabled of [true, false, 'x']) {
        expect('enabled' in sanitizeOptions({ ...defaults, enabled })).toBe(false);
      }
    });

    test('sanitizeOptions keeps every option the defaults set, unchanged', () => {
      const clean = sanitizeOptions({ ...defaults }) as Record<string, unknown>;
      for (const [k, v] of Object.entries(clean)) {
        expect(v).toEqual((defaults as Record<string, unknown>)[k]);
      }
    });

    test('sanitizeOptions is idempotent on the defaults', () => {
      const once = sanitizeOptions({ ...defaults });
      expect(sanitizeOptions({ ...once })).toEqual(once);
    });
  });
});
