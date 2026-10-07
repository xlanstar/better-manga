import type { Feature } from '../types';

/**
 * Animate Page Up/Down: presses add up, a held key glides, letting go eases to
 * a stop (see `utils/smooth-scroll.ts`). Independent of `pageScroll`, which
 * sets the distance; without it each press goes the browser's own step.
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side, registered in `features/starters.ts`.
 * - `controls.tsx`: the duration and hold-speed sliders, registered in
 *   `features/controls.ts` with the popup title and description.
 */

/**
 * What a site may declare. `container` is an adapter, as in `pageScroll`; a
 * site whose reader scrolls in its own box sets it on both, so each feature
 * finds the box with the other turned off.
 */
export type SmoothScrollSiteConfig = { container?: string };
export type SmoothScrollUserOptions = {
  /** ms a typical press (700 px) animates; see `SmoothScrollTiming`. */
  duration?: number;
  /** Screens per second while Page Up/Down is held. */
  holdSpeed?: number;
};
export type SmoothScrollResolvedConfig = SmoothScrollSiteConfig &
  Required<SmoothScrollUserOptions> & { enabled: boolean };

/** Allowed values, also the popup sliders' ranges. */
export const SMOOTH_SCROLL_DURATION = { min: 100, max: 600, step: 50 } as const;
export const SMOOTH_SCROLL_HOLD_SPEED = { min: 0.5, max: 5, step: 0.5 } as const;

export const smoothScroll: Feature<
  SmoothScrollSiteConfig,
  SmoothScrollResolvedConfig,
  SmoothScrollUserOptions
> = {
  defaults: { enabled: true, duration: 150, holdSpeed: 2 },
  sanitizeOptions({ duration, holdSpeed }) {
    const options: SmoothScrollUserOptions = {};
    if (isFiniteNumber(duration)) options.duration = clamp(duration, SMOOTH_SCROLL_DURATION);
    if (isFiniteNumber(holdSpeed)) options.holdSpeed = clamp(holdSpeed, SMOOTH_SCROLL_HOLD_SPEED);
    return options;
  },
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value: number, { min, max }: { min: number; max: number }): number {
  return Math.min(max, Math.max(min, value));
}
