/** Shared DOM helpers for site scripts. Content scripts run at document_start. */

import { isAlive, onRetire } from './lifecycle';

/**
 * Hide every element matching `selectors` — the ones already in the page, the
 * ones inserted later, and the ones that only gain a matching class later.
 * Returns the observer so a caller can stop watching.
 */
export function keepHidden(...selectors: string[]): MutationObserver | undefined {
  return onEachMatch(selectors.join(','), hideElement);
}

/**
 * Remove every element matching `selectors` as soon as the parser inserts it.
 * Called at document_start, this beats the page's deferred/module scripts, so
 * they never see the element (e.g. a config node an ad script reads).
 */
export function keepRemoved(...selectors: string[]): MutationObserver | undefined {
  return onEachMatch(selectors.join(','), (el) => el.remove());
}

/** Call `fn` on every element matching `selector`, now and as they appear. */
function onEachMatch(
  selector: string,
  fn: (el: HTMLElement) => void,
): MutationObserver | undefined {
  const root = document.documentElement;
  if (!root || !selector) return;

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
  onRetire(() => observer.disconnect());
  sweep(root);
  // <html> is replaced wholesale on some pages; re-attach once the body exists.
  onDomReady(() => {
    if (!isAlive()) return;
    if (document.documentElement !== root) onEachMatch(selector, fn);
    else sweep(document);
  });
  return observer;
}

/**
 * Click each element matching `selector` once, including ones the page adds
 * later. Returns a stop function.
 *
 * Polling, not a MutationObserver — a poll can't miss a node that
 * appears and vanishes between callbacks, and this needs no burst handling.
 */
export function clickOnAppear(selector: string, pollMs = 500) {
  const clicked = new WeakSet<HTMLElement>();
  const timer = setInterval(() => {
    // An orphaned instance must not click alongside its replacement.
    if (!isAlive()) return clearInterval(timer);
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (clicked.has(el)) continue;
      clicked.add(el);
      el.click();
    }
  }, pollMs);
  onRetire(() => clearInterval(timer));
  return () => clearInterval(timer);
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
