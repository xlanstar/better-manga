/** Shared DOM helpers for features. Content scripts run at document_start. */

import { isAlive, onRetire } from './lifecycle';

/**
 * Hide every element matching `selectors`, now and later, with a stylesheet:
 * no work per mutation, and matches never render. Returns a stop function
 * (which un-hides them, unless a page CSP forced the inline-style fallback).
 */
export function keepHidden(...selectors: string[]): () => void {
  const style = document.createElement('style');
  style.setAttribute('data-better-manga', 'keep-hidden');
  // `textContent` (not a text node) keeps Firefox from applying the page's CSP.
  style.textContent = hideRules(selectors);

  let stopFallback: (() => void) | undefined;
  const stop = () => {
    observer.disconnect(); // first, or it would re-attach the style
    style.remove();
    stopFallback?.();
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
      stopFallback = onEachMatch(selectors.join(','), hideElement);
    }
  };

  const observer = new MutationObserver(() => {
    if (isAlive()) attachStyle();
  });
  onRetire(stop);
  // In case there's no <html> yet.
  observer.observe(document, { childList: true });
  attachStyle();
  return stop;
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
 * Returns a stop function.
 */
export function keepRemoved(...selectors: string[]): () => void {
  return onEachMatch(selectors.join(','), (el) => el.remove());
}

/**
 * Call `fn` on every element matching `selector`, now and as they appear.
 * Returns a stop function.
 */
function onEachMatch(selector: string, fn: (el: HTMLElement) => void): () => void {
  const root = document.documentElement;
  if (!root || !selector) return () => {};

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
  let stopped = false;
  let stopReplacement: (() => void) | undefined;
  const stop = () => {
    stopped = true;
    observer.disconnect();
    stopReplacement?.();
  };
  onRetire(stop);
  sweep(root);
  // <html> is replaced wholesale on some pages; re-attach once the body exists.
  onDomReady(() => {
    if (stopped || !isAlive()) return;
    if (document.documentElement !== root) stopReplacement = onEachMatch(selector, fn);
    else sweep(document);
  });
  return stop;
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
