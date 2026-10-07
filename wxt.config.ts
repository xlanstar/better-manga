import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // Extension source; `public/` stays at the root.
  srcDir: 'src',
  // i18n: messages in `src/locales/<locale>.yml`, read with `i18n.t` from `#i18n`.
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  dev: {
    server: {
      port: 3737,
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    default_locale: 'en',
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    // storage: per-site user settings. activeTab: popup reads the current tab's URL.
    // scripting: re-inject content scripts into open tabs after install/update.
    permissions: ['storage', 'activeTab', 'scripting'],
  },
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
