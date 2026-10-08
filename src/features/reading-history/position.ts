import type { ChapterImages } from '@/utils/chapter-images';
import { CHAPTER_START, type ReadingPosition } from './history';

/** How long after the chapter opens restoring keeps following its image. */
const RESTORE_TIMEOUT_MS = 60_000;

/** Less than this far into the first page is the start: nothing to restore. */
const NEAR_START_OFFSET = 0.25;

/** Offsets are kept to a thousandth of the image: a pixel's scroll is rarely a change. */
const OFFSET_SCALE = 1000;

/** The reader scrolling (or about to) themselves; restoring gives way. */
const USER_INPUT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

/** An image's vertical extent, from the top of the viewport. */
type Box = Pick<DOMRect, 'top' | 'height'>;

/**
 * The position shown, from the page images' boxes in page order: the first
 * image reaching below the top of the viewport. Images not laid out (zero
 * height) don't count. Past the last image, its end; before any, the start.
 */
export function positionAt(boxes: readonly Box[]): ReadingPosition {
  let last = -1;
  for (const [page, { top, height }] of boxes.entries()) {
    if (height <= 0) continue;
    if (top + height > 0) return { page, offset: roundOffset(Math.max(0, -top) / height) };
    last = page;
  }
  return last === -1 ? CHAPTER_START : { page: last, offset: 1 };
}

/** Whether `position` is at or near the start of the chapter. */
export function isNearStart({ page, offset }: ReadingPosition): boolean {
  return page === 0 && offset < NEAR_START_OFFSET;
}

/** The position on screen now. */
export function readPosition(images: ChapterImages): ReadingPosition {
  return positionAt(pageImages(images).map((img) => img.getBoundingClientRect()));
}

/**
 * Aborts the first time the reader scrolls, taps, clicks or presses a key
 * (from now until `signal` aborts): from then on, they decide where to be.
 */
export function userInputSignal(signal: AbortSignal): AbortSignal {
  const input = new AbortController();
  const onInput = () => input.abort();
  const listen = { capture: true, passive: true, signal: AbortSignal.any([signal, input.signal]) };
  for (const type of USER_INPUT_EVENTS) window.addEventListener(type, onInput, listen);
  return input.signal;
}

/**
 * Scroll back to `position` once its image exists, and keep it in place as
 * images load and shift the page, until `signal` aborts or
 * `RESTORE_TIMEOUT_MS` passes.
 */
export function restorePosition(
  position: ReadingPosition,
  images: ChapterImages,
  signal: AbortSignal,
): void {
  const align = () => {
    const img = pageImages(images)[position.page];
    if (!img) return;
    const { top, height } = img.getBoundingClientRect();
    const delta = top + position.offset * height;
    if (height > 0 && Math.abs(delta) >= 1) window.scrollBy({ top: delta, behavior: 'instant' });
  };
  // Image events don't bubble, so capture them; on the document, as a
  // `load` event never reaches the window.
  const restoring = AbortSignal.any([signal, AbortSignal.timeout(RESTORE_TIMEOUT_MS)]);
  document.addEventListener('load', align, { capture: true, signal: restoring });
  align();
}

function pageImages({ selector }: ChapterImages): Element[] {
  try {
    return [...document.querySelectorAll(selector)];
  } catch {
    return []; // invalid selector
  }
}

function roundOffset(offset: number): number {
  return Math.round(offset * OFFSET_SCALE) / OFFSET_SCALE;
}
