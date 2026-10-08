import { expect, test } from 'bun:test';
import { releaseChangelog } from './changelog';

const CHANGELOG = `# Changelog

## Unreleased

- Add a site
- Fix a bug

## 0.1.0 - 2026-01-01

- First release
`;

test('moves the unreleased entries under the new version', () => {
  expect(releaseChangelog(CHANGELOG, '0.2.0', '2026-02-02')).toEqual({
    notes: '- Add a site\n- Fix a bug',
    changelog: `# Changelog

## Unreleased

## 0.2.0 - 2026-02-02

- Add a site
- Fix a bug

## 0.1.0 - 2026-01-01

- First release
`,
  });
});

test('works when no version was released before', () => {
  const { changelog } = releaseChangelog(
    '# Changelog\n\n## Unreleased\n\n- Add a site\n',
    '0.1.0',
    '2026-01-01',
  );
  expect(changelog).toBe('# Changelog\n\n## Unreleased\n\n## 0.1.0 - 2026-01-01\n\n- Add a site\n');
});

test('refuses an empty or missing unreleased section', () => {
  const { changelog } = releaseChangelog(CHANGELOG, '0.2.0', '2026-02-02');
  expect(() => releaseChangelog(changelog, '0.3.0', '2026-03-03')).toThrow(/empty/);
  expect(() => releaseChangelog('# Changelog\n', '0.1.0', '2026-01-01')).toThrow(/no/);
});
