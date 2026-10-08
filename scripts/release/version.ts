export type Bump = 'patch' | 'minor' | 'major';

/**
 * Raises a plain `x.y.z` version. No pre-release suffixes: Chrome's manifest
 * version is digits and dots only, so the store would see a duplicate.
 */
export function bumpVersion(version: string, bump: Bump): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Not a plain x.y.z version: ${version}`);
  const [major = 0, minor = 0, patch = 0] = match.slice(1).map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
