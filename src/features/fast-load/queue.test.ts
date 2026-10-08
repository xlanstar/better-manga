import { describe, expect, test } from 'bun:test';
import { createLoadQueue } from './queue';

/** A `load` whose calls finish when the test says so. */
function controlledLoad() {
  const pending = new Map<string, { resolve: () => void; reject: () => void }>();
  const started: string[] = [];
  const load = (url: string) =>
    new Promise<void>((resolve, reject) => {
      started.push(url);
      pending.set(url, { resolve, reject });
    });
  const settle = async (url: string, ok = true) => {
    const call = pending.get(url)!;
    pending.delete(url);
    if (ok) call.resolve();
    else call.reject();
    // Let the queue's `finally` run.
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  return { load, started, running: () => [...pending.keys()], settle };
}

const isSettled = async (promise: Promise<void>) => {
  let settled = false;
  void promise.then(() => (settled = true));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return settled;
};

describe('createLoadQueue', () => {
  test('runs at most `limit` at a time, in the order added', async () => {
    const { load, started, running, settle } = controlledLoad();
    const queue = createLoadQueue(2, load);
    for (const url of ['a', 'b', 'c', 'd']) queue.add(url);
    expect(running()).toEqual(['a', 'b']);
    await settle('b');
    expect(running()).toEqual(['a', 'c']);
    await settle('a');
    expect(started).toEqual(['a', 'b', 'c', 'd']);
  });

  test('loads each URL once', async () => {
    const { load, started, settle } = controlledLoad();
    const queue = createLoadQueue(2, load);
    queue.add('a');
    queue.add('a');
    await settle('a');
    queue.add('a');
    expect(started).toEqual(['a']);
  });

  test('a failed load counts as finished', async () => {
    const { load, running, settle } = controlledLoad();
    const queue = createLoadQueue(1, load);
    queue.add('a');
    queue.add('b');
    await settle('a', false);
    expect(running()).toEqual(['b']);
  });

  test('idle waits for something to be added, then for all of it', async () => {
    const { load, settle } = controlledLoad();
    const queue = createLoadQueue(2, load);
    expect(await isSettled(queue.idle)).toBe(false);
    queue.add('a');
    queue.add('b');
    await settle('a');
    expect(await isSettled(queue.idle)).toBe(false);
    await settle('b');
    expect(await isSettled(queue.idle)).toBe(true);
  });

  test('stop starts nothing more, and idle never resolves', async () => {
    const { load, started, settle } = controlledLoad();
    const queue = createLoadQueue(1, load);
    queue.add('a');
    queue.add('b');
    queue.stop();
    await settle('a');
    queue.add('c');
    expect(started).toEqual(['a']);
    expect(await isSettled(queue.idle)).toBe(false);
  });
});
