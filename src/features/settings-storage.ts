/**
 * User settings in `browser.storage.local`. Everything read back is sanitized.
 *
 * - `global`: the user layer for all sites.
 * - `site:<name>`: one site's override layer; only exists when it differs.
 * - `disabledSites`: names of the sites the user turned Better Manga off on.
 *
 * One small item per site keeps writes cheap however many sites there are;
 * readers load (and watch) only the sites they need, in one `getItems` call
 * and one listener (`subscribeStoredSettings`).
 */
import { browser } from 'wxt/browser';
import { storage } from 'wxt/utils/storage';
import { sanitizeSiteNames, sanitizeUserSettings, type UserSettings } from './settings';

// Keys as `browser.storage.onChanged` reports them; `storage` takes them
// prefixed with the area (`local()`).
const GLOBAL_KEY = 'global';
const DISABLED_KEY = 'disabledSites';
const SITE_PREFIX = 'site:';
const siteKey = (siteName: string) => SITE_PREFIX + siteName;
const local = (key: string) => `local:${key}` as const;

export type StoredSettings = {
  global: UserSettings;
  /** Override layers by site name; sites without one are left out. */
  bySite: Record<string, UserSettings>;
  disabledSites: ReadonlySet<string>;
};

/** What changed in one storage event; only the parts that did are set. */
export type StoredSettingsChange = {
  global?: UserSettings;
  bySite?: Record<string, UserSettings>;
  disabledSites?: ReadonlySet<string>;
};

/** No settings stored: what a failed load counts as. */
export const EMPTY_SETTINGS: StoredSettings = { global: {}, bySite: {}, disabledSites: new Set() };

/**
 * Load the settings for `siteNames`, then keep them up to date: `onSettings`
 * gets the full, merged settings after the load and after every change.
 * Changes during the load are applied on top of it; a failed load counts as
 * empty settings. Returns unsubscribe.
 */
export function subscribeStoredSettings(
  siteNames: readonly string[],
  onSettings: (settings: StoredSettings) => void,
): () => void {
  const watched = new Set(siteNames);
  return loadAndWatch(
    () => loadStoredSettings(siteNames),
    (onChange) => {
      const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
        const change = parseStorageChanges(changes, area, watched);
        if (change) onChange(change);
      };
      browser.storage.onChanged.addListener(listener);
      return () => browser.storage.onChanged.removeListener(listener);
    },
    onSettings,
  );
}

/**
 * `subscribeStoredSettings` over any `load` and `watch` (exported for tests).
 * Watches first, so a change made while the load is in flight isn't lost: it
 * is queued and applied, in order, over the load result. After unsubscribing,
 * `onSettings` is never called again.
 */
export function loadAndWatch(
  load: () => Promise<StoredSettings>,
  watch: (onChange: (change: StoredSettingsChange) => void) => () => void,
  onSettings: (settings: StoredSettings) => void,
): () => void {
  let active = true;
  let settings: StoredSettings | null = null;
  const pending: StoredSettingsChange[] = [];
  const unwatch = watch((change) => {
    if (!active) return;
    if (!settings) pending.push(change);
    else onSettings((settings = mergeStoredSettings(settings, change)));
  });
  void load()
    .catch(() => EMPTY_SETTINGS)
    .then((loaded) => {
      if (!active) return;
      onSettings((settings = pending.reduce(mergeStoredSettings, loaded)));
    });
  return () => {
    active = false;
    unwatch();
  };
}

/** `change` applied over `prev`; untouched parts keep their identity. */
export function mergeStoredSettings(
  prev: StoredSettings,
  change: StoredSettingsChange,
): StoredSettings {
  const bySite = change.bySite ? { ...prev.bySite } : prev.bySite;
  for (const [name, value] of Object.entries(change.bySite ?? {})) {
    if (Object.keys(value).length) bySite[name] = value;
    else delete bySite[name];
  }
  return {
    global: change.global ?? prev.global,
    bySite,
    disabledSites: change.disabledSites ?? prev.disabledSites,
  };
}

/**
 * The settings in a `browser.storage.onChanged` event, sanitized: the global
 * layer, the disabled list, and the overrides of `watched` sites. `undefined`
 * when none of them changed.
 */
export function parseStorageChanges(
  changes: Record<string, { newValue?: unknown }>,
  area: string,
  watched: ReadonlySet<string>,
): StoredSettingsChange | undefined {
  if (area !== 'local') return;
  const change: StoredSettingsChange = {};
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key === GLOBAL_KEY) change.global = sanitizeUserSettings(newValue);
    else if (key === DISABLED_KEY) change.disabledSites = new Set(sanitizeSiteNames(newValue));
    else if (key.startsWith(SITE_PREFIX)) {
      const name = key.slice(SITE_PREFIX.length);
      if (watched.has(name)) (change.bySite ??= {})[name] = sanitizeUserSettings(newValue);
    }
  }
  return Object.keys(change).length ? change : undefined;
}

/** Everything for `siteNames`, in one storage call. */
async function loadStoredSettings(siteNames: readonly string[]): Promise<StoredSettings> {
  const items = await storage.getItems([
    local(GLOBAL_KEY),
    local(DISABLED_KEY),
    ...siteNames.map((name) => local(siteKey(name))),
  ]);
  const values = new Map(items.map((item) => [item.key, item.value]));
  const value = (key: string) => values.get(local(key));
  const bySite: Record<string, UserSettings> = {};
  for (const name of siteNames) {
    const settings = sanitizeUserSettings(value(siteKey(name)));
    if (Object.keys(settings).length) bySite[name] = settings;
  }
  return {
    global: sanitizeUserSettings(value(GLOBAL_KEY)),
    bySite,
    disabledSites: new Set(sanitizeSiteNames(value(DISABLED_KEY))),
  };
}

/** Store a (pruned) site override; an empty one is removed. */
export function saveSiteSettings(siteName: string, settings: UserSettings) {
  return saveOrRemove(local(siteKey(siteName)), settings);
}

/** Store the (pruned) global layer; an empty one is removed. */
export function saveGlobalSettings(settings: UserSettings) {
  return saveOrRemove(local(GLOBAL_KEY), settings);
}

export async function setSiteDisabled(siteName: string, disabled: boolean) {
  const current = new Set(sanitizeSiteNames(await storage.getItem(local(DISABLED_KEY))));
  if (disabled) current.add(siteName);
  else current.delete(siteName);
  return current.size
    ? storage.setItem(local(DISABLED_KEY), [...current].toSorted())
    : storage.removeItem(local(DISABLED_KEY));
}

function saveOrRemove(key: ReturnType<typeof local>, settings: UserSettings) {
  return Object.keys(settings).length ? storage.setItem(key, settings) : storage.removeItem(key);
}
