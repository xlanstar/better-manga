/**
 * Helpers for features whose only user setting is an on/off switch (most
 * site-specific ones: ad blocking, auto-continue, …).
 */

/** The user layer of an on/off feature. */
export type ToggleUserConfig = { enabled?: boolean };

/** `Feature.sanitize` for an on/off feature: keeps a boolean `enabled` only. */
export function sanitizeToggle({ enabled }: Record<string, unknown>): ToggleUserConfig {
  return typeof enabled === 'boolean' ? { enabled } : {};
}
