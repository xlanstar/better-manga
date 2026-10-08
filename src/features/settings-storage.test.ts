import { describe, expect, mock, test } from 'bun:test';
import type { UserSettings } from './settings';
import {
  loadAndWatch,
  mergeStoredSettings,
  parseStorageChanges,
  type StoredSettings,
  type StoredSettingsChange,
} from './settings-storage';

const A: UserSettings = { pageKeys: { ratio: 0.5 } };
const B: UserSettings = { pageKeys: { enabled: false } };

/** Let pending promise callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const stored = (): StoredSettings => ({
  global: A,
  bySite: { one: A, two: B },
  disabledSites: new Set(['off']),
});

describe('mergeStoredSettings', () => {
  test('replaces the global layer and the disabled list', () => {
    const disabledSites = new Set(['other']);
    const next = mergeStoredSettings(stored(), { global: B, disabledSites });
    expect(next.global).toBe(B);
    expect(next.disabledSites).toBe(disabledSites);
  });

  test('sets and replaces site overrides, deletes empty ones', () => {
    const next = mergeStoredSettings(stored(), { bySite: { one: B, two: {}, three: A } });
    expect(next.bySite).toEqual({ one: B, three: A });
  });

  test('keeps the identity of untouched parts', () => {
    const prev = stored();
    expect(mergeStoredSettings(prev, { global: B })).toMatchObject({
      bySite: prev.bySite,
      disabledSites: prev.disabledSites,
    });
    expect(mergeStoredSettings(prev, { bySite: { one: B } }).global).toBe(prev.global);
  });

  test('does not mutate prev', () => {
    const prev = stored();
    mergeStoredSettings(prev, { global: B, bySite: { one: B, two: {} }, disabledSites: new Set() });
    expect(prev).toEqual(stored());
  });
});

describe('parseStorageChanges', () => {
  const watched = new Set(['one']);

  test('maps keys to their parts', () => {
    expect(
      parseStorageChanges(
        {
          global: { newValue: A },
          disabledSites: { newValue: ['one', 'two'] },
          'site:one': { newValue: B },
        },
        'local',
        watched,
      ),
    ).toEqual({ global: A, disabledSites: new Set(['one', 'two']), bySite: { one: B } });
  });

  test('sanitizes values; a removed item reads as empty', () => {
    expect(
      parseStorageChanges(
        {
          global: { newValue: { pageKeys: { ratio: 7, x: 1 } } },
          disabledSites: { newValue: ['one', 1, '', 'one'] },
          'site:one': {},
        },
        'local',
        watched,
      ),
    ).toEqual({
      global: { pageKeys: { ratio: 1 } },
      disabledSites: new Set(['one']),
      bySite: { one: {} },
    });
  });

  test('only sets the parts that changed', () => {
    expect(parseStorageChanges({ global: { newValue: A } }, 'local', watched)).toEqual({
      global: A,
    });
  });

  test.each([
    ['another area', { global: { newValue: A } }, 'sync'],
    ['unknown keys', { locale: { newValue: 'en' } }, 'local'],
    ['unwatched sites', { 'site:two': { newValue: A } }, 'local'],
    ['no changes', {}, 'local'],
  ])('ignores %s', (_, changes, area) => {
    expect(parseStorageChanges(changes, area, watched)).toBeUndefined();
  });
});

/** A controllable load and watch, and the settings `onSettings` got. */
function setup(load: () => Promise<StoredSettings>) {
  let emit: ((change: StoredSettingsChange) => void) | undefined;
  const unwatch = mock(() => {});
  const received: StoredSettings[] = [];
  const unsubscribe = loadAndWatch(
    load,
    (onChange) => {
      emit = onChange;
      return unwatch;
    },
    (settings) => received.push(settings),
  );
  return { emit: (change: StoredSettingsChange) => emit?.(change), unwatch, received, unsubscribe };
}

/** A load that resolves when told to. */
function deferredLoad() {
  const { promise, resolve } = Promise.withResolvers<StoredSettings>();
  return { load: () => promise, resolve };
}

describe('loadAndWatch', () => {
  test('delivers the load, then each change merged into it', async () => {
    const { received, emit } = setup(async () => stored());
    await settle();
    expect(received).toEqual([stored()]);
    emit({ global: B });
    expect(received[1]).toEqual({ ...stored(), global: B });
  });

  test('applies changes made during the load over its result, in order', async () => {
    const { load, resolve } = deferredLoad();
    const { received, emit } = setup(load);
    emit({ global: B });
    emit({ bySite: { one: {} } });
    emit({ global: {} });
    expect(received).toEqual([]);
    resolve(stored());
    await settle();
    expect(received).toEqual([{ ...stored(), global: {}, bySite: { two: B } }]);
  });

  test('a failed load counts as empty settings', async () => {
    const { received, emit } = setup(() => Promise.reject(new Error('no storage')));
    emit({ global: A });
    await settle();
    expect(received).toEqual([{ global: A, bySite: {}, disabledSites: new Set() }]);
  });

  test('unsubscribing unwatches and silences a pending load', async () => {
    const { load, resolve } = deferredLoad();
    const { received, emit, unwatch, unsubscribe } = setup(load);
    unsubscribe();
    expect(unwatch).toHaveBeenCalledTimes(1);
    resolve(stored());
    emit({ global: B });
    await settle();
    expect(received).toEqual([]);
  });
});
