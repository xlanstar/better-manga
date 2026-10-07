import { defineContentScript } from 'wxt/utils/define-content-script';
import { allMatches, sectionFor, siteFor } from '@/sites';
import { startFeatures } from '@/features/starters';
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
    const url = siteUrlFor(location, document.referrer);
    const site = siteFor(url);
    // Synchronously: some features must beat the page's scripts.
    if (site) startFeatures(site, sectionFor(site, url));
  },
});
