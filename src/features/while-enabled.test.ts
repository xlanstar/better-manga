import { describe, expect, mock, test } from 'bun:test';
import { whileEnabled } from './while-enabled';

type Config = { enabled: boolean };

/** A config source with a manual change trigger. */
function source(initial: Config | null) {
  let config = initial;
  const listeners = new Set<() => void>();
  return {
    getConfig: () => config,
    subscribe: (listener: () => void, signal: AbortSignal) => {
      listeners.add(listener);
      signal.addEventListener('abort', () => listeners.delete(listener), { once: true });
    },
    set(next: Config | null) {
      config = next;
      for (const listener of listeners) listener();
    },
    listeners,
  };
}

/** A `start` that records each run's signal and counts its aborts. */
function recorder() {
  const signals: AbortSignal[] = [];
  const onAbort = mock(() => {});
  const start = mock((_config: Config, signal: AbortSignal) => {
    signals.push(signal);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  return { start, signals, onAbort };
}

describe('whileEnabled', () => {
  test('starts right away when enabled', () => {
    const s = source({ enabled: true });
    const r = recorder();
    whileEnabled(s.getConfig, s.subscribe, new AbortController().signal, r.start);
    expect(r.start).toHaveBeenCalledTimes(1);
    expect(r.start.mock.calls[0]?.[0]).toEqual({ enabled: true });
    expect(r.signals[0]?.aborted).toBe(false);
  });

  test.each([{ enabled: false }, null])('does not start for %p', (config) => {
    const s = source(config);
    const r = recorder();
    whileEnabled(s.getConfig, s.subscribe, new AbortController().signal, r.start);
    expect(r.start).not.toHaveBeenCalled();
  });

  test('stops when turned off, starts again when turned back on', () => {
    const s = source({ enabled: true });
    const r = recorder();
    whileEnabled(s.getConfig, s.subscribe, new AbortController().signal, r.start);
    s.set({ enabled: false });
    expect(r.signals[0]?.aborted).toBe(true);
    s.set({ enabled: true });
    expect(r.start).toHaveBeenCalledTimes(2);
    expect(r.signals[1]?.aborted).toBe(false);
  });

  test('stops when the config goes null', () => {
    const s = source({ enabled: true });
    const r = recorder();
    whileEnabled(s.getConfig, s.subscribe, new AbortController().signal, r.start);
    s.set(null);
    expect(r.signals[0]?.aborted).toBe(true);
  });

  test('does not restart on changes that keep it enabled', () => {
    const s = source({ enabled: true });
    const r = recorder();
    whileEnabled(s.getConfig, s.subscribe, new AbortController().signal, r.start);
    s.set({ enabled: true });
    s.set({ enabled: true });
    expect(r.start).toHaveBeenCalledTimes(1);
    expect(r.onAbort).not.toHaveBeenCalled();
  });

  test('does not stop twice on repeated off changes', () => {
    const s = source({ enabled: true });
    const r = recorder();
    whileEnabled(s.getConfig, s.subscribe, new AbortController().signal, r.start);
    s.set({ enabled: false });
    s.set({ enabled: false });
    expect(r.onAbort).toHaveBeenCalledTimes(1);
  });

  test('aborting the outer signal unsubscribes and stops what runs', () => {
    const s = source({ enabled: true });
    const r = recorder();
    const outer = new AbortController();
    whileEnabled(s.getConfig, s.subscribe, outer.signal, r.start);
    outer.abort();
    expect(r.signals[0]?.aborted).toBe(true);
    expect(s.listeners.size).toBe(0);
    s.set({ enabled: false });
    s.set({ enabled: true });
    expect(r.start).toHaveBeenCalledTimes(1);
    expect(r.onAbort).toHaveBeenCalledTimes(1);
  });

  test('does nothing once the outer signal has aborted', () => {
    const s = source({ enabled: true });
    const r = recorder();
    whileEnabled(s.getConfig, s.subscribe, AbortSignal.abort(), r.start);
    expect(r.start).not.toHaveBeenCalled();
    expect(s.listeners.size).toBe(0);
  });
});
