/** Scroll helpers for site scripts. */

const EDITABLE = 'input, textarea, select, [contenteditable]';
const SCROLLABLE = /^(auto|scroll|overlay)$/;

export type PageKeyScrollOptions = {
  /** Fraction of the viewport to scroll per key press. */
  ratio: number;
  /** Selector for the element that scrolls, when auto-detection gets it wrong. */
  container?: string;
};

/**
 * Make Page Up/Down scroll `ratio` of the viewport instead of the browser's
 * default (roughly one full screen). Ratios below 1 leave overlap between
 * screens, which is what long vertical readers want.
 *
 * `getOptions` is read on every key press, so settings changes apply live;
 * return `null` to leave the key to the browser.
 *
 * Scrolls whichever container actually holds the content — many readers put it
 * in their own overflow box rather than the document.
 */
export function overridePageKeyScroll(getOptions: () => PageKeyScrollOptions | null) {
  const controller = new AbortController();
  addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'PageDown' && e.key !== 'PageUp') return;
      const options = getOptions();
      if (!options) return;
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;

      const target = e.target instanceof Element ? e.target : null;
      // Let the browser handle keys aimed at a form field or editor.
      if (target?.closest(EDITABLE)) return;

      const scroller = findScrollContainer(target, options.container);
      if (!scroller) return;

      const height = scroller === document.scrollingElement ? innerHeight : scroller.clientHeight;
      e.preventDefault();
      scroller.scrollBy({
        top: height * options.ratio * (e.key === 'PageDown' ? 1 : -1),
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    },
    // Capture, so we win against the site's own Page Up/Down handler.
    { capture: true, signal: controller.signal },
  );
  /** Remove the override. */
  return () => controller.abort();
}

/**
 * The element matching `selector` if given and present, else the nearest
 * ancestor of `el` that scrolls vertically, else the document.
 */
function findScrollContainer(el: Element | null, selector?: string): Element | null {
  if (selector) {
    const forced = safeQuery(selector);
    if (forced) return forced;
  }
  for (let node = el; node instanceof HTMLElement; node = node.parentElement) {
    if (node.scrollHeight <= node.clientHeight) continue;
    if (SCROLLABLE.test(getComputedStyle(node).overflowY)) return node;
  }
  return document.scrollingElement;
}

function safeQuery(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null; // invalid selector — fall back to auto-detection
  }
}
