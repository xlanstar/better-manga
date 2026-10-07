import type { Feature } from '../types';

/**
 * Page Up/Down scrolls a fixed ratio of the viewport, leaving overlap.
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side, registered in `features/starters.ts`.
 * - `controls.tsx`: popup controls, registered in `features/controls.ts`.
 */

/** What a site may declare. `container` is an adapter, not a user setting. */
export type PageScrollSiteConfig = { ratio?: number; container?: string };
export type PageScrollUserConfig = { enabled?: boolean; ratio?: number };
export type PageScrollResolvedConfig = { enabled: boolean; ratio: number; container?: string };

/** Allowed scroll ratios, also the popup slider's range. */
export const PAGE_SCROLL_RATIO = { min: 0.3, max: 1, step: 0.05 } as const;

export const pageScroll: Feature<
  PageScrollSiteConfig,
  PageScrollUserConfig,
  PageScrollResolvedConfig
> = {
  defaults: { enabled: true, ratio: 0.7 },
  sanitize({ enabled, ratio }) {
    const config: PageScrollUserConfig = {};
    if (typeof enabled === 'boolean') config.enabled = enabled;
    if (typeof ratio === 'number' && Number.isFinite(ratio)) config.ratio = clampRatio(ratio);
    return config;
  },
};

function clampRatio(ratio: number): number {
  return Math.min(PAGE_SCROLL_RATIO.max, Math.max(PAGE_SCROLL_RATIO.min, ratio));
}
