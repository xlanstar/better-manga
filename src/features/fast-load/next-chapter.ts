import { queryOne } from '@/utils/dom';
import type { NextChapterConfig } from './index';
import { otherPageUrl } from './urls';

/** `window.name` of the hidden frame the next chapter is prefetched in. */
const FRAME_NAME = 'better-manga-prefetch';

/** How long the frame may take to load the chapter before it's dropped. */
const FRAME_TIMEOUT_MS = 60_000;

/** Whether this page is the next chapter, prefetched by the one before. */
export function isPrefetchFrame(): boolean {
  return window !== window.top && window.name === FRAME_NAME;
}

/** From inside the prefetch frame: its work is done, remove it. */
export function leavePrefetchFrame(): void {
  window.frameElement?.remove();
}

/**
 * Open the chapter the next-chapter link points to in a hidden frame. The
 * content script runs there too: it preloads that chapter's images, then
 * removes the frame (see `start.ts`). Until then, writes to the
 * `keepStorage` keys from there are undone. Stops when `signal` aborts.
 */
export function prefetchNextChapter(
  { link, rewrite, keepStorage = [] }: NextChapterConfig,
  signal: AbortSignal,
): void {
  const anchor = queryOne(link);
  if (!(anchor instanceof HTMLAnchorElement) || !document.body || signal.aborted) return;
  const url = otherPageUrl(rewrite?.(anchor.href, location.origin) ?? anchor.href, location.href);
  if (!url) return;

  const frame = document.createElement('iframe');
  frame.name = FRAME_NAME;
  // Its scripts must run (they fetch the image list) under its own origin
  // (so its cache and storage are this page's); no popups or navigating us.
  frame.sandbox.add('allow-scripts', 'allow-same-origin');
  frame.style.display = 'none';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');
  frame.src = url;
  document.body.append(frame);

  const undoFrameWrites = (event: StorageEvent) => {
    const { key, oldValue, storageArea, url: writer } = event;
    if (!key || !keepStorage.includes(key) || storageArea !== localStorage) return;
    if (!frame.isConnected || writer !== frame.contentWindow?.location.href) return;
    if (oldValue === null) localStorage.removeItem(key);
    else localStorage.setItem(key, oldValue);
  };
  if (keepStorage.length) window.addEventListener('storage', undoFrameWrites, { signal });

  const timeout = setTimeout(() => frame.remove(), FRAME_TIMEOUT_MS);
  signal.addEventListener(
    'abort',
    () => {
      clearTimeout(timeout);
      frame.remove();
    },
    { once: true },
  );
}
