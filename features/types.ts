/**
 * A shared reading feature, configured in three layers (see `utils/settings.ts`).
 *
 * - `SiteConfig`: what a site may declare in `Site.features` (defaults and
 *   adapters such as a scroll container).
 * - `UserConfig`: what the user may store per site.
 * - `Resolved`: the effective settings, `{ ...defaults, ...site, ...user }`,
 *   so every site / user field must exist there too.
 */
export type Feature<
  SiteConfig extends object,
  UserConfig extends object,
  Resolved extends SiteConfig & UserConfig,
> = {
  /** Global defaults, the bottom layer. */
  defaults: Resolved;
  /**
   * Keep only the fields of an untrusted stored object that have the right
   * type and range; the rest falls through to the defaults. Must not set keys
   * to `undefined`, and must be idempotent.
   */
  sanitize: (raw: Record<string, unknown>) => UserConfig;
  /** Type carrier only, never set: lets the registry derive per-layer shapes. */
  types?: { site: SiteConfig; user: UserConfig; resolved: Resolved };
};

/**
 * Content-script side of a feature: install it on the page. `get` returns the
 * current effective settings on every use (`null` until loaded or once this
 * instance is retired), so popup changes apply live. Returns a stop function.
 */
export type FeatureStart<Resolved> = (get: () => Resolved | null) => () => void;
