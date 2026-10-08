import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

/**
 * Oldest browsers the extension supports; raise these when the code needs
 * something newer. Chrome 119: `Promise.withResolvers` (`AbortSignal.any`
 * needs 116, Tailwind v4 111). Firefox 128 (ESR): Tailwind v4, which needs
 * `@property` (`AbortSignal.any` needs 124, `Promise.withResolvers` 121).
 */
const MIN_CHROME_VERSION = '119';
const MIN_FIREFOX_VERSION = '128.0';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // Extension source; `public/` stays at the root.
  srcDir: 'src',
  // Explicit imports only: no name clashes, and imports show real dependencies.
  imports: false,
  // i18n: messages in `src/locales/<locale>.yml`, read with `i18n.t` from `@/utils/i18n`.
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  dev: {
    server: {
      port: 3737,
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser }) => ({
    default_locale: 'en',
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    // storage: per-site user settings. activeTab: popup reads the current tab's URL.
    // scripting: re-inject content scripts into open tabs after install/update.
    permissions: ['storage', 'activeTab', 'scripting'],
    // Each browser only knows its own key, and warns about the other's.
    ...(browser === 'firefox'
      ? { browser_specific_settings: { gecko: { strict_min_version: MIN_FIREFOX_VERSION } } }
      : { minimum_chrome_version: MIN_CHROME_VERSION }),
  }),
  hooks: {
    // Grant host access to exactly the supported sites (the content script
    // matches), so the background can find and re-inject into their open tabs.
    // Content script matches alone don't allow that. Same sites, so no new
    // permission warning.
    'build:manifestGenerated': (_, manifest) => {
      const matches = manifest.content_scripts?.flatMap((cs) => cs.matches ?? []) ?? [];
      if (!matches.length) return;
      if (manifest.manifest_version === 3) {
        manifest.host_permissions = [
          ...new Set([...(manifest.host_permissions ?? []), ...matches]),
        ];
      } else {
        manifest.permissions = [...new Set([...(manifest.permissions ?? []), ...matches])];
      }
    },
  },
});
