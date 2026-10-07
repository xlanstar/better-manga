import { describe, expect, mock, test } from 'bun:test';
import { whileEnabled } from './while-enabled';

type Config = { enabled: boolean };

/** A config source with a manual change trigger. */
function source(initial: Config | null) {
  let config = initial;
  const listeners = new Set<() => void>();
  return {
    getConfig: () => config,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next: Config | null) {
      config = next;
      for (const listener of listeners) listener();
    },
    listeners,
  };
}

describe('whileEnabled', () => {
  test('starts right away when enabled', () => {
    const s = source({ enabled: true });
    const start = mock(() => () => {});
    whileEnabled(s.getConfig, s.subscribe, start);
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith({ enabled: true });
  });

  test.each([{ enabled: false }, null])('does not start for %p', (config) => {
    const s = source(config);
    const start = mock(() => () => {});
    whileEnabled(s.getConfig, s.subscribe, start);
    expect(start).not.toHaveBeenCalled();
  });

  test('stops when turned off, starts again when turned back on', () => {
    const s = source({ enabled: true });
    const stopInner = mock(() => {});
    const start = mock(() => stopInner);
    whileEnabled(s.getConfig, s.subscribe, start);
    s.set({ enabled: false });
    expect(stopInner).toHaveBeenCalledTimes(1);
    s.set({ enabled: true });
    expect(start).toHaveBeenCalledTimes(2);
  });

  test('stops when the config goes null', () => {
    const s = source({ enabled: true });
    const stopInner = mock(() => {});
    whileEnabled(s.getConfig, s.subscribe, () => stopInner);
    s.set(null);
    expect(stopInner).toHaveBeenCalledTimes(1);
  });

  test('does not restart on changes that keep it enabled', () => {
    const s = source({ enabled: true });
    const start = mock(() => () => {});
    whileEnabled(s.getConfig, s.subscribe, start);
    s.set({ enabled: true });
    s.set({ enabled: true });
    expect(start).toHaveBeenCalledTimes(1);
  });

  test('does not stop twice on repeated off changes', () => {
    const s = source({ enabled: true });
    const stopInner = mock(() => {});
    whileEnabled(s.getConfig, s.subscribe, () => stopInner);
    s.set({ enabled: false });
    s.set({ enabled: false });
    expect(stopInner).toHaveBeenCalledTimes(1);
  });

  test('the returned stop unsubscribes and stops what runs', () => {
    const s = source({ enabled: true });
    const stopInner = mock(() => {});
    const start = mock(() => stopInner);
    const stop = whileEnabled(s.getConfig, s.subscribe, start);
    stop();
    expect(stopInner).toHaveBeenCalledTimes(1);
    expect(s.listeners.size).toBe(0);
    s.set({ enabled: false });
    s.set({ enabled: true });
    expect(start).toHaveBeenCalledTimes(1);
    expect(stopInner).toHaveBeenCalledTimes(1);
  });
});
