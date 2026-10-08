# better-manga

A browser extension (Chrome MV3 + Firefox) that enhances manga reading sites.

## Setup

Install dependencies and the Git hooks (once per clone):

```sh
bun install
prek install
```

## Development

Start a dev browser with the extension loaded and hot reload:

```sh
bun run dev          # Chrome
bun run dev:firefox  # Firefox
```

## Build

Build the production extension into `.output/`:

```sh
bun run build          # Chrome
bun run build:firefox  # Firefox
```

## Release

Published to the Chrome Web Store only.

1. As changes land, list the user-visible ones under `## Unreleased` in
   `CHANGELOG.md`.
2. On a clean, up-to-date `main`, run `bun run release <patch|minor|major>`
   (patch for fixes, minor for new sites or features, major for breaking
   changes). It raises the version, moves the `Unreleased` entries under it,
   commits, tags `vX.Y.Z` and pushes.
3. The tag starts `.github/workflows/release.yml`: CI, then, after you approve
   the `chrome-web-store` deployment in GitHub Actions, the store submission
   and a GitHub release with the zip and the changelog entries.

A version can't be uploaded twice: if the store rejects one, release a new
patch. If the workflow fails, use "Re-run failed jobs".

To check the store credentials, run the Release workflow by hand (a dry run),
or locally, where `wxt submit` reads `.env.submit` (git-ignored; create it
with `bunx wxt submit init`):

```sh
bun run zip && bunx wxt submit --dry-run --chrome-zip .output/*-chrome.zip
```

Package a zip by hand:

```sh
bun run zip          # Chrome
bun run zip:firefox  # Firefox
```

Regenerate the store screenshots:

```sh
bun run screenshots
```

## Checks

Run the unit tests (`*.test.ts`, next to the source):

```sh
bun run test
```

Run all Git hook checks on every file:

```sh
prek run --all-files
```

CI (`.github/workflows/ci.yml`) runs the same checks on every pull request
and push to `main`, then builds both zips and keeps them as workflow
artifacts for 14 days.
