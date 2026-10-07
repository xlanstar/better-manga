import { browser } from 'wxt/browser';
import type { ScriptPublicPath } from 'wxt/utils/inject-script';
import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  // Content scripts only start on page load, and after an update/reload the
  // instance in already-open tabs is orphaned (no storage events), so popup
  // settings would not apply until the user refreshes. Inject a fresh instance
  // into open matching tabs; it retires the old one (see `utils/lifecycle`).
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install' || reason === 'update') void reinjectContentScripts();
  });
});

async function reinjectContentScripts() {
  // Read from the manifest so paths and patterns stay in sync with the build.
  // (In `wxt dev` scripts are registered at runtime instead; nothing to do.)
  const scripts = browser.runtime.getManifest().content_scripts ?? [];
  await Promise.all(
    scripts.map(async (cs) => {
      if (!cs.matches?.length || !cs.js?.length) return;
      const tabs = await browser.tabs.query({ url: cs.matches }).catch(() => []);
      for (const tab of tabs) {
        if (tab.id == null || tab.discarded) continue;
        browser.scripting
          .executeScript({
            target: { tabId: tab.id, allFrames: !!cs.all_frames },
            // WXT types this as its known public paths; these come from the manifest.
            files: cs.js as ScriptPublicPath[],
          })
          .catch(() => {}); // tab closed, restricted page, no access — skip
      }
    }),
  );
}
