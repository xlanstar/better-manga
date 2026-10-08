import type { FeatureContext, FeatureStart } from './types';

/**
 * Run a feature from snapshots of its effective config. Returns `update`, to
 * call with the config whenever it may have changed (`null` = not available):
 * it starts the feature when it turns on, restarts it when its config
 * changes, and aborts the run's signal when it turns off. A shallow-equal
 * config changes nothing (site arrays and functions keep their identity
 * across resolves). Once `lifetime` aborts, the run stops and `update` does
 * nothing.
 */
export function createFeatureRunner<Config extends { enabled: boolean }>(
  start: FeatureStart<Config>,
  lifetime: AbortSignal,
  context: FeatureContext,
): (config: Config | null) => void {
  let current: Config | null = null;
  let run: AbortController | null = null;
  return (config) => {
    if (lifetime.aborted || shallowEqual(config, current)) return;
    current = config;
    run?.abort();
    run = null;
    if (!config?.enabled) return;
    run = new AbortController();
    start(config, AbortSignal.any([lifetime, run.signal]), context);
  };
}

/** Same own keys, with `Object.is` values. */
function shallowEqual(a: object | null, b: object | null): boolean {
  if (!a || !b) return a === b;
  const entries = Object.entries(a);
  return (
    entries.length === Object.keys(b).length &&
    entries.every(
      ([k, v]) => Object.hasOwn(b, k) && Object.is(v, (b as Record<string, unknown>)[k]),
    )
  );
}
