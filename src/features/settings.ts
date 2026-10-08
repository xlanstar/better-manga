/**
 * Features: implemented once, configured in layers.
 *
 *   feature default  →  site default (`Site.features`, the page's section on top)
 *     →  user, all sites (global)  →  user, this site (override)
 *
 * Sections (main site, reader; `Site.sections`) only vary the site default;
 * the user layers are per site.
 *
 * Later layers override earlier ones; `undefined` falls through. The user
 * layers share one shape (`UserSettings`); a site override only stores what
 * differs from the layers below, so everything else follows the global ones.
 * The global settings themselves are resolved for `ALL_SITES`, which has no
 * site layer.
 *
 * A feature applies to every site unless the site sets it to `false`; a
 * `siteSpecific` one (ad blocking, …) only to sites that configure it.
 * Anything a site needs beyond the shared reading features (ad selectors,
 * anti-hijack rules, …) is a site-specific feature too, so the user can turn
 * it off.
 *
 * Every feature has an `enabled` user setting, which the framework sanitizes
 * here, applies (`runner.ts` starts and stops the feature) and shows as a
 * switch. Each feature is one folder in `features/` (site config and option
 * types, defaults, sanitizing of its other user options, content-script
 * start, options controls). This file only loops over the registry, so
 * adding a feature means:
 *
 * 1. `features/<name>/`: `index.ts` exports a `Feature` definition, `start.ts`
 *    a `FeatureStart`, and `controls.tsx` its options controls if it has user
 *    options besides `enabled` (see `page-keys/`).
 * 2. Register them in `features/index.ts`, `starters.ts` and `controls.ts`
 *    (with the popup group).
 * 3. Add `<id>.title` and `<id>.description` (the popup switch) to the
 *    locales.
 *
 * Steps 2 and 3 are typed over `FeatureId`, so a missing entry is a compile
 * error (for locales, in `en`, the fallback).
 *
 * Everything here is pure; reading and writing the user layer lives in
 * `settings-storage.ts`.
 */
import {
  featureIds,
  features,
  renamedFeatureIds,
  type FeatureId,
  type FeatureOptions,
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

/**
 * A site section's layer (`Site.sections`), merged over `Site.features`.
 * Adapters only (selectors, URL rules, …), no user option defaults: the user
 * settings are per site, so the defaults they are pruned against must not
 * vary between its sections.
 */
export type SectionFeatures = {
  [K in FeatureId]?: false | Omit<FeatureSiteConfig<K>, keyof FeatureOptions<K>>;
};

/** A user layer (global or per site). Missing fields fall through. */
export type UserSettings = { [K in FeatureId]?: FeatureUserConfig<K> };

/** Effective settings. `null` = not available on this site. */
export type ResolvedFeatures = { [K in FeatureId]: FeatureResolvedConfig<K> | null };

// ── Layering ─────────────────────────────────────────────────────────────────

/**
 * No particular site: the global settings. Every feature is available there
 * with its defaults, site-specific ones too (so the user can turn them off
 * everywhere).
 */
export const ALL_SITES = Symbol('all sites');

/**
 * What settings are resolved for: one site, by its layer (`Site.features`,
 * `undefined` for a site without config), or `ALL_SITES`.
 */
export type SiteScope = SiteFeatures | undefined | typeof ALL_SITES;

/** User layers, bottom first (global, then the site override). */
type UserLayers = readonly (UserSettings | null | undefined)[];

/** Effective settings for `scope` under the user layers. */
export function resolveFeatures(scope: SiteScope, ...userLayers: UserLayers): ResolvedFeatures {
  const allSites = scope === ALL_SITES;
  const users = userLayers.map(sanitizeUserSettings);
  const resolved: Record<string, object | null> = {};
  for (const id of featureIds) {
    const site = allSites ? undefined : scope?.[id];
    const unavailable = site === false || (!allSites && features[id].siteSpecific && !site);
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
 * and range; everything else falls through to the defaults. A renamed
 * feature's settings are read from its old id when the new one is missing.
 * Idempotent.
 */
export function sanitizeUserSettings(raw: unknown): UserSettings {
  if (!isPlainObject(raw)) return {};
  const clean: Record<string, object> = {};
  for (const id of featureIds) {
    const value = [id, ...(OLD_IDS.get(id) ?? [])].map((key) => raw[key]).find(isPlainObject);
    if (!value) continue;
    const config = sanitizeFeature(id, value);
    if (Object.keys(config).length) clean[id] = config;
  }
  return clean as UserSettings;
}

/**
 * Drop values of the top user layer equal to what the layers below
 * (`beneath`, bottom first) already give for `scope`, so a stored setting
 * always means "differs from what it would inherit". Returns `{}` when nothing
 * differs.
 */
export function pruneUserSettings(
  scope: SiteScope,
  userSettings: UserSettings,
  ...beneath: UserLayers
): UserSettings {
  const defaults = resolveFeatures(scope, ...beneath);
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

/** Each renamed feature's old ids (see `renamedFeatureIds`). */
const OLD_IDS = new Map<FeatureId, string[]>();
for (const [oldId, id] of Object.entries(renamedFeatureIds)) {
  OLD_IDS.set(id, [...(OLD_IDS.get(id) ?? []), oldId]);
}

/** One feature's user layer: `enabled` is common, the rest is up to the feature. */
function sanitizeFeature(id: FeatureId, raw: Record<string, unknown>): object {
  const config: Record<string, unknown> = { ...features[id].sanitizeOptions?.(raw) };
  if (typeof raw.enabled === 'boolean') config.enabled = raw.enabled;
  return config;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function withoutUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
