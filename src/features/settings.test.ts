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

const DEFAULTS = features.pageDistance.defaults;

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
  describe('a renamed feature (pageScroll → pageDistance)', () => {
    test('reads settings stored under the old id', () => {
      expect(sanitizeUserSettings({ pageScroll: { enabled: false, ratio: 0.5 } })).toEqual({
        pageDistance: { enabled: false, ratio: 0.5 },
      });
    });

    test('prefers the new id when both are stored', () => {
      expect(
        sanitizeUserSettings({ pageScroll: { ratio: 0.5 }, pageDistance: { ratio: 0.8 } }),
      ).toEqual({ pageDistance: { ratio: 0.8 } });
    });

    test('falls back to the old id when the new one is not an object', () => {
      expect(sanitizeUserSettings({ pageScroll: { ratio: 0.5 }, pageDistance: 1 })).toEqual({
        pageDistance: { ratio: 0.5 },
      });
    });

    test('sanitizes it like any other', () => {
      expect(sanitizeUserSettings({ pageScroll: { ratio: 9, enabled: 'x' } })).toEqual({
        pageDistance: { ratio: 1 },
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
    ['string', '{"pageDistance":{"ratio":0.5}}'],
    ['boolean', true],
    ['array', [{ pageDistance: { ratio: 0.5 } }]],
    ['function', () => ({ pageDistance: { ratio: 0.5 } })],
  ])('non-object (%s) gives {}', (_, raw) => {
    expect(sanitizeUserSettings(raw)).toEqual({});
  });

  test('empty object gives {}', () => {
    expect(sanitizeUserSettings({})).toEqual({});
  });

  test('keeps valid feature values', () => {
    expect(sanitizeUserSettings({ pageDistance: { enabled: false, ratio: 0.5 } })).toEqual({
      pageDistance: { enabled: false, ratio: 0.5 },
    });
  });

  test('runs each feature sanitizer (clamps, drops bad fields)', () => {
    expect(sanitizeUserSettings({ pageDistance: { enabled: 'no', ratio: 7, x: 1 } })).toEqual({
      pageDistance: { ratio: 1 },
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
    expect(sanitizeUserSettings({ zoom: { level: 2 }, pageDistance: { ratio: 0.4 } })).toEqual({
      pageDistance: { ratio: 0.4 },
    });
  });

  test.each([
    ['null', null],
    ['string', 'on'],
    ['number', 0.5],
    ['boolean', false],
    ['array', [{ ratio: 0.5 }]],
  ])('drops a feature whose value is not an object (%s)', (_, pageDistance) => {
    expect(sanitizeUserSettings({ pageDistance })).toEqual({});
  });

  test('drops a feature left empty after sanitizing', () => {
    expect(sanitizeUserSettings({ pageDistance: {} })).toEqual({});
    expect(sanitizeUserSettings({ pageDistance: { ratio: 'x', enabled: 1 } })).toEqual({});
    expect('pageDistance' in sanitizeUserSettings({ pageDistance: { bogus: 1 } })).toBe(false);
  });

  test('accepts prototype-less objects', () => {
    const inner = Object.assign(Object.create(null), { ratio: 0.6 });
    const raw = Object.assign(Object.create(null), { pageDistance: inner });
    expect(sanitizeUserSettings(raw)).toEqual({ pageDistance: { ratio: 0.6 } });
  });

  test('inherited feature values are read, but still sanitized', () => {
    const raw = Object.create({ pageDistance: { ratio: 0.6, enabled: 'x' } });
    expect(sanitizeUserSettings(raw)).toEqual({ pageDistance: { ratio: 0.6 } });
  });

  test('is safe against a JSON `__proto__` key', () => {
    const raw = JSON.parse('{"__proto__": {"pageDistance": {"ratio": 0.5}}}');
    expect(sanitizeUserSettings(raw)).toEqual({});
    expect(({} as Record<string, unknown>).pageDistance).toBeUndefined();
  });

  test('does not mutate its input', () => {
    const raw = { pageDistance: { ratio: 9, enabled: 'x' }, other: 1 };
    const copy = structuredClone(raw);
    sanitizeUserSettings(raw);
    expect(raw).toEqual(copy);
  });

  test('returns fresh objects, not the input', () => {
    const inner = { ratio: 0.5 };
    const raw = { pageDistance: inner };
    const out = sanitizeUserSettings(raw);
    expect(out).not.toBe(raw);
    expect(out.pageDistance).not.toBe(inner);
  });

  test('is idempotent', () => {
    const inputs: unknown[] = [
      null,
      {},
      { pageDistance: { ratio: 0.5 } },
      { pageDistance: { ratio: -1, enabled: true } },
      { pageDistance: { ratio: Number.NaN } },
      { pageDistance: [], other: {} },
      { pageDistance: { enabled: false, ratio: 2, container: '#x' } },
    ];
    for (const raw of inputs) {
      const once = sanitizeUserSettings(raw);
      expect(sanitizeUserSettings(once)).toEqual(once);
    }
  });

  test('survives a JSON round trip (what storage does)', () => {
    const value = { pageDistance: { enabled: false, ratio: 0.45 } };
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
    expect(SITE_DEFAULTS.pageDistance).toEqual(DEFAULTS);
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
      expect(resolveFeatures({ pageDistance: { ratio: 0.5 } }, {}).blockAds).toBeNull();
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
    expect(resolveFeatures({ pageDistance: { ratio: 0.5 } }, {}).pageDistance).toEqual({
      enabled: true,
      ratio: 0.5,
    });
  });

  test('site layer can add adapters such as a scroll container', () => {
    expect(resolveFeatures({ pageDistance: { container: '#reader' } }, {}).pageDistance).toEqual({
      enabled: true,
      ratio: 0.7,
      container: '#reader',
    });
  });

  test('undefined site values fall through to the defaults', () => {
    expect(
      resolveFeatures({ pageDistance: { ratio: undefined, container: undefined } }, {})
        .pageDistance,
    ).toEqual(DEFAULTS);
  });

  test('an undefined site feature entry is the same as none', () => {
    expect(resolveFeatures({ pageDistance: undefined }, {}).pageDistance).toEqual(DEFAULTS);
  });

  test('site `false` turns the feature off entirely, whatever the user stored', () => {
    const site: SiteFeatures = { pageDistance: false };
    expect(resolveFeatures(site, {}).pageDistance).toBeNull();
    expect(
      resolveFeatures(site, { pageDistance: { enabled: true, ratio: 0.4 } }).pageDistance,
    ).toBe(null);
  });

  test('user layer overrides site and defaults', () => {
    const site: SiteFeatures = { pageDistance: { ratio: 0.5, container: '#c' } };
    expect(
      resolveFeatures(site, { pageDistance: { ratio: 0.9, enabled: false } }).pageDistance,
    ).toEqual({ enabled: false, ratio: 0.9, container: '#c' });
  });

  test('partial user layer only overrides what it sets', () => {
    const site: SiteFeatures = { pageDistance: { ratio: 0.5 } };
    expect(resolveFeatures(site, { pageDistance: { enabled: false } }).pageDistance).toEqual({
      enabled: false,
      ratio: 0.5,
    });
  });

  test('user layer is sanitized first', () => {
    expect(
      resolveFeatures(ALL_SITES, asUser({ pageDistance: { ratio: 99, enabled: 'off' } }))
        .pageDistance,
    ).toEqual({ enabled: true, ratio: 1 });
    expect(resolveFeatures(ALL_SITES, asUser({ pageDistance: { ratio: Number.NaN } }))).toEqual(
      ALL_DEFAULTS,
    );
  });

  test('a user cannot set a site adapter', () => {
    const resolved = resolveFeatures(ALL_SITES, asUser({ pageDistance: { container: 'body' } }));
    expect(resolved.pageDistance).toEqual(DEFAULTS);
    expect(resolved.pageDistance && 'container' in resolved.pageDistance).toBe(false);
  });

  test.each([
    ['string', 'x'],
    ['array', []],
    ['number', 3],
  ])('garbage user layer (%s) falls back to defaults', (_, user) => {
    expect(resolveFeatures(ALL_SITES, asUser(user))).toEqual(ALL_DEFAULTS);
  });

  test('does not mutate the defaults, the site or the user layer', () => {
    const site: SiteFeatures = { pageDistance: { ratio: 0.5 } };
    const user: UserSettings = { pageDistance: { enabled: false } };
    const resolved = resolveFeatures(site, user);
    expect(DEFAULTS).toEqual({ enabled: true, ratio: 0.7 });
    expect(site).toEqual({ pageDistance: { ratio: 0.5 } });
    expect(user).toEqual({ pageDistance: { enabled: false } });
    expect(resolved.pageDistance).not.toBe(DEFAULTS);
  });

  test('mutating a result does not leak into later results', () => {
    const first = resolveFeatures(ALL_SITES, undefined);
    first.pageDistance!.ratio = 0.1;
    first.pageDistance!.enabled = false;
    first.blockAds!.enabled = false;
    expect(resolveFeatures(ALL_SITES, undefined)).toEqual(ALL_DEFAULTS);
  });
});

describe('pruneUserSettings', () => {
  test('empty user layer stays empty', () => {
    expect(pruneUserSettings(ALL_SITES, {})).toEqual({});
  });

  test('drops values equal to the global defaults', () => {
    expect(pruneUserSettings(ALL_SITES, { pageDistance: { enabled: true, ratio: 0.7 } })).toEqual(
      {},
    );
  });

  test('keeps values that differ from the defaults', () => {
    expect(pruneUserSettings(ALL_SITES, { pageDistance: { enabled: false, ratio: 0.5 } })).toEqual({
      pageDistance: { enabled: false, ratio: 0.5 },
    });
  });

  test('keeps only the differing fields of a feature', () => {
    expect(pruneUserSettings(ALL_SITES, { pageDistance: { enabled: true, ratio: 0.5 } })).toEqual({
      pageDistance: { ratio: 0.5 },
    });
  });

  test('compares against the site default, not the global one', () => {
    const site: SiteFeatures = { pageDistance: { ratio: 0.5 } };
    // Equal to the site default: pruned.
    expect(pruneUserSettings(site, { pageDistance: { ratio: 0.5 } })).toEqual({});
    // Equal to the global default but not the site's: a real customisation.
    expect(pruneUserSettings(site, { pageDistance: { ratio: 0.7 } })).toEqual({
      pageDistance: { ratio: 0.7 },
    });
  });

  test('drops everything for a feature the site turned off', () => {
    expect(
      pruneUserSettings({ pageDistance: false }, { pageDistance: { enabled: false, ratio: 0.4 } }),
    ).toEqual({});
  });

  test('sanitizes first: invalid fields are dropped', () => {
    expect(
      pruneUserSettings(ALL_SITES, asUser({ pageDistance: { enabled: 'x', ratio: 0.4 } })),
    ).toEqual({ pageDistance: { ratio: 0.4 } });
    expect(pruneUserSettings(ALL_SITES, asUser({ other: { a: 1 } }))).toEqual({});
    expect(pruneUserSettings(ALL_SITES, asUser(null))).toEqual({});
  });

  test('sanitizes first: a value clamped onto the default is pruned', () => {
    const site: SiteFeatures = { pageDistance: { ratio: 1 } };
    expect(pruneUserSettings(site, { pageDistance: { ratio: 3 } })).toEqual({});
  });

  test('drops undefined fields', () => {
    expect(pruneUserSettings(ALL_SITES, { pageDistance: { ratio: undefined } })).toEqual({});
  });

  test('does not mutate its input', () => {
    const user: UserSettings = { pageDistance: { enabled: true, ratio: 0.5 } };
    pruneUserSettings(ALL_SITES, user);
    expect(user).toEqual({ pageDistance: { enabled: true, ratio: 0.5 } });
  });

  test('is idempotent', () => {
    const site: SiteFeatures = { pageDistance: { ratio: 0.5 } };
    const users: UserSettings[] = [
      {},
      { pageDistance: { ratio: 0.5 } },
      { pageDistance: { ratio: 0.6, enabled: true } },
      { pageDistance: { enabled: false } },
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
      { pageDistance: { ratio: 0.5 } },
      { pageDistance: { ratio: 0.3, container: '#c' } },
      { pageDistance: false },
    ];
    const users: unknown[] = [{}, null, { pageDistance: { bogus: 1 } }];
    for (const enabled of [undefined, true, false, 'x']) {
      for (const ratio of [undefined, 0, 0.3, 0.5, 0.7, 0.75, 1, 2, Number.NaN]) {
        users.push({ pageDistance: { enabled, ratio } });
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
    expect(isCustomised({ pageDistance: { ratio: 0.5 } })).toBe(true);
    // Only meaningful after pruning; on its own it just checks for entries.
    expect(isCustomised({ pageDistance: {} })).toBe(true);
  });
});

describe('global and site user layers', () => {
  const site: SiteFeatures = { pageDistance: { ratio: 0.5, container: '#c' } };
  const global: UserSettings = { pageDistance: { ratio: 0.8 } };

  test('global overrides the site default', () => {
    expect(resolveFeatures(site, global).pageDistance).toEqual({
      enabled: true,
      ratio: 0.8,
      container: '#c',
    });
  });

  test('the site override wins over global, field by field', () => {
    expect(
      resolveFeatures(site, global, { pageDistance: { enabled: false } }).pageDistance,
    ).toEqual({
      enabled: false,
      ratio: 0.8,
      container: '#c',
    });
    expect(
      resolveFeatures(site, global, { pageDistance: { ratio: 0.4 } }).pageDistance?.ratio,
    ).toBe(0.4);
  });

  test('every layer is sanitized', () => {
    expect(
      resolveFeatures(ALL_SITES, asUser({ pageDistance: { ratio: 9 } }), asUser('x')).pageDistance,
    ).toEqual({ enabled: true, ratio: 1 });
  });

  test('site `false` still wins', () => {
    expect(resolveFeatures({ pageDistance: false }, global, global).pageDistance).toBeNull();
  });

  test('an override equal to the global value is pruned', () => {
    expect(pruneUserSettings(site, { pageDistance: { ratio: 0.8 } }, global)).toEqual({});
    expect(pruneUserSettings(site, { pageDistance: { ratio: 0.5 } }, global)).toEqual({
      pageDistance: { ratio: 0.5 },
    });
  });

  test('pruning an override keeps the effective settings', () => {
    for (const ratio of [0.3, 0.5, 0.8, 1]) {
      for (const enabled of [true, false]) {
        const user: UserSettings = { pageDistance: { ratio, enabled } };
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
