import { describe, expect, mock, test } from 'bun:test';
import { createFeatureRunner } from './runner';
import type { FeatureContext } from './types';

type Config = { enabled: boolean; ratio?: number; hide?: string[] };

const context: FeatureContext = { siteName: 'example' };

/** A `start` that records each run's config and signal and counts aborts. */
function recorder() {
  const signals: AbortSignal[] = [];
  const onAbort = mock(() => {});
  const start = mock((_config: Config, signal: AbortSignal, _context: FeatureContext) => {
    signals.push(signal);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  return { start, signals, onAbort };
}

/** A runner on a fresh lifetime, with its recorder. */
function setup() {
  const r = recorder();
  const lifetime = new AbortController();
  const update = createFeatureRunner(r.start, lifetime.signal, context);
  return { ...r, lifetime, update };
}

describe('createFeatureRunner', () => {
  test('starts when enabled, with the config and context', () => {
    const { start, signals, update } = setup();
    update({ enabled: true, ratio: 0.5 });
    expect(start).toHaveBeenCalledTimes(1);
    expect(start.mock.calls[0]?.[0]).toEqual({ enabled: true, ratio: 0.5 });
    expect(start.mock.calls[0]?.[2]).toBe(context);
    expect(signals[0]?.aborted).toBe(false);
  });

  test.each([{ enabled: false }, null])('does not start for %p', (config) => {
    const { start, update } = setup();
    update(config);
    expect(start).not.toHaveBeenCalled();
  });

  test('stops when turned off, starts again when turned back on', () => {
    const { start, signals, update } = setup();
    update({ enabled: true });
    update({ enabled: false });
    expect(signals[0]?.aborted).toBe(true);
    update({ enabled: true });
    expect(start).toHaveBeenCalledTimes(2);
    expect(signals[1]?.aborted).toBe(false);
  });

  test('stops when the config goes null', () => {
    const { signals, update } = setup();
    update({ enabled: true });
    update(null);
    expect(signals[0]?.aborted).toBe(true);
  });

  test('restarts with the new config when it changes', () => {
    const { start, signals, onAbort, update } = setup();
    update({ enabled: true, ratio: 0.5 });
    update({ enabled: true, ratio: 0.7 });
    expect(signals[0]?.aborted).toBe(true);
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(2);
    expect(start.mock.calls[1]?.[0]).toEqual({ enabled: true, ratio: 0.7 });
    expect(signals[1]?.aborted).toBe(false);
  });

  test('restarts when a key is added or removed', () => {
    const { start, update } = setup();
    update({ enabled: true });
    update({ enabled: true, ratio: 0.5 });
    update({ enabled: true });
    expect(start).toHaveBeenCalledTimes(3);
  });

  test('does not restart on a shallow-equal config', () => {
    const { start, onAbort, update } = setup();
    const hide = ['.ad'];
    update({ enabled: true, hide });
    update({ enabled: true, hide });
    update({ hide, enabled: true });
    expect(start).toHaveBeenCalledTimes(1);
    expect(onAbort).not.toHaveBeenCalled();
  });

  test('compares values by identity, not deeply', () => {
    const { start, update } = setup();
    update({ enabled: true, hide: ['.ad'] });
    update({ enabled: true, hide: ['.ad'] });
    expect(start).toHaveBeenCalledTimes(2);
  });

  test('does not stop twice on repeated off changes', () => {
    const { onAbort, update } = setup();
    update({ enabled: true });
    update({ enabled: false });
    update({ enabled: false, ratio: 0.5 });
    update(null);
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  test('aborting the lifetime stops what runs, and later updates', () => {
    const { start, signals, onAbort, lifetime, update } = setup();
    update({ enabled: true });
    lifetime.abort();
    expect(signals[0]?.aborted).toBe(true);
    update({ enabled: false });
    update({ enabled: true, ratio: 0.5 });
    expect(start).toHaveBeenCalledTimes(1);
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  test('does nothing once the lifetime has aborted', () => {
    const r = recorder();
    const update = createFeatureRunner(r.start, AbortSignal.abort(), context);
    update({ enabled: true });
    expect(r.start).not.toHaveBeenCalled();
  });
});
