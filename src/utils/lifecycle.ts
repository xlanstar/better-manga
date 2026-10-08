import type { ContentScriptContext } from 'wxt/utils/content-script-context';

/**
 * Lifetime of this content-script instance.
 *
 * After the extension is updated or reloaded, the instance already running in
 * an open tab is orphaned: it keeps its DOM listeners but no longer receives
 * storage changes, so popup settings stop applying. The background re-injects
 * a fresh instance (see `entrypoints/background.ts`); the old one must stand
 * down so the two don't both act on the page.
 *
 * Long-lived work ties its cleanup to `lifetimeSignal()`. It aborts when a
 * newer instance announces itself; nothing tells an orphan that the extension
 * is gone (removed, disabled), so that's checked lazily, by `isAlive()` and on
 * the user input the features act on (`CHECK_EVENTS`), and aborts it too.
 */
let ctx: ContentScriptContext | undefined;

/**
 * Where the features act on user input: Page Up/Down, following a link,
 * coming back to the tab.
 */
const CHECK_EVENTS = ['keydown', 'click', 'auxclick', 'contextmenu', 'visibilitychange'] as const;

/** Stands in for the instance's signal when unbound (tests): never aborts. */
const unboundSignal = new AbortController().signal;

export function bindLifecycle(context: ContentScriptContext) {
  ctx = context;
  // Bound before any feature's window capture listener, so these run first;
  // if the extension is gone, the abort removes the feature's listener for
  // the same event before it's reached.
  const check = () => context.isValid;
  for (const type of CHECK_EVENTS) {
    context.addEventListener(window, type, check, { capture: true, passive: true });
  }
}

/** False once the extension was reloaded or a newer instance took over. */
export function isAlive(): boolean {
  return ctx ? ctx.isValid : true;
}

/** Aborts when this instance is retired. */
export function lifetimeSignal(): AbortSignal {
  return ctx ? ctx.signal : unboundSignal;
}

/**
 * Call `onUrl` with the page's new URL whenever it changes without a load
 * (History API), until this instance is retired. Nothing when unbound.
 */
export function onLocationChange(onUrl: (url: URL) => void) {
  ctx?.addEventListener(window, 'wxt:locationchange', (event) => onUrl(event.newUrl));
}

/**
 * Stand this instance down now, as if a newer one took over:
 * `lifetimeSignal()` aborts and `isAlive()` turns false. Used when the user
 * disables the site; turning it back on takes a reload.
 */
export function retire() {
  ctx?.abort('disabled');
}
