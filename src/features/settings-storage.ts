/**
 * The user layer in `browser.storage.local`, one item per site. Everything
 * read back is sanitized (see `sanitizeUserSettings`).
 */
import { sanitizeUserSettings, type UserSettings } from './settings';

const storageKey = (siteName: string) => `local:site:${siteName}` as const;

export async function loadUserSettings(siteName: string): Promise<UserSettings> {
  return sanitizeUserSettings(await storage.getItem(storageKey(siteName)));
}

export function saveUserSettings(siteName: string, settings: UserSettings) {
  return storage.setItem(storageKey(siteName), settings);
}

export function resetUserSettings(siteName: string) {
  return storage.removeItem(storageKey(siteName));
}

/** Call `onChange` whenever this site's settings change. Returns unwatch. */
export function watchUserSettings(siteName: string, onChange: (settings: UserSettings) => void) {
  return storage.watch<unknown>(storageKey(siteName), (value) =>
    onChange(sanitizeUserSettings(value)),
  );
}
