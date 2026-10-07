import { describe, expect, test } from 'bun:test';
import { isDeepStrictEqual } from 'node:util';
import { features } from './index';
import {
  isCustomised,
  pruneUserSettings,
  resolveFeatures,
  sanitizeSiteNames,
  sanitizeUserSettings,
  type SiteFeatures,
  type UserSettings,
} from './settings';

const DEFAULTS = features.pageScroll.defaults;

/** Untrusted values, as `storage` may hand them back. */
const asUser = (v: unknown) => v as UserSettings;

describe('sanitizeUserSettings', () => {
  test.each([
    ['undefined', undefined],
    ['null', null],
    ['number', 42],
    ['string', '{"pageScroll":{"ratio":0.5}}'],
    ['boolean', true],
    ['array', [{ pageScroll: { ratio: 0.5 } }]],
    ['function', () => ({ pageScroll: { ratio: 0.5 } })],
  ])('non-object (%s) gives {}', (_, raw) => {
    expect(sanitizeUserSettings(raw)).toEqual({});
  });

  test('empty object gives {}', () => {
    expect(sanitizeUserSettings({})).toEqual({});
  });

  test('keeps valid feature values', () => {
    expect(sanitizeUserSettings({ pageScroll: { enabled: false, ratio: 0.5 } })).toEqual({
      pageScroll: { enabled: false, ratio: 0.5 },
    });
  });

  test('runs each feature sanitizer (clamps, drops bad fields)', () => {
    expect(sanitizeUserSettings({ pageScroll: { enabled: 'no', ratio: 7, x: 1 } })).toEqual({
      pageScroll: { ratio: 1 },
    });
  });

  test('drops unknown feature ids', () => {
    expect(sanitizeUserSettings({ zoom: { level: 2 }, pageScroll: { ratio: 0.4 } })).toEqual({
      pageScroll: { ratio: 0.4 },
    });
  });

  test.each([
    ['null', null],
    ['string', 'on'],
    ['number', 0.5],
    ['boolean', false],
    ['array', [{ ratio: 0.5 }]],
  ])('drops a feature whose value is not an object (%s)', (_, pageScroll) => {
    expect(sanitizeUserSettings({ pageScroll })).toEqual({});
  });

  test('drops a feature left empty after sanitizing', () => {
    expect(sanitizeUserSettings({ pageScroll: {} })).toEqual({});
    expect(sanitizeUserSettings({ pageScroll: { ratio: 'x', enabled: 1 } })).toEqual({});
    expect('pageScroll' in sanitizeUserSettings({ pageScroll: { bogus: 1 } })).toBe(false);
  });

  test('accepts prototype-less objects', () => {
    const inner = Object.assign(Object.create(null), { ratio: 0.6 });
    const raw = Object.assign(Object.create(null), { pageScroll: inner });
    expect(sanitizeUserSettings(raw)).toEqual({ pageScroll: { ratio: 0.6 } });
  });

  test('inherited feature values are read, but still sanitized', () => {
    const raw = Object.create({ pageScroll: { ratio: 0.6, enabled: 'x' } });
    expect(sanitizeUserSettings(raw)).toEqual({ pageScroll: { ratio: 0.6 } });
  });

  test('is safe against a JSON `__proto__` key', () => {
    const raw = JSON.parse('{"__proto__": {"pageScroll": {"ratio": 0.5}}}');
    expect(sanitizeUserSettings(raw)).toEqual({});
    expect(({} as Record<string, unknown>).pageScroll).toBeUndefined();
  });

  test('does not mutate its input', () => {
    const raw = { pageScroll: { ratio: 9, enabled: 'x' }, other: 1 };
    const copy = structuredClone(raw);
    sanitizeUserSettings(raw);
    expect(raw).toEqual(copy);
  });

  test('returns fresh objects, not the input', () => {
    const inner = { ratio: 0.5 };
    const raw = { pageScroll: inner };
    const out = sanitizeUserSettings(raw);
    expect(out).not.toBe(raw);
    expect(out.pageScroll).not.toBe(inner);
  });

  test('is idempotent', () => {
    const inputs: unknown[] = [
      null,
      {},
      { pageScroll: { ratio: 0.5 } },
      { pageScroll: { ratio: -1, enabled: true } },
      { pageScroll: { ratio: Number.NaN } },
      { pageScroll: [], other: {} },
      { pageScroll: { enabled: false, ratio: 2, container: '#x' } },
    ];
    for (const raw of inputs) {
      const once = sanitizeUserSettings(raw);
      expect(sanitizeUserSettings(once)).toEqual(once);
    }
  });

  test('survives a JSON round trip (what storage does)', () => {
    const value = { pageScroll: { enabled: false, ratio: 0.45 } };
    expect(sanitizeUserSettings(JSON.parse(JSON.stringify(value)))).toEqual(value);
  });
});

describe('resolveFeatures', () => {
  test('no site config and no user layer gives the global defaults', () => {
    expect(resolveFeatures(undefined, undefined)).toEqual({ pageScroll: DEFAULTS });
    expect(resolveFeatures(undefined, null)).toEqual({ pageScroll: DEFAULTS });
    expect(resolveFeatures({}, {})).toEqual({ pageScroll: DEFAULTS });
  });

  test('has an entry for every feature', () => {
    expect(Object.keys(resolveFeatures(undefined, undefined))).toEqual(Object.keys(features));
  });

  test('site layer overrides the defaults', () => {
    expect(resolveFeatures({ pageScroll: { ratio: 0.5 } }, {}).pageScroll).toEqual({
      enabled: true,
      ratio: 0.5,
    });
  });

  test('site layer can add adapters such as a scroll container', () => {
    expect(resolveFeatures({ pageScroll: { container: '#reader' } }, {}).pageScroll).toEqual({
      enabled: true,
      ratio: 0.7,
      container: '#reader',
    });
  });

  test('undefined site values fall through to the defaults', () => {
    expect(
      resolveFeatures({ pageScroll: { ratio: undefined, container: undefined } }, {}).pageScroll,
    ).toEqual(DEFAULTS);
  });

  test('an undefined site feature entry is the same as none', () => {
    expect(resolveFeatures({ pageScroll: undefined }, {}).pageScroll).toEqual(DEFAULTS);
  });

  test('site `false` turns the feature off entirely, whatever the user stored', () => {
    const site: SiteFeatures = { pageScroll: false };
    expect(resolveFeatures(site, {}).pageScroll).toBeNull();
    expect(resolveFeatures(site, { pageScroll: { enabled: true, ratio: 0.4 } }).pageScroll).toBe(
      null,
    );
  });

  test('user layer overrides site and defaults', () => {
    const site: SiteFeatures = { pageScroll: { ratio: 0.5, container: '#c' } };
    expect(
      resolveFeatures(site, { pageScroll: { ratio: 0.9, enabled: false } }).pageScroll,
    ).toEqual({ enabled: false, ratio: 0.9, container: '#c' });
  });

  test('partial user layer only overrides what it sets', () => {
    const site: SiteFeatures = { pageScroll: { ratio: 0.5 } };
    expect(resolveFeatures(site, { pageScroll: { enabled: false } }).pageScroll).toEqual({
      enabled: false,
      ratio: 0.5,
    });
  });

  test('user layer is sanitized first', () => {
    expect(
      resolveFeatures(undefined, asUser({ pageScroll: { ratio: 99, enabled: 'off' } })).pageScroll,
    ).toEqual({ enabled: true, ratio: 1 });
    expect(resolveFeatures(undefined, asUser({ pageScroll: { ratio: Number.NaN } }))).toEqual({
      pageScroll: DEFAULTS,
    });
  });

  test('a user cannot set a site adapter', () => {
    const resolved = resolveFeatures(undefined, asUser({ pageScroll: { container: 'body' } }));
    expect(resolved.pageScroll).toEqual(DEFAULTS);
    expect(resolved.pageScroll && 'container' in resolved.pageScroll).toBe(false);
  });

  test.each([
    ['string', 'x'],
    ['array', []],
    ['number', 3],
  ])('garbage user layer (%s) falls back to defaults', (_, user) => {
    expect(resolveFeatures(undefined, asUser(user))).toEqual({ pageScroll: DEFAULTS });
  });

  test('does not mutate the defaults, the site or the user layer', () => {
    const site: SiteFeatures = { pageScroll: { ratio: 0.5 } };
    const user: UserSettings = { pageScroll: { enabled: false } };
    const resolved = resolveFeatures(site, user);
    expect(DEFAULTS).toEqual({ enabled: true, ratio: 0.7 });
    expect(site).toEqual({ pageScroll: { ratio: 0.5 } });
    expect(user).toEqual({ pageScroll: { enabled: false } });
    expect(resolved.pageScroll).not.toBe(DEFAULTS);
  });

  test('mutating a result does not leak into later results', () => {
    const first = resolveFeatures(undefined, undefined);
    first.pageScroll!.ratio = 0.1;
    first.pageScroll!.enabled = false;
    expect(resolveFeatures(undefined, undefined)).toEqual({ pageScroll: DEFAULTS });
  });
});

describe('pruneUserSettings', () => {
  test('empty user layer stays empty', () => {
    expect(pruneUserSettings(undefined, {})).toEqual({});
  });

  test('drops values equal to the global defaults', () => {
    expect(pruneUserSettings(undefined, { pageScroll: { enabled: true, ratio: 0.7 } })).toEqual({});
  });

  test('keeps values that differ from the defaults', () => {
    expect(pruneUserSettings(undefined, { pageScroll: { enabled: false, ratio: 0.5 } })).toEqual({
      pageScroll: { enabled: false, ratio: 0.5 },
    });
  });

  test('keeps only the differing fields of a feature', () => {
    expect(pruneUserSettings(undefined, { pageScroll: { enabled: true, ratio: 0.5 } })).toEqual({
      pageScroll: { ratio: 0.5 },
    });
  });

  test('compares against the site default, not the global one', () => {
    const site: SiteFeatures = { pageScroll: { ratio: 0.5 } };
    // Equal to the site default: pruned.
    expect(pruneUserSettings(site, { pageScroll: { ratio: 0.5 } })).toEqual({});
    // Equal to the global default but not the site's: a real customisation.
    expect(pruneUserSettings(site, { pageScroll: { ratio: 0.7 } })).toEqual({
      pageScroll: { ratio: 0.7 },
    });
  });

  test('drops everything for a feature the site turned off', () => {
    expect(
      pruneUserSettings({ pageScroll: false }, { pageScroll: { enabled: false, ratio: 0.4 } }),
    ).toEqual({});
  });

  test('sanitizes first: invalid fields are dropped', () => {
    expect(
      pruneUserSettings(undefined, asUser({ pageScroll: { enabled: 'x', ratio: 0.4 } })),
    ).toEqual({ pageScroll: { ratio: 0.4 } });
    expect(pruneUserSettings(undefined, asUser({ other: { a: 1 } }))).toEqual({});
    expect(pruneUserSettings(undefined, asUser(null))).toEqual({});
  });

  test('sanitizes first: a value clamped onto the default is pruned', () => {
    const site: SiteFeatures = { pageScroll: { ratio: 1 } };
    expect(pruneUserSettings(site, { pageScroll: { ratio: 3 } })).toEqual({});
  });

  test('drops undefined fields', () => {
    expect(pruneUserSettings(undefined, { pageScroll: { ratio: undefined } })).toEqual({});
  });

  test('does not mutate its input', () => {
    const user: UserSettings = { pageScroll: { enabled: true, ratio: 0.5 } };
    pruneUserSettings(undefined, user);
    expect(user).toEqual({ pageScroll: { enabled: true, ratio: 0.5 } });
  });

  test('is idempotent', () => {
    const site: SiteFeatures = { pageScroll: { ratio: 0.5 } };
    const users: UserSettings[] = [
      {},
      { pageScroll: { ratio: 0.5 } },
      { pageScroll: { ratio: 0.6, enabled: true } },
      { pageScroll: { enabled: false } },
    ];
    for (const user of users) {
      const once = pruneUserSettings(site, user);
      expect(pruneUserSettings(site, once)).toEqual(once);
    }
  });

  // The invariant the popup relies on: pruning never changes behaviour, and a
  // pruned layer is empty exactly when it behaves like the defaults.
  describe('preserves the effective settings', () => {
    const sites: (SiteFeatures | undefined)[] = [
      undefined,
      {},
      { pageScroll: { ratio: 0.5 } },
      { pageScroll: { ratio: 0.3, container: '#c' } },
      { pageScroll: false },
    ];
    const users: unknown[] = [{}, null, { pageScroll: { bogus: 1 } }];
    for (const enabled of [undefined, true, false, 'x']) {
      for (const ratio of [undefined, 0, 0.3, 0.5, 0.7, 0.75, 1, 2, Number.NaN]) {
        users.push({ pageScroll: { enabled, ratio } });
      }
    }

    test.each(sites.map((s) => [JSON.stringify(s) ?? 'undefined', s] as const))(
      'site %s',
      (_, site) => {
        const defaults = resolveFeatures(site, {});
        for (const raw of users) {
          const user = asUser(raw);
          const pruned = pruneUserSettings(site, user);
          expect(resolveFeatures(site, pruned)).toEqual(resolveFeatures(site, user));
          expect(isCustomised(pruned)).toBe(
            !isDeepStrictEqual(resolveFeatures(site, user), defaults),
          );
        }
      },
    );
  });
});

describe('isCustomised', () => {
  test('empty layer is not customised', () => {
    expect(isCustomised({})).toBe(false);
  });

  test('any feature entry counts as customised', () => {
    expect(isCustomised({ pageScroll: { ratio: 0.5 } })).toBe(true);
    // Only meaningful after pruning; on its own it just checks for entries.
    expect(isCustomised({ pageScroll: {} })).toBe(true);
  });
});

describe('global and site user layers', () => {
  const site: SiteFeatures = { pageScroll: { ratio: 0.5, container: '#c' } };
  const global: UserSettings = { pageScroll: { ratio: 0.8 } };

  test('global overrides the site default', () => {
    expect(resolveFeatures(site, global).pageScroll).toEqual({
      enabled: true,
      ratio: 0.8,
      container: '#c',
    });
  });

  test('the site override wins over global, field by field', () => {
    expect(resolveFeatures(site, global, { pageScroll: { enabled: false } }).pageScroll).toEqual({
      enabled: false,
      ratio: 0.8,
      container: '#c',
    });
    expect(resolveFeatures(site, global, { pageScroll: { ratio: 0.4 } }).pageScroll?.ratio).toBe(
      0.4,
    );
  });

  test('every layer is sanitized', () => {
    expect(
      resolveFeatures(undefined, asUser({ pageScroll: { ratio: 9 } }), asUser('x')).pageScroll,
    ).toEqual({ enabled: true, ratio: 1 });
  });

  test('site `false` still wins', () => {
    expect(resolveFeatures({ pageScroll: false }, global, global).pageScroll).toBeNull();
  });

  test('an override equal to the global value is pruned', () => {
    expect(pruneUserSettings(site, { pageScroll: { ratio: 0.8 } }, global)).toEqual({});
    expect(pruneUserSettings(site, { pageScroll: { ratio: 0.5 } }, global)).toEqual({
      pageScroll: { ratio: 0.5 },
    });
  });

  test('pruning an override keeps the effective settings', () => {
    for (const ratio of [0.3, 0.5, 0.8, 1]) {
      for (const enabled of [true, false]) {
        const user: UserSettings = { pageScroll: { ratio, enabled } };
        const pruned = pruneUserSettings(site, user, global);
        expect(resolveFeatures(site, global, pruned)).toEqual(resolveFeatures(site, global, user));
      }
    }
  });
});

describe('sanitizeSiteNames', () => {
  test.each([[undefined], [null], ['hipmh'], [{ 0: 'hipmh' }]])('non-array %p gives []', (raw) => {
    expect(sanitizeSiteNames(raw)).toEqual([]);
  });

  test('keeps unique non-empty strings, in order', () => {
    expect(sanitizeSiteNames(['b', 1, '', 'a', 'b', null])).toEqual(['b', 'a']);
  });
});
