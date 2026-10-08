/**
 * UI text, with a user-chosen language. `browser.i18n` always follows the
 * browser's language, so for an explicit choice the popup loads the built
 * `_locales/<locale>/messages.json` (plus the default locale as fallback) and
 * reads from those; anything missing falls back to `browser.i18n`.
 *
 * Use `i18n.t` from here, not from `#i18n`.
 */
import { browser } from 'wxt/browser';
import { storage } from 'wxt/utils/storage';
import { i18n as browserI18n } from '#i18n';
import {
  LOCALES,
  lookupMessage,
  parseLocalePreference,
  type Catalog,
  type LocalePreference,
} from './messages';

const preferenceItem = storage.defineItem<unknown>('local:locale');

let preference: LocalePreference = 'auto';
let catalogs: Catalog[] = [];
const listeners = new Set<() => void>();

export const i18n: typeof browserI18n = {
  t: ((key: string, ...args: unknown[]) => {
    const substitutions = args.find(Array.isArray) as unknown[] | undefined;
    return (
      lookupMessage(catalogs, key, substitutions) ??
      (browserI18n.t as (...a: unknown[]) => string)(key, ...args)
    );
  }) as typeof browserI18n.t,
};

export const getLocalePreference = () => preference;

/** Call `listener` after the language changes. Returns unsubscribe. */
export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Apply the stored preference; call once before the first render. */
export async function initLocale() {
  const stored = await preferenceItem.getValue().catch(() => undefined);
  await applyLocale(parseLocalePreference(stored));
}

/** Store and apply a new preference. */
export async function setLocalePreference(next: LocalePreference) {
  await applyLocale(next);
  await (next === 'auto' ? preferenceItem.removeValue() : preferenceItem.setValue(next));
}

async function applyLocale(next: LocalePreference) {
  catalogs = next === 'auto' ? [] : await loadCatalogs([next, LOCALES[0]]);
  preference = next;
  document.documentElement.lang = i18n.t('lang');
  for (const listener of listeners) listener();
}

async function loadCatalogs(locales: string[]): Promise<Catalog[]> {
  const loaded = await Promise.all(
    [...new Set(locales)].map(async (locale) => {
      try {
        // `getURL` is typed to public paths only; `_locales/` is built by WXT.
        const url = browser.runtime.getURL(`/_locales/${locale}/messages.json` as '/');
        const res = await fetch(url);
        return res.ok ? ((await res.json()) as Catalog) : null;
      } catch {
        return null;
      }
    }),
  );
  return loaded.filter((catalog) => catalog !== null);
}
