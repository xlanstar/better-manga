import type { FeatureId } from '@/features';
import type { SiteFeatures } from '@/features/settings';
import type { Site, SiteSection } from './types';

const SECTIONS: readonly SiteSection[] = ['main', 'reader'];

/**
 * The site layer on pages of `section`: `Site.features`, the section's on top.
 * Field by field, the section's wins, except lists (selectors, …): those add
 * to the site's.
 */
export function sectionFeatures(site: Site, section: SiteSection): SiteFeatures {
  const merged: Record<string, unknown> = { ...site.features };
  for (const [id, config] of Object.entries(site.sections?.[section]?.features ?? {})) {
    const base = merged[id];
    merged[id] = config && base ? mergeConfig(base, config) : (config ?? base);
  }
  return merged as SiteFeatures;
}

function mergeConfig(base: object, config: object): object {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(config)) {
    const below = merged[key];
    merged[key] = Array.isArray(below) && Array.isArray(value) ? [...below, ...value] : value;
  }
  return merged;
}

/**
 * The site layer the user settings are shown and pruned against, as they
 * cover every section: each feature as the first section that configures it,
 * so it is listed if it applies anywhere. Sections set no user options, so
 * the defaults agree whichever section it comes from.
 */
export function settingsFeatures(site: Site): SiteFeatures {
  if (!site.sections) return site.features ?? {};
  const layers = SECTIONS.map((section) => sectionFeatures(site, section));
  const merged: Record<string, unknown> = {};
  for (const id of new Set(layers.flatMap(Object.keys)) as Set<FeatureId>) {
    const values = layers.map((layer) => layer[id]);
    // `undefined` (shared features apply) beats `false` (off) when none is configured.
    merged[id] = values.find(Boolean) ?? (values.includes(undefined) ? undefined : false);
  }
  return merged as SiteFeatures;
}
