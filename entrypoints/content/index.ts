import { bindLifecycle } from '@/utils/lifecycle';
import { allMatches, sitesFor } from '@/sites';
import { siteFixes } from '@/sites/runtime';
import { startFeatures } from './features';

export default defineContentScript({
  matches: allMatches,
  runAt: 'document_start',
  allFrames: true,
  // Also run in `about:blank` / `about:srcdoc` frames of matching pages, so a
  // normal page load reaches the same frames as background re-injection
  // (`allFrames`); `pageUrl()` resolves which site they belong to.
  matchAboutBlank: true,
  main(ctx) {
    bindLifecycle(ctx);
    for (const site of sitesFor(pageUrl())) {
      // Never break the host page because one site's script threw.
      try {
        // Site fixes first and synchronously: some must beat the page's scripts.
        siteFixes[site.name]?.();
      } catch (err) {
        console.debug(`[better-manga] ${site.name} fixes failed`, err);
      }
      try {
        startFeatures(site);
      } catch (err) {
        console.debug(`[better-manga] ${site.name} features failed`, err);
      }
    }
  },
});

/**
 * The URL to match sites against. Script-injected frames are `about:blank` /
 * `about:srcdoc` (reached via `matchAboutBlank`, or `allFrames` re-injection
 * from the background) but inherit the parent's origin, so fall back to the
 * outermost ancestor — the browser only injects there when the parent frame
 * matches the manifest patterns.
 */
function pageUrl(): string {
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    return location.origin + location.pathname + location.search;
  }
  const origins = location.ancestorOrigins;
  const ancestor = origins?.length ? origins[origins.length - 1] : document.referrer;
  return ancestor ? new URL(ancestor).origin + '/' : '';
}
