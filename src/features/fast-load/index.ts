import type { Feature } from '../types';

/**
 * Get chapter images on screen sooner. Readers tend to fetch a chapter's
 * images one at a time, each waiting for the last; this feature helps in
 * three ways, each a user option:
 *
 * - `connect`: open connections to the image hosts (`origins`) as the page
 *   starts, so the first image skips DNS and TLS.
 * - `preloadImages`: once the page shows its first image, download the rest
 *   (`images`) `parallel` at a time; the page then finds them in the cache.
 *   The page would load them all anyway, so this costs no extra data.
 * - `preloadNext`: once this chapter's images are in, open the next chapter
 *   (`nextChapter`) in a hidden frame, which preloads its images the same way
 *   and then removes itself; following the link finds them in the cache.
 *   Extra data, and the page's scripts run there (see `NextChapterConfig`).
 *
 * Top frame only (and the prefetch frame); nothing but `connect` under Data
 * Saver.
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side, registered in `features/starters.ts`.
 * - `controls.tsx`: the three options, registered in `features/controls.ts`
 *   with the popup title and description.
 */

/** The chapter's page images, as the page lazy-loads them. */
export type ChapterImages = {
  /** Every page image, loaded or not (e.g. `#chapcontent img[data-src]`). */
  selector: string;
  /** The attribute holding an image's real URL until the page loads it. */
  src: string;
};

export type NextChapterConfig = {
  /** The link to the next chapter. Only a same-origin target is fetched. */
  link: string;
  /** The link's real target, if its `href` goes through a redirect page. */
  rewrite?: (href: string, origin: string) => string | null;
  /**
   * `localStorage` keys a chapter page writes as it opens (reading history).
   * Whatever the hidden next chapter writes there is undone, so it doesn't
   * count as read.
   */
  keepStorage?: string[];
};

export type FastLoadSiteConfig = {
  /** Origins the chapter images come from. */
  origins?: string[];
  images?: ChapterImages;
  nextChapter?: NextChapterConfig;
};
export type FastLoadUserOptions = {
  connect?: boolean;
  preloadImages?: boolean;
  /** Images downloaded at a time. */
  parallel?: number;
  preloadNext?: boolean;
};
export type FastLoadResolvedConfig = FastLoadSiteConfig &
  Required<FastLoadUserOptions> & { enabled: boolean };

/** Allowed `parallel` values, also the popup slider's range. */
export const FAST_LOAD_PARALLEL = { min: 2, max: 8, step: 1 } as const;

const SWITCHES = ['connect', 'preloadImages', 'preloadNext'] as const;

export const fastLoad: Feature<FastLoadSiteConfig, FastLoadResolvedConfig, FastLoadUserOptions> = {
  defaults: { enabled: true, connect: true, preloadImages: true, parallel: 6, preloadNext: true },
  siteSpecific: true,
  isUsable: ({ origins = [], images, nextChapter }) =>
    origins.length > 0 || !!images?.selector.trim() || !!nextChapter?.link.trim(),
  sanitizeOptions(raw) {
    const options: FastLoadUserOptions = {};
    for (const key of SWITCHES) {
      const value = raw[key];
      if (typeof value === 'boolean') options[key] = value;
    }
    const { parallel } = raw;
    if (typeof parallel === 'number' && Number.isFinite(parallel)) {
      options.parallel = clampParallel(parallel);
    }
    return options;
  },
};

/** A whole number inside `FAST_LOAD_PARALLEL`. */
function clampParallel(value: number): number {
  const { min, max } = FAST_LOAD_PARALLEL;
  return Math.min(max, Math.max(min, Math.round(value)));
}
