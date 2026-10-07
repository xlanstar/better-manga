import { bindLifecycle } from '@/utils/lifecycle';
import { startFeatures } from './features';
import { allMatches, sitesFor } from './sites';

export default defineContentScript({
  matches: allMatches,
  runAt: 'document_start',
  allFrames: true,
  main(ctx) {
    bindLifecycle(ctx);
    for (const site of sitesFor(pageUrl())) {
      // Never break the host page because one site's script threw.
      try {
        // Site fixes first and synchronously: some must beat the page's scripts.
        site.run?.();
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
 * `about:srcdoc` but inherit the parent's origin, so fall back to the outermost
 * ancestor — the browser already gated injection on the manifest patterns.
 */
function pageUrl(): string {
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    return location.origin + location.pathname + location.search;
  }
  const origins = location.ancestorOrigins;
  const ancestor = origins?.length ? origins[origins.length - 1] : document.referrer;
  return ancestor ? new URL(ancestor).origin + '/' : '';
}
