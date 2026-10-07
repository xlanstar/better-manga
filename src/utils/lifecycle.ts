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
 * Long-lived work ties its cleanup to `lifetimeSignal()`, which aborts when a
 * newer instance announces itself; `isAlive()` is a lazy check that also
 * notices the extension being gone.
 */
let ctx: ContentScriptContext | undefined;

/** Stands in for the instance's signal when unbound (tests): never aborts. */
const unboundSignal = new AbortController().signal;

export function bindLifecycle(context: ContentScriptContext) {
  ctx = context;
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
 * Stand this instance down now, as if a newer one took over:
 * `lifetimeSignal()` aborts and `isAlive()` turns false. Used when the user
 * disables the site; turning it back on takes a reload.
 */
export function retire() {
  ctx?.abort('disabled');
}
