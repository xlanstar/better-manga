/**
 * Features: implemented once, configured in layers.
 *
 *   feature default  →  site default (`Site.features`)
 *     →  user, all sites (global)  →  user, this site (override)
 *
 * Later layers override earlier ones; `undefined` falls through. The user
 * layers share one shape (`UserSettings`); a site override only stores what
 * differs from the layers below, so everything else follows the global ones.
 *
 * A feature applies to every site unless the site sets it to `false`; a
 * `siteSpecific` one (ad blocking, …) only to sites that configure it.
 * Anything a site needs beyond the shared reading features (ad selectors,
 * anti-hijack rules, …) is a site-specific feature too, so the user can turn
 * it off.
 *
 * Each feature is one folder in `features/` (defaults, per-layer types, user
 * value sanitizing, content-script start, popup / options controls). This
 * file only loops over the registry, so adding a feature means:
 *
 * 1. `features/<name>/`: `index.ts` exports a `Feature` definition, `start.ts`
 *    a `FeatureStart`, `controls.tsx` the popup controls (see `page-scroll/`).
 * 2. Register them in `features/index.ts`, `starters.ts` and `controls.ts`.
 *
 * Step 2 is typed over `FeatureId`, so a missing entry is a compile error.
 *
 * Everything here is pure; reading and writing the user layer lives in
 * `settings-storage.ts`.
 */
import {
  featureIds,
  features,
  type FeatureId,
  type FeatureResolvedConfig,
  type FeatureSiteConfig,
  type FeatureUserConfig,
} from './index';

// ── Shapes per layer, keyed by feature id ────────────────────────────────────

/**
 * Site layer (`Site.features`). `false` = the feature does not apply to this
 * site; a `siteSpecific` feature applies only when it has an entry here.
 */
export type SiteFeatures = { [K in FeatureId]?: false | FeatureSiteConfig<K> };

/** A user layer (global or per site). Missing fields fall through. */
export type UserSettings = { [K in FeatureId]?: FeatureUserConfig<K> };

/** Effective settings. `null` = not available on this site. */
export type ResolvedFeatures = { [K in FeatureId]: FeatureResolvedConfig<K> | null };

// ── Layering ─────────────────────────────────────────────────────────────────

/** User layers, bottom first (global, then the site override). */
type UserLayers = readonly (UserSettings | null | undefined)[];

/**
 * Effective settings for a site (`siteFeatures`, i.e. `Site.features`) under
 * the user layers. `undefined` = no particular site (the global settings):
 * every feature is available there, with its defaults.
 */
export function resolveFeatures(
  siteFeatures: SiteFeatures | undefined,
  ...userLayers: UserLayers
): ResolvedFeatures {
  const users = userLayers.map(sanitizeUserSettings);
  const resolved: Record<string, object | null> = {};
  for (const id of featureIds) {
    const site = siteFeatures?.[id];
    const unavailable =
      site === false || (siteFeatures !== undefined && features[id].siteSpecific && !site);
    resolved[id] = unavailable
      ? null
      : Object.assign(
          { ...features[id].defaults, ...withoutUndefined(site || {}) },
          ...users.map((user) => user[id]),
        );
  }
  return resolved as ResolvedFeatures;
}

/**
 * Coerce an untrusted user layer into `UserSettings`. Stored values may be
 * corrupt or written by an older version, so keep only fields of the right type
 * and range; everything else falls through to the defaults. Idempotent.
 */
export function sanitizeUserSettings(raw: unknown): UserSettings {
  if (!isPlainObject(raw)) return {};
  const clean: Record<string, object> = {};
  for (const id of featureIds) {
    const value = raw[id];
    if (!isPlainObject(value)) continue;
    const config = features[id].sanitize(value);
    if (Object.keys(config).length) clean[id] = config;
  }
  return clean as UserSettings;
}

/**
 * Drop values of the top user layer equal to what the layers below
 * (`beneath`, bottom first) already give for this site, so a stored setting
 * always means "differs from what it would inherit". Returns `{}` when nothing
 * differs.
 */
export function pruneUserSettings(
  siteFeatures: SiteFeatures | undefined,
  userSettings: UserSettings,
  ...beneath: UserLayers
): UserSettings {
  const defaults = resolveFeatures(siteFeatures, ...beneath);
  const pruned: Record<string, object> = {};
  for (const [id, config] of Object.entries(sanitizeUserSettings(userSettings))) {
    const base = defaults[id as FeatureId] as Record<string, unknown> | null;
    if (!base) continue;
    const changed = Object.entries(config).filter(([k, v]) => v !== undefined && v !== base[k]);
    if (changed.length) pruned[id] = Object.fromEntries(changed);
  }
  return pruned as UserSettings;
}

/** Coerce an untrusted stored list of site names: unique non-empty strings. */
export function sanitizeSiteNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((name): name is string => typeof name === 'string' && !!name))];
}

/** Whether a (pruned) user layer changes anything. */
export function isCustomised(userSettings: UserSettings): boolean {
  return Object.keys(userSettings).length > 0;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function withoutUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
