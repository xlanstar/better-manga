import { isRealImage, realImageUrl, type ChapterImages } from '@/utils/chapter-images';
import { onEachMatch } from '@/utils/dom';
import { createLoadQueue } from './queue';

/**
 * Download the chapter's images into the cache, `parallel` at a time in page
 * order, including ones the page adds later, until `signal` aborts. Waits for
 * the page to show its first image, so they don't slow that one down.
 * Resolves the first time all the images found so far are in.
 */
export function preloadImages(
  images: ChapterImages,
  parallel: number,
  signal: AbortSignal,
): Promise<void> {
  const queue = createLoadQueue(parallel, loadImage);
  signal.addEventListener('abort', queue.stop, { once: true });
  afterFirstImage(images, signal, () =>
    onEachMatch(
      images.selector,
      (img) => {
        const url = realImageUrl(img, images);
        if (url) queue.add(url);
      },
      signal,
    ),
  );
  return queue.idle;
}

/**
 * Call `fn` once the page has loaded (or failed) one of the chapter's images
 * from its real URL (see `isRealImage`); right away if it already has.
 */
function afterFirstImage(images: ChapterImages, signal: AbortSignal, fn: () => void) {
  const loaded = [...document.querySelectorAll(images.selector)].some(
    (el) => isRealImage(el, images) && el.complete,
  );
  if (loaded) return fn();

  const done = new AbortController();
  const listen = { capture: true, signal: AbortSignal.any([signal, done.signal]) };
  const onSettle = (event: Event) => {
    if (!isRealImage(event.target, images)) return;
    done.abort();
    fn();
  };
  // Image events don't bubble, so capture them; on the document, as a
  // `load` event never reaches the window.
  document.addEventListener('load', onSettle, listen);
  document.addEventListener('error', onSettle, listen);
}

/** Resolves once `url` is in the cache, or failed. */
function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    // Below anything the page asks for, e.g. the image the reader scrolls to.
    img.fetchPriority = 'low';
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
    img.src = url;
  });
}
