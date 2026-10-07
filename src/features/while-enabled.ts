import type { SubscribeConfig } from './types';

/**
 * Run `start` while the feature is enabled: now if it is, again whenever the
 * user turns it back on. Each run gets its own signal, which aborts when the
 * feature is turned off (or the config goes `null`) or `signal` aborts; then
 * `start` must undo its work. `signal` also ends the watching.
 *
 * For features that keep state on the page (a stylesheet, a timer); stateless
 * ones can just check `getConfig()` on use.
 */
export function whileEnabled<Config extends { enabled: boolean }>(
  getConfig: () => Config | null,
  subscribe: SubscribeConfig,
  signal: AbortSignal,
  start: (config: Config, signal: AbortSignal) => void,
): void {
  if (signal.aborted) return;
  let run: AbortController | null = null;
  const sync = () => {
    const config = getConfig();
    if (!config?.enabled) {
      run?.abort();
      run = null;
    } else if (!run) {
      run = new AbortController();
      start(config, AbortSignal.any([signal, run.signal]));
    }
  };
  subscribe(sync, signal);
  sync();
}
