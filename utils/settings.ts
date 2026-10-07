/**
 * Reading features: implemented once, configured in three layers.
 *
 *   global default  →  site default (`Site.features`)  →  user setting (per site)
 *
 * Later layers override earlier ones; `undefined` falls through. Site fixes
 * (ad hiding, anti-hijack, …) are not features — they live in each site's
 * `run()` and are not user-tunable.
 *
 * Each feature is one module in `features/` (defaults, per-layer types, user
 * value sanitizing, content-script start). This file only loops over the
 * registry, so adding a feature means:
 *
 * 1. `features/<name>.ts`: export a `Feature` definition and a `FeatureStart`.
 * 2. Register them in `features/index.ts` and `features/runtime.ts`.
 * 3. Add its controls in `entrypoints/popup/features/` and register them there.
 *
 * Steps 2–3 are typed over `FeatureId`, so a missing entry is a compile error.
 */
import {
  featureIds,
  features,
  type FeatureId,
  type FeatureResolved,
  type FeatureSiteConfig,
  type FeatureUserConfig,
} from '@/features';

// ── Shapes per layer ─────────────────────────────────────────────────────────

/** Site defaults. `false` = the feature does not apply to this site at all. */
export type SiteFeatures = { [K in FeatureId]?: false | FeatureSiteConfig<K> };

/** What the user stored for one site. Missing fields fall through. */
export type UserSiteSettings = { [K in FeatureId]?: FeatureUserConfig<K> };

/** Effective settings. `null` = not available on this site. */
export type ResolvedFeatures = { [K in FeatureId]: FeatureResolved<K> | null };

export function resolveFeatures(
  site: SiteFeatures | undefined,
  user: UserSiteSettings | null | undefined,
): ResolvedFeatures {
  const clean = sanitizeUserSettings(user);
  const out: Record<string, object | null> = {};
  for (const id of featureIds) {
    const siteConfig = site?.[id];
    out[id] =
      siteConfig === false
        ? null
        : { ...features[id].defaults, ...stripUndefined(siteConfig ?? {}), ...clean[id] };
  }
  return out as ResolvedFeatures;
}

/**
 * Coerce an untrusted user layer into `UserSiteSettings`. Stored values may be
 * corrupt or written by an older version, so keep only fields of the right type
 * and range; everything else falls through to the defaults. Idempotent.
 */
export function sanitizeUserSettings(raw: unknown): UserSiteSettings {
  if (!isObject(raw)) return {};
  const out: Record<string, object> = {};
  for (const id of featureIds) {
    const value = raw[id];
    if (!isObject(value)) continue;
    const clean = features[id].sanitize(value);
    if (Object.keys(clean).length) out[id] = clean;
  }
  return out as UserSiteSettings;
}

// ── Storage (user layer) ─────────────────────────────────────────────────────

const key = (site: string) => `local:site:${site}` as const;

export async function loadUserSettings(site: string): Promise<UserSiteSettings> {
  return sanitizeUserSettings(await storage.getItem(key(site)));
}

export function saveUserSettings(site: string, settings: UserSiteSettings) {
  return storage.setItem(key(site), settings);
}

export function resetUserSettings(site: string) {
  return storage.removeItem(key(site));
}

/** Call `cb` whenever the user changes this site's settings. Returns unwatch. */
export function watchUserSettings(site: string, cb: (settings: UserSiteSettings) => void) {
  return storage.watch<unknown>(key(site), (value) => cb(sanitizeUserSettings(value)));
}

/**
 * Drop user values equal to the defaults for this site, so a stored setting
 * always means "differs from default". Returns `{}` when nothing differs.
 */
export function pruneUserSettings(
  site: SiteFeatures | undefined,
  user: UserSiteSettings,
): UserSiteSettings {
  const defaults = resolveFeatures(site, {});
  const out: Record<string, object> = {};
  for (const [name, values] of Object.entries(sanitizeUserSettings(user))) {
    const base = defaults[name as FeatureId] as Record<string, unknown> | null;
    if (!base || !values) continue;
    const kept = Object.entries(values).filter(([k, v]) => v !== undefined && v !== base[k]);
    if (kept.length) out[name] = Object.fromEntries(kept);
  }
  return out as UserSiteSettings;
}

export function isCustomised(user: UserSiteSettings): boolean {
  return Object.keys(user).length > 0;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
