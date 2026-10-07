# better-manga

Browser extension (Chrome MV3 + Firefox): WXT + React + TypeScript, bun.
Source in `src/` (`@/` alias).

## Done means

`prek run --all-files` passes.

## Code

- Never hand-write `manifest.json`; WXT generates it.
- `src/entrypoints/` holds entry files only; logic goes in `sites/`, `features/`,
  `components/`, `hooks/` or `utils/`.
- A site is `sites/<name>.ts`, registered in `sites/index.ts` and `sites/fixes.ts`.
  Its selectors, quirks and notes stay in that file.
- A feature is `features/<name>/`, registered in `features/index.ts`,
  `starters.ts` and `controls.ts`.
- `utils/` imports nothing from `sites/` or `features/`. The popup and options
  page must not import `sites/fixes.ts` or `features/starters.ts`; the content
  script must not import `features/controls.ts`.
- Expect hundreds of sites: nothing may cost per site at load (read storage in
  one call, render site lists lazily), and no two sites may share a host.
- `components/ui/` is generated coss ui (`bunx shadcn@latest add @coss/<name>`);
  don't hand-edit.
- Merge class names with `cn` from `'cn'`.
- UI text goes in `src/locales/<locale>.yml` (`en` is the default and
  fallback; keep `zh_TW` and `zh_CN` in sync, and `LOCALES` in
  `utils/messages.ts`) and is read with `i18n.t` from `@/utils/i18n` (not
  `'#i18n'`, which ignores the popup's language picker). Site labels are brand
  names and stay in the site file.
- Pure logic gets a `*.test.ts` next to it; pass browser values (`location`, …)
  in as arguments.
- Content scripts: guard every DOM query and fail silently.
- Store state with `browser.storage`, not `localStorage`.
- No new dependency for what a few lines or a browser API can do.
- Add permissions only when needed; prefer `activeTab` / optional permissions.
- No user data leaves the browser without an explicit user action.

## Keep in sync

- `package.json` version (semver): patch for fixes, minor for new sites or
  features, major for breaking changes.
- `docs/manga-sites.md`: sites and domains only; update when `matches` change.
- `PRIVACY.md`: stored data and permissions (sites: it links
  `docs/manga-sites.md`); update its date.
- `store/` (git-ignored): store listing; regenerate screenshots with
  `bun run screenshots`.
