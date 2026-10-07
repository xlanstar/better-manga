/** Pure helpers for the popup's language override (see `utils/i18n.ts`). */

/** Locales in `src/locales/`, the default (`en`) first. */
export const LOCALES = ['en', 'zh_TW', 'zh_CN'] as const;
export type Locale = (typeof LOCALES)[number];
/** `auto` follows the browser's UI language. */
export type LocalePreference = Locale | 'auto';

/**
 * Each language's own name (shown as is whatever the UI language) and its
 * BCP 47 tag, so CJK names render with the right glyphs.
 */
export const LOCALE_NAMES: Record<Locale, { name: string; lang: string }> = {
  en: { name: 'English', lang: 'en' },
  zh_TW: { name: '繁體中文', lang: 'zh-Hant' },
  zh_CN: { name: '简体中文', lang: 'zh-Hans' },
};

/** A built `_locales/<locale>/messages.json`. */
export type Catalog = Record<string, { message?: unknown } | undefined>;

export function parseLocalePreference(raw: unknown): LocalePreference {
  return LOCALES.includes(raw as Locale) ? (raw as Locale) : 'auto';
}

/**
 * `key` (dotted, as in the yml) from the first catalog that has it, with
 * `$1`…`$9` substituted like `browser.i18n.getMessage`. `undefined` if no
 * catalog has it.
 */
export function lookupMessage(
  catalogs: readonly Catalog[],
  key: string,
  substitutions: readonly unknown[] = [],
): string | undefined {
  const name = key.replaceAll('.', '_');
  for (const catalog of catalogs) {
    const message = catalog[name]?.message;
    if (typeof message !== 'string') continue;
    return message.replaceAll(/\$(\$|[1-9])/g, (_, ref: string) =>
      ref === '$' ? '$' : String(substitutions[Number(ref) - 1] ?? ''),
    );
  }
  return undefined;
}
