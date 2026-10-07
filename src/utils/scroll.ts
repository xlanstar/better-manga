/** Shared scroll helpers for features. */

/** Keys aimed at these are left to the browser (typing, not scrolling). */
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable]';
/** `overflow-y` values that make an element scroll on its own. */
const SCROLLABLE_OVERFLOW = /^(auto|scroll|overlay)$/;

export type PageKeyScrollOptions = {
  /** Fraction of the viewport to scroll per key press. */
  ratio: number;
  /** Selector for the element that scrolls, when auto-detection gets it wrong. */
  container?: string;
};

/** The `KeyboardEvent` fields `pageKeyDirection` reads. */
export type PageKeyEvent = Pick<
  KeyboardEvent,
  'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey' | 'defaultPrevented'
>;

/**
 * Make Page Up/Down scroll `ratio` of the viewport instead of the browser's
 * default (roughly one full screen). Ratios below 1 leave overlap between
 * screens, which is what long vertical readers want.
 *
 * `getOptions` is read on every key press; return `null` to leave the key to
 * the browser.
 *
 * Scrolls whichever container actually holds the content — many readers put it
 * in their own overflow box rather than the document. Removed when `signal`
 * aborts.
 */
export function overridePageKeyScroll(
  getOptions: () => PageKeyScrollOptions | null,
  signal: AbortSignal,
): void {
  const onKeyDown = (event: KeyboardEvent) => {
    const direction = pageKeyDirection(event);
    if (!direction) return;
    const options = getOptions();
    if (!options) return;

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(EDITABLE_SELECTOR)) return;

    const scroller = findScrollContainer(target, options.container);
    if (!scroller) return;

    event.preventDefault();
    scroller.scrollBy({
      top: visibleHeight(scroller) * options.ratio * direction,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };
  // Capture, so we win against the site's own Page Up/Down handler.
  window.addEventListener('keydown', onKeyDown, { capture: true, signal });
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

/**
 * The element matching `selector` if given and present, else the nearest
 * ancestor of `el` that scrolls vertically, else the document.
 */
function findScrollContainer(el: Element | null, selector?: string): Element | null {
  if (selector) {
    const forced = querySafely(selector);
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

function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function querySafely(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null; // invalid selector — fall back to auto-detection
  }
}
