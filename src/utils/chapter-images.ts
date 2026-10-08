import { matches } from './dom';
import { httpUrl } from './url';

/** The chapter's page images, as the page lazy-loads them. */
export type ChapterImages = {
  /** Every page image, loaded or not (e.g. `#chapcontent img[data-src]`). */
  selector: string;
  /** The attribute holding an image's real URL until the page loads it. */
  src: string;
};

/** `img`'s real URL, from `images.src`; `null` if it has none to swap in. */
export function realImageUrl(img: Element, images: ChapterImages): string | null {
  return httpUrl(img.getAttribute(images.src), document.baseURI);
}

/**
 * Whether `el` is one of the chapter's images, loading (or done loading) its
 * real URL: swapped in, or its own `src` if it has none to swap (not
 * lazy-loaded). Not while it shows a lazy-load placeholder.
 */
export function isRealImage(el: EventTarget | null, images: ChapterImages): el is HTMLImageElement {
  if (!(el instanceof HTMLImageElement) || !matches(el, images.selector)) return false;
  const url = realImageUrl(el, images);
  return url === null || el.src === url;
}
