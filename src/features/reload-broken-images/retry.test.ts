import { describe, expect, test } from 'bun:test';
import { addFailure, retryDelay } from './retry';

const URL_A = 'https://img.test/1.webp';
const URL_B = 'https://img.test/2.webp';

describe('addFailure', () => {
  test('the first failure counts 1', () => {
    expect(addFailure(undefined, URL_A)).toEqual({ url: URL_A, count: 1 });
  });

  test('another failure of the same URL adds 1', () => {
    expect(addFailure({ url: URL_A, count: 2 }, URL_A)).toEqual({ url: URL_A, count: 3 });
  });

  test('a new URL starts over', () => {
    expect(addFailure({ url: URL_A, count: 3 }, URL_B)).toEqual({ url: URL_B, count: 1 });
  });
});

describe('retryDelay', () => {
  test('waits 1 s, then twice as long each time', () => {
    expect([1, 2, 3].map(retryDelay)).toEqual([1000, 2000, 4000]);
  });

  test('gives up after 3 retries', () => {
    expect(retryDelay(4)).toBeNull();
    expect(retryDelay(10)).toBeNull();
  });
});
