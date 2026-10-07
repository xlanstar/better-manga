/**
 * A feature, configured in layers (see `settings.ts`).
 *
 * - `SiteConfig`: what a site may declare in `Site.features` (defaults and
 *   adapters such as a scroll container or ad selectors).
 * - `UserConfig`: what the user may store, globally or per site.
 * - `ResolvedConfig`: the effective settings, `{ ...defaults, ...site, ...user }`,
 *   so every site / user field must exist there too.
 */
export type Feature<
  SiteConfig extends object,
  UserConfig extends object,
  ResolvedConfig extends SiteConfig & UserConfig,
> = {
  /** Global defaults, the bottom layer. */
  defaults: ResolvedConfig;
  /**
   * Keep only the fields of an untrusted stored object that have the right
   * type and range; the rest falls through to the defaults. Must not set keys
   * to `undefined`, and must be idempotent.
   */
  sanitize: (raw: Record<string, unknown>) => UserConfig;
  /**
   * Only applies to sites that configure it in `Site.features` (it needs their
   * selectors, URL rules, …). The global settings still list it, so the user
   * can turn it off on every site at once.
   */
  siteSpecific?: boolean;
  /** Type carrier only, never set: lets the registry derive per-layer shapes. */
  types?: { site: SiteConfig; user: UserConfig; resolved: ResolvedConfig };
};

/** Call `listener` after the effective settings change. Returns unsubscribe. */
export type SubscribeConfig = (listener: () => void) => () => void;

/**
 * Content-script side of a feature: install it on the page, synchronously at
 * document_start (wrap DOM work in `onDomReady()` from `utils/dom` if needed).
 * `getConfig` returns the current effective settings on every use — the site's
 * defaults until the user settings load, `null` once this instance is retired
 * — so popup changes apply live; `subscribe` tells when they change, for
 * features that keep state (a stylesheet, a timer). Returns a stop function.
 */
export type FeatureStart<ResolvedConfig> = (
  getConfig: () => ResolvedConfig | null,
  subscribe: SubscribeConfig,
) => () => void;

/** Props of a feature's popup / options controls (see `features/controls.ts`). */
export type FeatureControlsProps<UserConfig, ResolvedConfig> = {
  /** Effective settings. */
  value: ResolvedConfig;
  /** What `value` would be without the layer being edited. */
  defaults: ResolvedConfig;
  /**
   * Merged into the user layer. `persist: false` updates the UI only (e.g.
   * while dragging a slider).
   */
  onChange: (patch: UserConfig, persist: boolean) => void;
};
