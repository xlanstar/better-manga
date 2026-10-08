export type LoadQueue = {
  /** Queue `url`, unless it was added before. */
  add: (url: string) => void;
  /** Start nothing more; `idle` won't resolve after this. */
  stop: () => void;
  /** Resolves the first time everything added so far has finished. */
  idle: Promise<void>;
};

/**
 * Run `load` on each URL added, in the order added, each URL once, at most
 * `limit` at a time. A `load` that rejects counts as finished.
 */
export function createLoadQueue(limit: number, load: (url: string) => Promise<unknown>): LoadQueue {
  const added = new Set<string>();
  const waiting: string[] = [];
  let running = 0;
  let stopped = false;
  const { promise: idle, resolve: resolveIdle } = Promise.withResolvers<void>();

  const pump = () => {
    if (stopped) return;
    while (running < limit && waiting.length) {
      running++;
      load(waiting.shift()!)
        .catch(() => {})
        .finally(() => {
          running--;
          pump();
        });
    }
    if (!running) resolveIdle();
  };

  return {
    add(url) {
      if (added.has(url)) return;
      added.add(url);
      waiting.push(url);
      pump();
    },
    stop() {
      stopped = true;
      waiting.length = 0;
    },
    idle,
  };
}
