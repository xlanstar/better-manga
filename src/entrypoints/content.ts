import { allMatches, sitesFor } from '@/sites';
import { startFeatures } from '@/features/starters';
import { siteFixes } from '@/sites/fixes';
import { siteUrlFor } from '@/utils/site-url';
import { bindLifecycle } from '@/utils/lifecycle';

export default defineContentScript({
  matches: allMatches,
  runAt: 'document_start',
  allFrames: true,
  // Also run in `about:blank` / `about:srcdoc` frames of matching pages, so a
  // normal page load reaches the same frames as background re-injection
  // (`allFrames`); `siteUrlFor()` resolves which site they belong to.
  matchAboutBlank: true,
  main(ctx) {
    bindLifecycle(ctx);
    for (const site of sitesFor(siteUrlFor(location, document.referrer))) {
      // Site fixes first and synchronously: some must beat the page's scripts.
      runSafely(`${site.name} fixes`, siteFixes[site.name]);
      runSafely(`${site.name} features`, () => startFeatures(site));
    }
  },
});

/** Never break the host page because one site's script threw. */
function runSafely(label: string, fn: (() => void) | null) {
  try {
    fn?.();
  } catch (err) {
    console.debug(`[better-manga] ${label} failed`, err);
  }
}
