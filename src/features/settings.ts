/**
 * Reading features: implemented once, configured in three layers.
 *
 *   global default  →  site default (`Site.features`)  →  user setting (per site)
 *
 * Later layers override earlier ones; `undefined` falls through. Site fixes
 * (ad hiding, anti-hijack, …) are not features — they live in each site's
 * `run()` and are not user-tunable.
 *
 * Each feature is one folder in `features/` (defaults, per-layer types, user
 * value sanitizing, content-script start, popup controls). This file only loops over the
 * registry, so adding a feature means:
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

/** Site layer (`Site.features`). `false` = the feature does not apply to this site. */
export type SiteFeatures = { [K in FeatureId]?: false | FeatureSiteConfig<K> };

/** User layer, stored per site. Missing fields fall through. */
export type UserSettings = { [K in FeatureId]?: FeatureUserConfig<K> };

/** Effective settings. `null` = not available on this site. */
export type ResolvedFeatures = { [K in FeatureId]: FeatureResolvedConfig<K> | null };

// ── Layering ─────────────────────────────────────────────────────────────────

export function resolveFeatures(
  siteFeatures: SiteFeatures | undefined,
  userSettings: UserSettings | null | undefined,
): ResolvedFeatures {
  const user = sanitizeUserSettings(userSettings);
  const resolved: Record<string, object | null> = {};
  for (const id of featureIds) {
    const site = siteFeatures?.[id];
    resolved[id] =
      site === false
        ? null
        : { ...features[id].defaults, ...withoutUndefined(site ?? {}), ...user[id] };
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
 * Drop user values equal to the defaults for this site, so a stored setting
 * always means "differs from default". Returns `{}` when nothing differs.
 */
export function pruneUserSettings(
  siteFeatures: SiteFeatures | undefined,
  userSettings: UserSettings,
): UserSettings {
  const defaults = resolveFeatures(siteFeatures, {});
  const pruned: Record<string, object> = {};
  for (const [id, config] of Object.entries(sanitizeUserSettings(userSettings))) {
    const base = defaults[id as FeatureId] as Record<string, unknown> | null;
    if (!base) continue;
    const changed = Object.entries(config).filter(([k, v]) => v !== undefined && v !== base[k]);
    if (changed.length) pruned[id] = Object.fromEntries(changed);
  }
  return pruned as UserSettings;
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
