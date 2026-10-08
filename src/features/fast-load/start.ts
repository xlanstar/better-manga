import type { FeatureStart } from '../types';
import { preloadImages } from './images';
import type { FastLoadResolvedConfig } from './index';
import { isPrefetchFrame, leavePrefetchFrame, prefetchNextChapter } from './next-chapter';

export const startFastLoad: FeatureStart<FastLoadResolvedConfig> = (config, signal) => {
  const { origins, images, nextChapter, parallel } = config;

  if (isPrefetchFrame()) {
    if (images) void preloadImages(images, parallel, signal).then(leavePrefetchFrame);
    return;
  }
  if (window !== window.top) return;

  if (config.connect && origins) preconnect(origins, signal);
  if (savesData()) return;

  // The next chapter waits for this one's images (without preloading them,
  // for the page load), rather than compete with them.
  const chapterLoaded =
    config.preloadImages && images ? preloadImages(images, parallel, signal) : pageLoaded();
  if (config.preloadNext && nextChapter) {
    void chapterLoaded.then(() => prefetchNextChapter(nextChapter, signal));
  }
};

/**
 * Connect to `origins` before the page asks. Without `crossorigin`, so the
 * connections serve plain `<img>` requests, not CORS ones.
 */
function preconnect(origins: readonly string[], signal: AbortSignal) {
  const links = origins.map((href) =>
    Object.assign(document.createElement('link'), { rel: 'preconnect', href }),
  );
  // No <head> yet at document_start; a preconnect link works anywhere.
  document.documentElement?.append(...links);
  signal.addEventListener('abort', () => links.forEach((link) => link.remove()), { once: true });
}

/** Resolves on the window's load event, or now if it has fired. */
function pageLoaded(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
}

/** The user asked the browser to save data (Data Saver / `Save-Data`). */
function savesData(): boolean {
  const { connection } = navigator as Navigator & { connection?: { saveData?: boolean } };
  return connection?.saveData === true;
}
