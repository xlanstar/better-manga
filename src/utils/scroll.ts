/**
 * Page Up/Down handling, shared by the features that change it: one sets the
 * distance (`pageDistance`), another animates it (`smoothScroll`). Each
 * registers its part with `contributePageKeyScroll`; one key listener reads
 * them all, so the features stay independent switches without fighting over
 * the same key press.
 */

import { queryOne } from './dom';
import { createSmoothScroller } from './smooth-scroll';

/** Keys aimed at these are left to the browser (typing, not scrolling). */
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable]';
/** `overflow-y` values that make an element scroll on its own. */
const SCROLLABLE_OVERFLOW = /^(auto|scroll|overlay)$/;
/** Keys that don't scroll on their own, so they don't interrupt a scroll. */
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta']);
/**
 * The browser's own page step (Chromium's rule; Firefox's is close): at least
 * 87.5 % of the height, at most 40 px short of it.
 */
const BROWSER_PAGE_STEP = { minRatio: 0.875, maxOverlap: 40 } as const;

/** How to animate: `duration` in ms (see `SmoothScrollTiming`), `holdSpeed` in screens/s. */
export type PageKeySmooth = { duration: number; holdSpeed: number };

/** What one feature contributes to Page Up/Down handling. */
export type PageKeyScrollPart = {
  /** Fraction of the viewport to scroll per key press. */
  ratio?: number;
  /** Animate the scroll (see `smooth-scroll.ts`). */
  smooth?: PageKeySmooth;
  /** Selector for the element that scrolls, when auto-detection gets it wrong. */
  container?: string;
};

/** The parts combined. No `ratio` = the browser's own step; no `smooth` = jump. */
export type PageKeyScrollOptions = { ratio?: number; smooth?: PageKeySmooth; container?: string };

/** The `KeyboardEvent` fields `pageKeyDirection` reads. */
export type PageKeyEvent = Pick<
  KeyboardEvent,
  'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey' | 'defaultPrevented'
>;

/** Each registered part, read on every key press (`null` = sits it out). */
const parts = new Set<() => PageKeyScrollPart | null>();
/** The key listeners, installed while any part is registered. */
let listening: AbortController | null = null;

/**
 * Take over Page Up/Down with `getPart` merged into what other features
 * contribute (see `mergePageKeyParts`), until `signal` aborts. `getPart` is
 * read on every key press; return `null` to sit out.
 *
 * Scrolls whichever container actually holds the content — many readers put it
 * in their own overflow box rather than the document.
 */
export function contributePageKeyScroll(
  getPart: () => PageKeyScrollPart | null,
  signal: AbortSignal,
): void {
  if (signal.aborted) return;
  parts.add(getPart);
  listening ??= listen();
  signal.addEventListener(
    'abort',
    () => {
      parts.delete(getPart);
      if (parts.size) return;
      listening?.abort();
      listening = null;
    },
    { once: true },
  );
}

/**
 * Combine the features' parts: the first `ratio`, `smooth` and `container`
 * set. `null` when nothing changes the browser's own behaviour, so the key is
 * left to it.
 */
export function mergePageKeyParts(
  all: readonly (PageKeyScrollPart | null)[],
): PageKeyScrollOptions | null {
  const active = all.filter((part) => part !== null);
  const options: PageKeyScrollOptions = {};
  const ratio = active.find((part) => part.ratio !== undefined)?.ratio;
  const smooth = active.find((part) => part.smooth)?.smooth;
  const container = active.find((part) => part.container)?.container;
  if (ratio !== undefined) options.ratio = ratio;
  if (smooth) options.smooth = smooth;
  if (container) options.container = container;
  return ratio === undefined && !smooth ? null : options;
}

/** How far one press scrolls a box `height` px tall: `ratio` of it, else the browser's step. */
export function pageStep(height: number, ratio?: number): number {
  if (ratio !== undefined) return height * ratio;
  return Math.max(height * BROWSER_PAGE_STEP.minRatio, height - BROWSER_PAGE_STEP.maxOverlap);
}

/**
 * `1` for a plain Page Down, `-1` for a plain Page Up, `0` for anything else:
 * other keys, modifier combos (zoom, tab switching, selection, …), or a key
 * the page already handled.
 */
export function pageKeyDirection(event: PageKeyEvent): 1 | -1 | 0 {
  if (event.defaultPrevented) return 0;
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return 0;
  if (event.key === 'PageDown') return 1;
  if (event.key === 'PageUp') return -1;
  return 0;
}

/** Install the one set of key listeners; removed when the result aborts. */
function listen(): AbortController {
  const controller = new AbortController();
  const { signal } = controller;
  const smooth = createSmoothScroller(signal);

  const onKeyDown = (event: KeyboardEvent) => {
    const direction = pageKeyDirection(event);
    if (!direction) {
      // Arrow keys, Space, Home, … scroll by themselves; don't fight them.
      if (!MODIFIER_KEYS.has(event.key)) smooth.stop();
      return;
    }
    const options = mergePageKeyParts([...parts].map((getPart) => getPart()));
    if (!options) return;

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(EDITABLE_SELECTOR)) return;

    const scroller = findScrollContainer(target, options.container);
    if (!scroller) return;

    event.preventDefault();
    const height = visibleHeight(scroller);
    const delta = pageStep(height, options.ratio) * direction;
    if (options.smooth) {
      const { duration, holdSpeed } = options.smooth;
      const timing = { duration, holdSpeed: (holdSpeed * height) / 1000 };
      smooth.scrollBy(scroller, delta, timing, event.repeat);
    } else {
      smooth.stop();
      scroller.scrollBy({ top: delta, behavior: 'instant' });
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'PageDown' || event.key === 'PageUp') smooth.release();
  };
  // Capture, so we win against the site's own Page Up/Down handler.
  window.addEventListener('keydown', onKeyDown, { capture: true, signal });
  window.addEventListener('keyup', onKeyUp, { capture: true, signal });
  return controller;
}

/**
 * The element matching `selector` if given and present, else the nearest
 * ancestor of `el` that scrolls vertically, else the document.
 */
function findScrollContainer(el: Element | null, selector?: string): Element | null {
  if (selector) {
    const forced = queryOne(selector);
    if (forced) return forced;
  }
  for (let node = el; node instanceof HTMLElement; node = node.parentElement) {
    if (node.scrollHeight <= node.clientHeight) continue;
    if (SCROLLABLE_OVERFLOW.test(getComputedStyle(node).overflowY)) return node;
  }
  return document.scrollingElement;
}

/** The document scrolls by the viewport; any other box by its own height. */
function visibleHeight(scroller: Element): number {
  return scroller === document.scrollingElement ? innerHeight : scroller.clientHeight;
}
