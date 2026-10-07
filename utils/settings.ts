/**
 * Reading features: implemented once, configured in three layers.
 *
 *   global default  →  site default (`Site.features`)  →  user setting (per site)
 *
 * Later layers override earlier ones. Site fixes (ad hiding, anti-hijack, …)
 * are not features — they live in each site's `run()` and are not user-tunable.
 */

// ── Page Up/Down scroll ──────────────────────────────────────────────────────

/** What a site may declare. `container` is an adapter, not a user setting. */
export type PageScrollSiteConfig = { ratio?: number; container?: string };
export type PageScrollUserConfig = { enabled?: boolean; ratio?: number };
export type PageScrollResolved = { enabled: boolean; ratio: number; container?: string };

export const PAGE_SCROLL_RATIO = { min: 0.3, max: 1, step: 0.05 } as const;

// ── Shapes per layer ─────────────────────────────────────────────────────────

/** Site defaults. `false` = the feature does not apply to this site at all. */
export type SiteFeatures = {
  pageScroll?: false | PageScrollSiteConfig;
};

/** What the user stored for one site. Missing fields fall through. */
export type UserSiteSettings = {
  pageScroll?: PageScrollUserConfig;
};

/** Effective settings. `null` = not available on this site. */
export type ResolvedFeatures = {
  pageScroll: PageScrollResolved | null;
};

export const GLOBAL_DEFAULTS = {
  pageScroll: { enabled: true, ratio: 0.7 },
} as const;

export function resolveFeatures(
  site: SiteFeatures | undefined,
  user: UserSiteSettings | null | undefined,
): ResolvedFeatures {
  const siteScroll = site?.pageScroll;
  return {
    pageScroll:
      siteScroll === false
        ? null
        : {
            ...GLOBAL_DEFAULTS.pageScroll,
            ...stripUndefined(siteScroll ?? {}),
            ...sanitizeUserSettings(user).pageScroll,
          },
  };
}

/**
 * Coerce an untrusted user layer into `UserSiteSettings`. Stored values may be
 * corrupt or written by an older version, so keep only fields of the right type
 * and range; everything else falls through to the defaults. Idempotent.
 */
export function sanitizeUserSettings(raw: unknown): UserSiteSettings {
  if (!isObject(raw) || !isObject(raw.pageScroll)) return {};
  const { enabled, ratio } = raw.pageScroll;
  const pageScroll: PageScrollUserConfig = {};
  if (typeof enabled === 'boolean') pageScroll.enabled = enabled;
  if (typeof ratio === 'number' && Number.isFinite(ratio)) {
    pageScroll.ratio = Math.min(PAGE_SCROLL_RATIO.max, Math.max(PAGE_SCROLL_RATIO.min, ratio));
  }
  return Object.keys(pageScroll).length ? { pageScroll } : {};
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
    const base = defaults[name as keyof ResolvedFeatures] as Record<string, unknown> | null;
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
