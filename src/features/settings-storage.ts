/**
 * User settings in `browser.storage.local`. Everything read back is sanitized.
 *
 * - `global`: the user layer for all sites.
 * - `site:<name>`: one site's override layer; only exists when it differs.
 * - `disabledSites`: names of the sites the user turned Better Manga off on.
 *
 * One small item per site keeps writes cheap however many sites there are;
 * pages that need many read them in one `getItems` call.
 */
import { sanitizeSiteNames, sanitizeUserSettings, type UserSettings } from './settings';

const GLOBAL_KEY = 'local:global';
const DISABLED_KEY = 'local:disabledSites';
const siteKey = (siteName: string) => `local:site:${siteName}` as const;

export type StoredSettings = {
  global: UserSettings;
  /** Override layers by site name; sites without one are left out. */
  bySite: Record<string, UserSettings>;
  disabledSites: ReadonlySet<string>;
};

/** Everything for `siteNames`, in one storage call. */
export async function loadStoredSettings(siteNames: readonly string[]): Promise<StoredSettings> {
  const items = await storage.getItems([GLOBAL_KEY, DISABLED_KEY, ...siteNames.map(siteKey)]);
  const value = (key: string) => items.find((item) => item.key === key)?.value;
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
  return Object.keys(settings).length
    ? storage.setItem(siteKey(siteName), settings)
    : storage.removeItem(siteKey(siteName));
}

/** Store the (pruned) global layer; an empty one is removed. */
export function saveGlobalSettings(settings: UserSettings) {
  return Object.keys(settings).length
    ? storage.setItem(GLOBAL_KEY, settings)
    : storage.removeItem(GLOBAL_KEY);
}

export async function setSiteDisabled(siteName: string, disabled: boolean) {
  const current = new Set(sanitizeSiteNames(await storage.getItem(DISABLED_KEY)));
  if (disabled) current.add(siteName);
  else current.delete(siteName);
  return current.size
    ? storage.setItem(DISABLED_KEY, [...current].toSorted())
    : storage.removeItem(DISABLED_KEY);
}

/** What changed in one storage event; only the parts that did are set. */
export type StoredSettingsChange = {
  global?: UserSettings;
  bySite?: Record<string, UserSettings>;
  disabledSites?: ReadonlySet<string>;
};

/**
 * Call `onChange` whenever stored settings change: the global layer, the
 * disabled list, or the override of a site in `siteNames` (`null` = all
 * sites). One listener, however many sites are watched. Returns unwatch.
 */
export function watchStoredSettings(
  siteNames: readonly string[] | null,
  onChange: (change: StoredSettingsChange) => void,
) {
  const watched = siteNames && new Set(siteNames);
  const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area !== 'local') return;
    const change: StoredSettingsChange = {};
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key === 'global') change.global = sanitizeUserSettings(newValue);
      else if (key === 'disabledSites') change.disabledSites = new Set(sanitizeSiteNames(newValue));
      else if (key.startsWith('site:')) {
        const name = key.slice('site:'.length);
        if (watched && !watched.has(name)) continue;
        (change.bySite ??= {})[name] = sanitizeUserSettings(newValue);
      }
    }
    if (Object.keys(change).length) onChange(change);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
