import { describe, expect, test } from 'bun:test';
import { isDeepStrictEqual } from 'node:util';
import { featureIds, features } from './index';
import {
  ALL_SITES,
  isCustomised,
  pruneUserSettings,
  resolveFeatures,
  sanitizeSiteNames,
  sanitizeUserSettings,
  type ResolvedFeatures,
  type SiteFeatures,
  type SiteScope,
  type UserSettings,
} from './settings';

const DEFAULTS = features.pageKeys.defaults;

/** Every feature at its defaults: the global settings with nothing stored. */
const ALL_DEFAULTS = Object.fromEntries(
  featureIds.map((id) => [id, features[id].defaults]),
) as ResolvedFeatures;

/** Every feature at its defaults, except site-specific ones (off without config). */
const SITE_DEFAULTS = Object.fromEntries(
  featureIds.map((id) => [id, features[id].siteSpecific ? null : features[id].defaults]),
) as ResolvedFeatures;

/** Untrusted values, as `storage` may hand them back. */
const asUser = (v: unknown) => v as UserSettings;

/** A scope as a test name. */
const scopeLabel = (s: SiteScope) =>
  s === ALL_SITES ? 'ALL_SITES' : (JSON.stringify(s) ?? 'undefined');

describe('sanitizeUserSettings', () => {
  describe('a renamed feature (pageScroll, pageDistance → pageKeys)', () => {
    test.each(['pageScroll', 'pageDistance'])('reads settings stored under %s', (oldId) => {
      expect(sanitizeUserSettings({ [oldId]: { enabled: false, ratio: 0.5 } })).toEqual({
        pageKeys: { enabled: false, ratio: 0.5 },
      });
    });

    test('prefers the new id when both are stored', () => {
      expect(
        sanitizeUserSettings({ pageScroll: { ratio: 0.5 }, pageKeys: { ratio: 0.8 } }),
      ).toEqual({ pageKeys: { ratio: 0.8 } });
    });

    test('falls back to the old id when the new one is not an object', () => {
      expect(sanitizeUserSettings({ pageScroll: { ratio: 0.5 }, pageKeys: 1 })).toEqual({
        pageKeys: { ratio: 0.5 },
      });
    });

    test('sanitizes it like any other', () => {
      expect(sanitizeUserSettings({ pageScroll: { ratio: 9, enabled: 'x' } })).toEqual({
        pageKeys: { ratio: 1 },
      });
    });

    test('drops the old id, so the next save stores only the new one', () => {
      expect('pageScroll' in sanitizeUserSettings({ pageScroll: { ratio: 0.5 } })).toBe(false);
    });

    test('pruning compares it as the new id', () => {
      expect(pruneUserSettings(undefined, { pageScroll: { ratio: 0.7 } } as UserSettings)).toEqual(
        {},
      );
    });
  });

  test.each([
    ['undefined', undefined],
    ['null', null],
    ['number', 42],
    ['string', '{"pageKeys":{"ratio":0.5}}'],
    ['boolean', true],
    ['array', [{ pageKeys: { ratio: 0.5 } }]],
    ['function', () => ({ pageKeys: { ratio: 0.5 } })],
  ])('non-object (%s) gives {}', (_, raw) => {
    expect(sanitizeUserSettings(raw)).toEqual({});
  });

  test('empty object gives {}', () => {
    expect(sanitizeUserSettings({})).toEqual({});
  });

  test('keeps valid feature values', () => {
    expect(sanitizeUserSettings({ pageKeys: { enabled: false, ratio: 0.5 } })).toEqual({
      pageKeys: { enabled: false, ratio: 0.5 },
    });
  });

  test('runs each feature sanitizer (clamps, drops bad fields)', () => {
    expect(sanitizeUserSettings({ pageKeys: { enabled: 'no', ratio: 7, x: 1 } })).toEqual({
      pageKeys: { ratio: 1 },
    });
  });

  // `enabled` is sanitized by the framework, the same for every feature.
  describe.each(featureIds)('%s.enabled', (id) => {
    test.each([true, false])('keeps boolean %p', (enabled) => {
      expect(sanitizeUserSettings({ [id]: { enabled } })).toEqual({ [id]: { enabled } });
    });

    test.each([
      ['string "true"', 'true'],
      ['string "false"', 'false'],
      ['number 1', 1],
      ['number 0', 0],
      ['null', null],
      ['undefined', undefined],
      ['object', {}],
      ['array', [true]],
      ['Boolean object', new Boolean(true)],
    ])('drops non-boolean (%s)', (_, enabled) => {
      expect(sanitizeUserSettings({ [id]: { enabled } })).toEqual({});
    });

    test('is idempotent', () => {
      for (const enabled of [true, false, 'x', undefined]) {
        const once = sanitizeUserSettings({ [id]: { enabled, bogus: 1 } });
        expect(sanitizeUserSettings(once)).toEqual(once);
      }
    });
  });

  test('drops unknown feature ids', () => {
    expect(sanitizeUserSettings({ zoom: { level: 2 }, pageKeys: { ratio: 0.4 } })).toEqual({
      pageKeys: { ratio: 0.4 },
    });
  });

  test.each([
    ['null', null],
    ['string', 'on'],
    ['number', 0.5],
    ['boolean', false],
    ['array', [{ ratio: 0.5 }]],
  ])('drops a feature whose value is not an object (%s)', (_, pageKeys) => {
    expect(sanitizeUserSettings({ pageKeys })).toEqual({});
  });

  test('drops a feature left empty after sanitizing', () => {
    expect(sanitizeUserSettings({ pageKeys: {} })).toEqual({});
    expect(sanitizeUserSettings({ pageKeys: { ratio: 'x', enabled: 1 } })).toEqual({});
    expect('pageKeys' in sanitizeUserSettings({ pageKeys: { bogus: 1 } })).toBe(false);
  });

  test('accepts prototype-less objects', () => {
    const inner = Object.assign(Object.create(null), { ratio: 0.6 });
    const raw = Object.assign(Object.create(null), { pageKeys: inner });
    expect(sanitizeUserSettings(raw)).toEqual({ pageKeys: { ratio: 0.6 } });
  });

  test('inherited feature values are read, but still sanitized', () => {
    const raw = Object.create({ pageKeys: { ratio: 0.6, enabled: 'x' } });
    expect(sanitizeUserSettings(raw)).toEqual({ pageKeys: { ratio: 0.6 } });
  });

  test('is safe against a JSON `__proto__` key', () => {
    const raw = JSON.parse('{"__proto__": {"pageKeys": {"ratio": 0.5}}}');
    expect(sanitizeUserSettings(raw)).toEqual({});
    expect(({} as Record<string, unknown>).pageKeys).toBeUndefined();
  });

  test('does not mutate its input', () => {
    const raw = { pageKeys: { ratio: 9, enabled: 'x' }, other: 1 };
    const copy = structuredClone(raw);
    sanitizeUserSettings(raw);
    expect(raw).toEqual(copy);
  });

  test('returns fresh objects, not the input', () => {
    const inner = { ratio: 0.5 };
    const raw = { pageKeys: inner };
    const out = sanitizeUserSettings(raw);
    expect(out).not.toBe(raw);
    expect(out.pageKeys).not.toBe(inner);
  });

  test('is idempotent', () => {
    const inputs: unknown[] = [
      null,
      {},
      { pageKeys: { ratio: 0.5 } },
      { pageKeys: { ratio: -1, enabled: true } },
      { pageKeys: { ratio: Number.NaN } },
      { pageKeys: [], other: {} },
      { pageKeys: { enabled: false, ratio: 2, container: '#x' } },
    ];
    for (const raw of inputs) {
      const once = sanitizeUserSettings(raw);
      expect(sanitizeUserSettings(once)).toEqual(once);
    }
  });

  test('survives a JSON round trip (what storage does)', () => {
    const value = { pageKeys: { enabled: false, ratio: 0.45 } };
    expect(sanitizeUserSettings(JSON.parse(JSON.stringify(value)))).toEqual(value);
  });
});

describe('resolveFeatures', () => {
  test('all sites and no user layer gives the global defaults', () => {
    expect(resolveFeatures(ALL_SITES)).toEqual(ALL_DEFAULTS);
    expect(resolveFeatures(ALL_SITES, undefined)).toEqual(ALL_DEFAULTS);
    expect(resolveFeatures(ALL_SITES, null)).toEqual(ALL_DEFAULTS);
  });

  test('a site without config gets the defaults, minus site-specific features', () => {
    expect(resolveFeatures({}, {})).toEqual(SITE_DEFAULTS);
    // `Site.features` left out: the same as `{}`, not all sites.
    expect(resolveFeatures(undefined)).toEqual(SITE_DEFAULTS);
    expect(resolveFeatures(undefined, {}, null)).toEqual(SITE_DEFAULTS);
    expect(SITE_DEFAULTS.blockAds).toBeNull();
    expect(SITE_DEFAULTS.pageKeys).toEqual(DEFAULTS);
  });

  describe('site-specific features', () => {
    test('apply on a site that configures them, with its config', () => {
      expect(resolveFeatures({ blockAds: { hide: ['.ad'] } }, {}).blockAds).toEqual({
        enabled: true,
        hide: ['.ad'],
      });
      // An empty config still opts in.
      expect(resolveFeatures({ autoContinue: {} }, {}).autoContinue).toEqual({ enabled: true });
    });

    test('do not apply on a site that leaves them out or sets them to false', () => {
      expect(resolveFeatures({ pageKeys: { ratio: 0.5 } }, {}).blockAds).toBeNull();
      expect(resolveFeatures({ blockAds: undefined }, {}).blockAds).toBeNull();
      expect(resolveFeatures({ blockAds: false }, {}).blockAds).toBeNull();
    });

    test('apply for all sites (the global settings), so they can be turned off', () => {
      expect(resolveFeatures(ALL_SITES, { blockAds: { enabled: false } }).blockAds).toEqual({
        enabled: false,
      });
    });

    test('global and site user layers turn them off', () => {
      const site: SiteFeatures = { blockAds: { remove: ['#x'] } };
      const off = { blockAds: { enabled: false } };
      expect(resolveFeatures(site, off).blockAds).toEqual({ enabled: false, remove: ['#x'] });
      expect(resolveFeatures(site, off, { blockAds: { enabled: true } }).blockAds?.enabled).toBe(
        true,
      );
      expect(resolveFeatures(site, {}, off).blockAds?.enabled).toBe(false);
    });

    test('a user value for a site without them is pruned', () => {
      expect(pruneUserSettings({}, { blockAds: { enabled: false } })).toEqual({});
      expect(pruneUserSettings(undefined, { blockAds: { enabled: false } })).toEqual({});
      expect(pruneUserSettings(ALL_SITES, { blockAds: { enabled: false } })).toEqual({
        blockAds: { enabled: false },
      });
    });
  });

  test('has an entry for every feature', () => {
    expect(Object.keys(resolveFeatures(ALL_SITES, undefined))).toEqual(Object.keys(features));
  });

  test('site layer overrides the defaults', () => {
    expect(resolveFeatures({ pageKeys: { ratio: 0.5 } }, {}).pageKeys).toEqual({
      ...DEFAULTS,
      ratio: 0.5,
    });
  });

  test('site layer can add adapters such as a scroll container', () => {
    expect(resolveFeatures({ pageKeys: { container: '#reader' } }, {}).pageKeys).toEqual({
      ...DEFAULTS,
      container: '#reader',
    });
  });

  test('undefined site values fall through to the defaults', () => {
    expect(
      resolveFeatures({ pageKeys: { ratio: undefined, container: undefined } }, {}).pageKeys,
    ).toEqual(DEFAULTS);
  });

  test('an undefined site feature entry is the same as none', () => {
    expect(resolveFeatures({ pageKeys: undefined }, {}).pageKeys).toEqual(DEFAULTS);
  });

  test('site `false` turns the feature off entirely, whatever the user stored', () => {
    const site: SiteFeatures = { pageKeys: false };
    expect(resolveFeatures(site, {}).pageKeys).toBeNull();
    expect(resolveFeatures(site, { pageKeys: { enabled: true, ratio: 0.4 } }).pageKeys).toBe(null);
  });

  test('user layer overrides site and defaults', () => {
    const site: SiteFeatures = { pageKeys: { ratio: 0.5, container: '#c' } };
    expect(resolveFeatures(site, { pageKeys: { ratio: 0.9, enabled: false } }).pageKeys).toEqual({
      ...DEFAULTS,
      enabled: false,
      ratio: 0.9,
      container: '#c',
    });
  });

  test('partial user layer only overrides what it sets', () => {
    const site: SiteFeatures = { pageKeys: { ratio: 0.5 } };
    expect(resolveFeatures(site, { pageKeys: { enabled: false } }).pageKeys).toEqual({
      ...DEFAULTS,
      enabled: false,
      ratio: 0.5,
    });
  });

  test('user layer is sanitized first', () => {
    expect(
      resolveFeatures(ALL_SITES, asUser({ pageKeys: { ratio: 99, enabled: 'off' } })).pageKeys,
    ).toEqual({ ...DEFAULTS, ratio: 1 });
    expect(resolveFeatures(ALL_SITES, asUser({ pageKeys: { ratio: Number.NaN } }))).toEqual(
      ALL_DEFAULTS,
    );
  });

  test('a user cannot set a site adapter', () => {
    const resolved = resolveFeatures(ALL_SITES, asUser({ pageKeys: { container: 'body' } }));
    expect(resolved.pageKeys).toEqual(DEFAULTS);
    expect(resolved.pageKeys && 'container' in resolved.pageKeys).toBe(false);
  });

  test.each([
    ['string', 'x'],
    ['array', []],
    ['number', 3],
  ])('garbage user layer (%s) falls back to defaults', (_, user) => {
    expect(resolveFeatures(ALL_SITES, asUser(user))).toEqual(ALL_DEFAULTS);
  });

  test('does not mutate the defaults, the site or the user layer', () => {
    const site: SiteFeatures = { pageKeys: { ratio: 0.5 } };
    const user: UserSettings = { pageKeys: { enabled: false } };
    const before = structuredClone(DEFAULTS);
    const resolved = resolveFeatures(site, user);
    expect(DEFAULTS).toEqual(before);
    expect(site).toEqual({ pageKeys: { ratio: 0.5 } });
    expect(user).toEqual({ pageKeys: { enabled: false } });
    expect(resolved.pageKeys).not.toBe(DEFAULTS);
  });

  test('mutating a result does not leak into later results', () => {
    const first = resolveFeatures(ALL_SITES, undefined);
    first.pageKeys!.ratio = 0.1;
    first.pageKeys!.enabled = false;
    first.blockAds!.enabled = false;
    expect(resolveFeatures(ALL_SITES, undefined)).toEqual(ALL_DEFAULTS);
  });
});

describe('pruneUserSettings', () => {
  test('empty user layer stays empty', () => {
    expect(pruneUserSettings(ALL_SITES, {})).toEqual({});
  });

  test('drops values equal to the global defaults', () => {
    expect(pruneUserSettings(ALL_SITES, { pageKeys: { enabled: true, ratio: 0.7 } })).toEqual({});
  });

  test('keeps values that differ from the defaults', () => {
    expect(pruneUserSettings(ALL_SITES, { pageKeys: { enabled: false, ratio: 0.5 } })).toEqual({
      pageKeys: { enabled: false, ratio: 0.5 },
    });
  });

  test('keeps only the differing fields of a feature', () => {
    expect(pruneUserSettings(ALL_SITES, { pageKeys: { enabled: true, ratio: 0.5 } })).toEqual({
      pageKeys: { ratio: 0.5 },
    });
  });

  test('compares against the site default, not the global one', () => {
    const site: SiteFeatures = { pageKeys: { ratio: 0.5 } };
    // Equal to the site default: pruned.
    expect(pruneUserSettings(site, { pageKeys: { ratio: 0.5 } })).toEqual({});
    // Equal to the global default but not the site's: a real customisation.
    expect(pruneUserSettings(site, { pageKeys: { ratio: 0.7 } })).toEqual({
      pageKeys: { ratio: 0.7 },
    });
  });

  test('drops everything for a feature the site turned off', () => {
    expect(
      pruneUserSettings({ pageKeys: false }, { pageKeys: { enabled: false, ratio: 0.4 } }),
    ).toEqual({});
  });

  test('sanitizes first: invalid fields are dropped', () => {
    expect(
      pruneUserSettings(ALL_SITES, asUser({ pageKeys: { enabled: 'x', ratio: 0.4 } })),
    ).toEqual({ pageKeys: { ratio: 0.4 } });
    expect(pruneUserSettings(ALL_SITES, asUser({ other: { a: 1 } }))).toEqual({});
    expect(pruneUserSettings(ALL_SITES, asUser(null))).toEqual({});
  });

  test('sanitizes first: a value clamped onto the default is pruned', () => {
    const site: SiteFeatures = { pageKeys: { ratio: 1 } };
    expect(pruneUserSettings(site, { pageKeys: { ratio: 3 } })).toEqual({});
  });

  test('drops undefined fields', () => {
    expect(pruneUserSettings(ALL_SITES, { pageKeys: { ratio: undefined } })).toEqual({});
  });

  test('does not mutate its input', () => {
    const user: UserSettings = { pageKeys: { enabled: true, ratio: 0.5 } };
    pruneUserSettings(ALL_SITES, user);
    expect(user).toEqual({ pageKeys: { enabled: true, ratio: 0.5 } });
  });

  test('is idempotent', () => {
    const site: SiteFeatures = { pageKeys: { ratio: 0.5 } };
    const users: UserSettings[] = [
      {},
      { pageKeys: { ratio: 0.5 } },
      { pageKeys: { ratio: 0.6, enabled: true } },
      { pageKeys: { enabled: false } },
    ];
    for (const user of users) {
      const once = pruneUserSettings(site, user);
      expect(pruneUserSettings(site, once)).toEqual(once);
    }
  });

  // The invariant the popup relies on: pruning never changes behaviour, and a
  // pruned layer is empty exactly when it behaves like the defaults.
  describe('preserves the effective settings', () => {
    const scopes: SiteScope[] = [
      ALL_SITES,
      undefined,
      {},
      { pageKeys: { ratio: 0.5 } },
      { pageKeys: { ratio: 0.3, container: '#c' } },
      { pageKeys: false },
    ];
    const users: unknown[] = [{}, null, { pageKeys: { bogus: 1 } }];
    for (const enabled of [undefined, true, false, 'x']) {
      for (const ratio of [undefined, 0, 0.3, 0.5, 0.7, 0.75, 1, 2, Number.NaN]) {
        users.push({ pageKeys: { enabled, ratio } });
      }
    }

    test.each(scopes.map((s) => [scopeLabel(s), s] as const))('scope %s', (_, scope) => {
      const defaults = resolveFeatures(scope, {});
      for (const raw of users) {
        const user = asUser(raw);
        const pruned = pruneUserSettings(scope, user);
        expect(resolveFeatures(scope, pruned)).toEqual(resolveFeatures(scope, user));
        expect(isCustomised(pruned)).toBe(
          !isDeepStrictEqual(resolveFeatures(scope, user), defaults),
        );
      }
    });
  });
});

describe('isCustomised', () => {
  test('empty layer is not customised', () => {
    expect(isCustomised({})).toBe(false);
  });

  test('any feature entry counts as customised', () => {
    expect(isCustomised({ pageKeys: { ratio: 0.5 } })).toBe(true);
    // Only meaningful after pruning; on its own it just checks for entries.
    expect(isCustomised({ pageKeys: {} })).toBe(true);
  });
});

describe('global and site user layers', () => {
  const site: SiteFeatures = { pageKeys: { ratio: 0.5, container: '#c' } };
  const global: UserSettings = { pageKeys: { ratio: 0.8 } };

  test('global overrides the site default', () => {
    expect(resolveFeatures(site, global).pageKeys).toEqual({
      ...DEFAULTS,
      ratio: 0.8,
      container: '#c',
    });
  });

  test('the site override wins over global, field by field', () => {
    expect(resolveFeatures(site, global, { pageKeys: { enabled: false } }).pageKeys).toEqual({
      ...DEFAULTS,
      enabled: false,
      ratio: 0.8,
      container: '#c',
    });
    expect(resolveFeatures(site, global, { pageKeys: { ratio: 0.4 } }).pageKeys?.ratio).toBe(0.4);
  });

  test('every layer is sanitized', () => {
    expect(
      resolveFeatures(ALL_SITES, asUser({ pageKeys: { ratio: 9 } }), asUser('x')).pageKeys,
    ).toEqual({ ...DEFAULTS, ratio: 1 });
  });

  test('site `false` still wins', () => {
    expect(resolveFeatures({ pageKeys: false }, global, global).pageKeys).toBeNull();
  });

  test('an override equal to the global value is pruned', () => {
    expect(pruneUserSettings(site, { pageKeys: { ratio: 0.8 } }, global)).toEqual({});
    expect(pruneUserSettings(site, { pageKeys: { ratio: 0.5 } }, global)).toEqual({
      pageKeys: { ratio: 0.5 },
    });
  });

  test('pruning an override keeps the effective settings', () => {
    for (const ratio of [0.3, 0.5, 0.8, 1]) {
      for (const enabled of [true, false]) {
        const user: UserSettings = { pageKeys: { ratio, enabled } };
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
