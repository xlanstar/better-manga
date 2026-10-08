/** Shared DOM helpers for features. Content scripts run at document_start. */

/**
 * Hide every element matching `selectors`, now and later, with a stylesheet:
 * no work per mutation, and matches never render. Stops when `signal` aborts
 * (which un-hides them, unless a page CSP forced the inline-style fallback).
 */
export function keepHidden(selectors: readonly string[], signal: AbortSignal): void {
  if (signal.aborted) return;
  const style = document.createElement('style');
  style.setAttribute('data-better-manga', 'keep-hidden');
  // `textContent` (not a text node) keeps Firefox from applying the page's CSP.
  style.textContent = hideRules(selectors);

  const stop = () => {
    observer.disconnect(); // first, or it would re-attach the style
    style.remove();
  };

  // Child of <html> (no <head> at document_start). Some pages drop it or
  // replace <html>; re-attach. childList only, so reader DOM churn is free.
  const attachStyle = () => {
    const root = document.documentElement;
    if (!root || style.isConnected) return;
    root.append(style);
    observer.disconnect();
    observer.observe(document, { childList: true });
    observer.observe(root, { childList: true });
    // Blocked by a page CSP after all: fall back to inline styles.
    if (!style.sheet) {
      stop();
      onEachMatch(selectors.join(','), hideElement, signal);
    }
  };

  const observer = new MutationObserver(attachStyle);
  signal.addEventListener('abort', stop, { once: true });
  // In case there's no <html> yet.
  observer.observe(document, { childList: true });
  attachStyle();
}

/**
 * CSS hiding each selector, one rule per selector so an invalid one only drops
 * itself. Blank selectors are skipped.
 */
export function hideRules(selectors: readonly string[]): string {
  return selectors
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map((selector) => `${selector} { display: none !important; }`)
    .join('\n');
}

/**
 * Remove every element matching `selectors` as soon as the parser inserts it.
 * Called at document_start, this beats the page's deferred/module scripts, so
 * they never see the element (e.g. a config node an ad script reads).
 * Stops when `signal` aborts.
 */
export function keepRemoved(selectors: readonly string[], signal: AbortSignal): void {
  onEachMatch(selectors.join(','), (el) => el.remove(), signal);
}

/**
 * Call `fn` on every element matching `selector`, now and as they appear,
 * until `signal` aborts.
 */
export function onEachMatch(
  selector: string,
  fn: (el: HTMLElement) => void,
  signal: AbortSignal,
): void {
  const root = document.documentElement;
  if (!root || !selector || signal.aborted) return;

  const sweep = (node: ParentNode) => {
    for (const el of node.querySelectorAll<HTMLElement>(selector)) fn(el);
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target;
      // A class was added/removed on an existing node.
      if (target instanceof HTMLElement && target.isConnected && target.matches(selector)) {
        fn(target);
      }
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement) || !node.isConnected) continue;
        if (node.matches(selector)) fn(node);
        sweep(node);
      }
    }
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
  signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  sweep(root);
  // <html> is replaced wholesale on some pages; re-attach once the body exists.
  onDomReady(() => {
    if (signal.aborted) return;
    if (document.documentElement !== root) onEachMatch(selector, fn, signal);
    else sweep(document);
  });
}

/**
 * Click each element matching `selector` once, including ones the page adds
 * later, until `signal` aborts.
 *
 * Polling, not a MutationObserver — a poll can't miss a node that
 * appears and vanishes between callbacks, and this needs no burst handling.
 */
export function clickOnAppear(selector: string, signal: AbortSignal, pollMs = 500): void {
  if (signal.aborted) return;
  const clicked = new WeakSet<HTMLElement>();
  const timer = setInterval(() => {
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (clicked.has(el)) continue;
      clicked.add(el);
      el.click();
    }
  }, pollMs);
  signal.addEventListener('abort', () => clearInterval(timer), { once: true });
}

function hideElement(el: HTMLElement) {
  el.style.setProperty('display', 'none', 'important');
}

/** Run `fn` once the DOM is parsed. Safe to call at document_start. */
export function onDomReady(fn: () => void) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => fn(), { once: true });
  } else {
    fn();
  }
}
