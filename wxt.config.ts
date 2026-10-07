import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  dev: {
    server: {
      port: 3737,
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Better Manga',
    description: 'Enhances manga reading sites.',
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
