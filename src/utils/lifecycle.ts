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
 * Helpers use `isAlive()` for a lazy check (it also notices the extension being
 * gone) and `onRetire()` for eager cleanup when a newer instance announces
 * itself.
 */
let ctx: ContentScriptContext | undefined;

export function bindLifecycle(context: ContentScriptContext) {
  ctx = context;
}

/** False once the extension was reloaded or a newer instance took over. */
export function isAlive(): boolean {
  return ctx ? ctx.isValid : true;
}

/**
 * Stand this instance down now, as if a newer one took over: every `onRetire`
 * cleanup runs and `isAlive()` turns false. Used when the user disables the
 * site; turning it back on takes a reload.
 */
export function retire() {
  ctx?.abort('disabled');
}

/** Run `fn` when this instance is retired. */
export function onRetire(fn: () => void) {
  ctx?.onInvalidated(fn);
}
