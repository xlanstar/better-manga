import { isRealImage } from '@/utils/chapter-images';
import { onImageEvent, queryAll } from '@/utils/dom';
import type { FeatureResolvedConfig } from '../index';
import type { FeatureStart } from '../types';
import { addFailure, retryDelay, type Failures } from './retry';

export const startReloadBrokenImages: FeatureStart<FeatureResolvedConfig<'reloadBrokenImages'>> = (
  { images },
  signal,
) => {
  if (!images) return;
  const failures = new WeakMap<HTMLImageElement, Failures>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  signal.addEventListener('abort', () => timers.forEach(clearTimeout), { once: true });

  const onError = ({ target: img }: Event) => {
    if (!isRealImage(img, images)) return;
    const failure = addFailure(failures.get(img), img.src);
    failures.set(img, failure);
    const delay = retryDelay(failure.count);
    if (delay === null) return;
    const timer = setTimeout(() => {
      timers.delete(timer);
      // Unless the page has moved on: swapped the URL, retried it itself, or
      // dropped the image.
      if (img.src === failure.url && isBroken(img) && img.isConnected) reload(img);
    }, delay);
    timers.add(timer);
  };
  const onLoad = ({ target }: Event) => {
    if (target instanceof HTMLImageElement) failures.delete(target);
  };
  // What gave up offline gets another round.
  const onOnline = () => {
    for (const img of queryAll(images.selector)) {
      if (!isRealImage(img, images) || !isBroken(img)) continue;
      failures.delete(img);
      reload(img);
    }
  };

  onImageEvent('error', onError, signal);
  onImageEvent('load', onLoad, signal);
  window.addEventListener('online', onOnline, { signal });
};

/** Done loading, with nothing to show: it failed. */
function isBroken(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth === 0;
}

/**
 * Request `img`'s URL again. Setting `src`, even to the same value, restarts
 * the load, and a failed load isn't cached, so it reaches the server. The URL
 * stays as is (no cache-busting query): it may be signed.
 */
function reload(img: HTMLImageElement) {
  const src = img.getAttribute('src');
  if (src !== null) img.setAttribute('src', src);
}
