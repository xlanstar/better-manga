/**
 * Cuts a release:  bun run release <patch|minor|major>
 *
 * On a clean `main` that matches `origin/main`: raises the package.json
 * version, moves CHANGELOG.md's `## Unreleased` entries under it, commits,
 * tags `vX.Y.Z` (the entries are the tag message, which becomes the GitHub
 * release notes) and pushes. The tag starts .github/workflows/release.yml.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { releaseChangelog } from './changelog';
import { bumpVersion, type Bump } from './version';

process.chdir(fileURLToPath(new URL('../..', import.meta.url)));

/** Runs git and returns its trimmed output; throws if it fails. */
const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
/** Runs git with its output (and hook output) shown. */
const gitShown = (...args: string[]) => execFileSync('git', args, { stdio: 'inherit' });

function release(bump: Bump) {
  if (git('branch', '--show-current') !== 'main') throw new Error('Release from main.');
  if (git('status', '--porcelain')) throw new Error('Commit or stash your changes first.');
  git('fetch', '--quiet', 'origin', 'main');
  if (git('rev-parse', 'HEAD') !== git('rev-parse', 'origin/main')) {
    throw new Error('main differs from origin/main; pull or push first.');
  }

  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
  const version = bumpVersion(pkg.version, bump);
  const tag = `v${version}`;
  if (git('tag', '--list', tag)) throw new Error(`Tag ${tag} already exists.`);

  // sv-SE writes dates as YYYY-MM-DD.
  const date = new Date().toLocaleDateString('sv-SE');
  const { changelog, notes } = releaseChangelog(
    readFileSync('CHANGELOG.md', 'utf8'),
    version,
    date,
  );
  writeFileSync('package.json', `${JSON.stringify({ ...pkg, version }, null, 2)}\n`);
  writeFileSync('CHANGELOG.md', changelog);

  try {
    gitShown('commit', '--quiet', '-m', `Release ${tag}`, 'package.json', 'CHANGELOG.md');
  } catch {
    git('restore', 'package.json', 'CHANGELOG.md');
    throw new Error('Commit failed (see the Git hook output); nothing was changed.');
  }
  git('tag', '--annotate', '--cleanup=verbatim', '--message', `${notes}\n`, tag);
  gitShown('push', '--atomic', 'origin', 'main', tag);
  console.log(`✔ Released ${tag}; approve the "chrome-web-store" deployment in GitHub Actions.`);
}

const bump = process.argv[2];
try {
  if (bump !== 'patch' && bump !== 'minor' && bump !== 'major') {
    throw new Error('Usage: bun run release <patch|minor|major>');
  }
  release(bump);
} catch (error) {
  console.error(`✖ ${(error as Error).message}`);
  process.exit(1);
}
