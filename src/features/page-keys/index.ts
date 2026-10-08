import { snapToRange } from '@/utils/range';
import type { Feature } from '../types';

/**
 * Page Up/Down: each press scrolls a fixed ratio of the screen, leaving
 * overlap, and by default animates there: presses add up, a held key glides,
 * letting go eases to a stop (see `utils/smooth-scroll.ts`). Off, the keys
 * are the browser's. Formerly `pageScroll`, then `pageDistance` beside a
 * separate `smoothScroll` (see `renamedFeatureIds`).
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side, registered in `features/starters.ts`.
 * - `controls.tsx`: the ratio slider and the smooth switch with its sliders,
 *   registered in `features/controls.ts` with the popup group; title and
 *   description: in the locales.
 */

/** What a site may declare. `container` is an adapter, not a user setting. */
export type PageKeysSiteConfig = { ratio?: number; container?: string };
export type PageKeysUserOptions = {
  /** Share of the screen one press scrolls. */
  ratio?: number;
  smooth?: boolean;
  /** ms a typical press (700 px) animates; see `SmoothScrollTiming`. */
  duration?: number;
  /** Screens per second while Page Up/Down is held. */
  holdSpeed?: number;
};
export type PageKeysResolvedConfig = PageKeysSiteConfig &
  Required<PageKeysUserOptions> & { enabled: boolean };

/** Allowed values, also the popup sliders' ranges. */
export const PAGE_KEYS_RATIO = { min: 0.3, max: 1, step: 0.05 } as const;
export const PAGE_KEYS_DURATION = { min: 100, max: 600, step: 50 } as const;
export const PAGE_KEYS_HOLD_SPEED = { min: 0.5, max: 5, step: 0.5 } as const;

export const pageKeys: Feature<PageKeysSiteConfig, PageKeysResolvedConfig, PageKeysUserOptions> = {
  defaults: { enabled: true, ratio: 0.7, smooth: true, duration: 150, holdSpeed: 2 },
  sanitizeOptions(raw) {
    const options: PageKeysUserOptions = {};
    const ratio = snapToRange(raw.ratio, PAGE_KEYS_RATIO);
    const duration = snapToRange(raw.duration, PAGE_KEYS_DURATION);
    const holdSpeed = snapToRange(raw.holdSpeed, PAGE_KEYS_HOLD_SPEED);
    if (ratio !== undefined) options.ratio = ratio;
    if (typeof raw.smooth === 'boolean') options.smooth = raw.smooth;
    if (duration !== undefined) options.duration = duration;
    if (holdSpeed !== undefined) options.holdSpeed = holdSpeed;
    return options;
  },
};
