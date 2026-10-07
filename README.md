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

Package a zip for store upload:

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
