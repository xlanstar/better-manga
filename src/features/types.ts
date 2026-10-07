/**
 * A feature, configured in layers (see `settings.ts`). Every feature has an
 * `enabled` user setting, handled by the framework: sanitized in
 * `settings.ts`, applied by `runner.ts`, switched in the popup.
 *
 * - `SiteConfig`: what a site may declare in `Site.features` (defaults and
 *   adapters such as a scroll container or ad selectors).
 * - `ResolvedConfig`: the effective settings, `{ ...defaults, ...site, ...user }`,
 *   so every site / option field must exist there too.
 * - `Options`: the user settings besides `enabled`, if any (e.g. a ratio).
 *   The user may store them and `enabled`, globally or per site.
 */
export type Feature<
  SiteConfig extends object,
  ResolvedConfig extends SiteConfig & Options & { enabled: boolean },
  Options extends object = Record<never, never>,
> = {
  /** Global defaults, the bottom layer. */
  defaults: ResolvedConfig;
  /**
   * Keep only the options of an untrusted stored object that have the right
   * type and range; the rest falls through to the defaults. Leaves `enabled`
   * to the framework. Must not set keys to `undefined`, and must be
   * idempotent.
   */
  sanitizeOptions?: (raw: Record<string, unknown>) => Options;
  /**
   * Only applies to sites that configure it in `Site.features` (it needs their
   * selectors, URL rules, …). The global settings still list it, so the user
   * can turn it off on every site at once. Such a feature must define
   * `isUsable`.
   */
  siteSpecific?: boolean;
  /**
   * Whether a site config (one layer of it) gives the feature something to
   * act on, e.g. a selector. Tests check it against every registered site.
   */
  isUsable?: (config: SiteConfig) => boolean;
  /** Type carrier only, never set: lets the registry derive per-layer shapes. */
  types?: { site: SiteConfig; options: Options; resolved: ResolvedConfig };
};

/**
 * Content-script side of a feature: install it on the page with `config`,
 * synchronously at document_start (wrap DOM work in `onDomReady()` from
 * `utils/dom` if needed), and undo it when `signal` aborts.
 *
 * Called when the feature turns on, and again whenever its effective config
 * changes (the site's defaults until the user settings load). `signal` aborts
 * when it turns off, before such a restart, or when this content-script
 * instance retires.
 */
export type FeatureStart<ResolvedConfig> = (config: ResolvedConfig, signal: AbortSignal) => void;

/**
 * Props of a feature's options controls, shown below its on/off switch (see
 * `features/controls.ts`).
 */
export type FeatureOptionsProps<Options, ResolvedConfig> = {
  /** Effective settings. */
  value: ResolvedConfig;
  /** What `value` would be without the layer being edited. */
  defaults: ResolvedConfig;
  /**
   * Merged into the user layer. `persist: false` updates the UI only (e.g.
   * while dragging a slider).
   */
  onChange: (patch: Options, persist: boolean) => void;
};
