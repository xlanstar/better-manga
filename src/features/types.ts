/**
 * A shared reading feature, configured in three layers (see `settings.ts`).
 *
 * - `SiteConfig`: what a site may declare in `Site.features` (defaults and
 *   adapters such as a scroll container).
 * - `UserConfig`: what the user may store per site.
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
  /** Type carrier only, never set: lets the registry derive per-layer shapes. */
  types?: { site: SiteConfig; user: UserConfig; resolved: ResolvedConfig };
};

/**
 * Content-script side of a feature: install it on the page. `getConfig`
 * returns the current effective settings on every use (`null` until loaded or
 * once this instance is retired), so popup changes apply live. Returns a stop
 * function.
 */
export type FeatureStart<ResolvedConfig> = (getConfig: () => ResolvedConfig | null) => () => void;

/** Props of a feature's popup controls (see `features/controls.ts`). */
export type FeatureControlsProps<UserConfig, ResolvedConfig> = {
  /** Effective settings. */
  value: ResolvedConfig;
  /** What `value` would be without the user layer. */
  defaults: ResolvedConfig;
  /**
   * Merged into the user layer. `persist: false` updates the UI only (e.g.
   * while dragging a slider).
   */
  onChange: (patch: UserConfig, persist: boolean) => void;
};
