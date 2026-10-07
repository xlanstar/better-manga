# better-manga

A browser extension (Chrome MV3 + Firefox) that enhances manga reading sites.

## Stack

WXT + React 19 + TypeScript, bun. Entrypoints live in `entrypoints/`; WXT
generates the manifest — never hand-write `manifest.json`.

Popup UI uses Tailwind CSS v4 and [coss ui](https://coss.com/ui) (Base UI
components in `components/ui/`, theme in `entrypoints/popup/style.css`).
Add components with `npx shadcn@latest add @coss/<name>`.

- `bun run dev` / `bun run dev:firefox` — dev with HMR
- `bun run build` / `bun run zip` — production output in `.output/`
- `bun run compile` — typecheck (`tsc --noEmit`)
- `bun run fmt` / `bun run fmt:check` — format with oxfmt (`.oxfmtrc.json`)
- `bun run lint` / `bun run lint:fix` — lint with oxlint (`.oxlintrc.json`)

Git hooks are managed by [prek](https://prek.j178.dev) via `prek.toml`
(run `prek install` once per clone; `prek run --all-files` to check everything).

## Docs

- `docs/manga-sites.md` — manga sites and domains only; update it whenever a site's `matches` change.
  Site technical details go in comments in `entrypoints/content/sites/<name>.ts`.

## Versioning

Follow semver in `package.json` — that version becomes the extension version.
Patch for fixes, minor for new site support or features, major for breaking changes.

## Rules

- Typecheck, `bun run fmt:check`, and `bun run lint` must pass before anything
  is called done.
- Add permissions to `wxt.config.ts` only when a feature actually needs them.
  Prefer `activeTab` and optional permissions over broad host permissions.
- No new dependency for what a few lines of code or a browser API can do.
- Content scripts run on third-party pages: never assume DOM structure exists,
  guard every query, and fail silently rather than break the host page.
- Site-specific selectors and quirks belong in one place, not scattered across
  content scripts.
- Store state with `browser.storage`, not `localStorage`.
- No user data leaves the browser without an explicit user action.
- Keep `PRIVACY.md` in sync with what the extension stores, sends, and runs on
  (sites, permissions, data); update its date when you change it.
- Keep `store/` (Chrome Web Store listing, git-ignored) in sync with features,
  supported sites, permissions, and UI. Regenerate screenshots with
  `bun run screenshots` (details in `scripts/screenshots/capture.ts`).
