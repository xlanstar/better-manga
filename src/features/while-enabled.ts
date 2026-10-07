import type { SubscribeConfig } from './types';

/**
 * Run `start` while the feature is enabled: now if it is, again whenever the
 * user turns it back on, and its stop function whenever it is turned off (or
 * the config goes `null`). Returns a stop function for the whole thing.
 *
 * For features that keep state on the page (a stylesheet, a timer); stateless
 * ones can just check `getConfig()` on use.
 */
export function whileEnabled<Config extends { enabled: boolean }>(
  getConfig: () => Config | null,
  subscribe: SubscribeConfig,
  start: (config: Config) => () => void,
): () => void {
  let stop: (() => void) | null = null;
  const sync = () => {
    const config = getConfig();
    if (config?.enabled) {
      stop ??= start(config);
    } else if (stop) {
      stop();
      stop = null;
    }
  };
  const unsubscribe = subscribe(sync);
  sync();
  return () => {
    unsubscribe();
    stop?.();
    stop = null;
  };
}
