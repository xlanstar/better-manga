import { expect, test } from 'bun:test';
import { bumpVersion } from './version';

test('raises the given part and resets the lower ones', () => {
  expect(bumpVersion('0.12.1', 'patch')).toBe('0.12.2');
  expect(bumpVersion('0.12.1', 'minor')).toBe('0.13.0');
  expect(bumpVersion('0.12.1', 'major')).toBe('1.0.0');
});

test('rejects versions that are not plain x.y.z', () => {
  expect(() => bumpVersion('1.0.0-beta.1', 'patch')).toThrow();
  expect(() => bumpVersion('1.0', 'patch')).toThrow();
});
