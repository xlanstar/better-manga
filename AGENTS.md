# better-manga

Browser extension (Chrome MV3 + Firefox): WXT + React + TypeScript, bun.
Source in `src/` (`@/` alias).

## Done means

`prek run --all-files` passes.

## Code

- Never hand-write `manifest.json`; WXT generates it.
- `src/entrypoints/` holds entry files only; logic goes in `sites/`, `features/`,
  `components/`, `hooks/` or `utils/`.
- A site is `sites/<name>.ts`, registered in `sites/index.ts`. Its selectors,
  quirks and notes stay in that file, as config for features (`Site.features`).
- Site behaviour (ad blocking, auto-clicks, link rewrites, …) is a feature,
  so users can toggle it; one only some sites need is `siteSpecific`.
- Where a site's main site and reader need different config (selectors, URL
  rules), put it in `Site.sections`, not a second site or a feature branch.
- A feature is `features/<name>/`, registered in `features/index.ts`,
  `starters.ts` and `controls.ts`.
- `utils/` imports nothing from `sites/` or `features/`. The popup and options
  page must not import `features/starters.ts`; the content script must not
  import `features/controls.ts`.
- Expect hundreds of sites: nothing may cost per site at load (read storage in
  one call, render site lists lazily), and no two sites may share a host.
- `components/ui/` is generated coss ui (`bunx shadcn@latest add @coss/<name>`);
  don't hand-edit.
- Auto-imports are off (`imports: false`): import everything explicitly,
  WXT APIs from their real paths (`wxt/browser`, `wxt/utils/storage`,
  `wxt/utils/define-*`), not `#imports`, so `bun test` can resolve them.
- Merge class names with `cn` from `'cn'`.
- Icons come from `lucide-react`.
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
- Oldest supported browsers: Chrome 119, Firefox 128 (`MIN_*_VERSION` in
  `wxt.config.ts`, with the API that sets each). Anything newer needs a
  feature check, or a raised minimum noted there.
- Add permissions only when needed; prefer `activeTab` / optional permissions.
- No user data leaves the browser without an explicit user action.

## Features

One folder per feature in `src/features/<id>/`. Site-specific features run
only on sites that configure them; the others run on every site.

- `blockAds` (site-specific): hides ad slots and removes nodes ad scripts
  depend on. Site: `hide`, `remove`.
- `skipRedirects` (site-specific): sends links that go through redirect pages
  straight to their target. Site: `rewriteLink`.
- `autoContinue` (site-specific): clicks 「點擊繼續閱讀」-style buttons as they
  appear. Site: `selector`.
- `fastLoad` (site-specific): gets chapter images on screen sooner. Site:
  `origins`, `images`, `nextChapter`; user: `connect` (connect to the image
  hosts early), `preloadImages` with `parallel` (download the chapter's
  images several at a time), `preloadNext` (preload the next chapter in a
  hidden frame).
- `pageDistance`: Page Up/Down scrolls a set share of the screen. Site:
  `container`; user: `ratio`.
- `smoothScroll`: animates Page Up/Down. Site: `container`; user: `duration`,
  `holdSpeed`.

## Design

- Gaps are multiples of 8px: `gap-2`, `gap-4`, `gap-6`, … (likewise
  `gap-x-*`, `gap-y-*`, `space-*`, margins between sibling blocks, and
  plain CSS). `gap-2` inside a group (icon + label, label + badge, a toggle
  and its options), `gap-4` between groups and between a label and its
  control. Stacked text lines (title + subtitle) take no gap.
- `components/ui/` is exempt (generated).

## Keep in sync

- `CHANGELOG.md`: add each user-visible change (site, feature, fix) under
  `## Unreleased`, in the user's terms; skip refactors and internal changes.
- `package.json` version (semver): don't edit it by hand. `bun run release
  <patch|minor|major>` raises it: patch for fixes, minor for new sites or
  features, major for breaking changes.
- `docs/manga-sites.md`: sites and domains only; update when `matches` change.
- `PRIVACY.md`: stored data and permissions (sites: it links
  `docs/manga-sites.md`); update its date.
- `store/` (git-ignored): store listing; regenerate screenshots with
  `bun run screenshots`.
- Site lists: adding or changing a site or its features, update every list
  (`rg` an existing site's label and hosts): `docs/manga-sites.md`,
  `store/chrome-web-store.md` (description, host permissions),
  `scripts/screenshots/layout.html`.
- Store material (`store/`, `scripts/screenshots/`) never names R18 sites.
