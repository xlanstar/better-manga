import type { Feature } from '../types';

/**
 * Page Up/Down scrolls a fixed ratio of the viewport, leaving overlap.
 * Whether it animates is `smoothScroll`'s business (see `utils/scroll.ts`).
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side, registered in `features/starters.ts`.
 * - `controls.tsx`: the ratio slider, registered in `features/controls.ts`
 *   with the popup title and description.
 */

/**
 * What a site may declare. `container` is an adapter, not a user setting; set
 * it on `smoothScroll` too (see there).
 */
export type PageScrollSiteConfig = { ratio?: number; container?: string };
export type PageScrollUserOptions = { ratio?: number };
export type PageScrollResolvedConfig = { enabled: boolean; ratio: number; container?: string };

/** Allowed scroll ratios, also the popup slider's range. */
export const PAGE_SCROLL_RATIO = { min: 0.3, max: 1, step: 0.05 } as const;

export const pageScroll: Feature<
  PageScrollSiteConfig,
  PageScrollResolvedConfig,
  PageScrollUserOptions
> = {
  defaults: { enabled: true, ratio: 0.7 },
  sanitizeOptions({ ratio }) {
    return typeof ratio === 'number' && Number.isFinite(ratio) ? { ratio: clampRatio(ratio) } : {};
  },
};

function clampRatio(ratio: number): number {
  return Math.min(PAGE_SCROLL_RATIO.max, Math.max(PAGE_SCROLL_RATIO.min, ratio));
}
