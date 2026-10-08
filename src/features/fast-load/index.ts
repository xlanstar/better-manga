import type { ChapterImages } from '@/utils/chapter-images';
import { snapToRange } from '@/utils/range';
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
 *   with the popup group; title and description: in the locales.
 */

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

/** Allowed `parallel` values, also the popup slider's range. */
export const FAST_LOAD_PARALLEL = { min: 2, max: 8, step: 1 } as const;

const SWITCHES = ['connect', 'preloadImages', 'preloadNext'] as const;

export const fastLoad: Feature<FastLoadSiteConfig, FastLoadUserOptions> = {
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
    const parallel = snapToRange(raw.parallel, FAST_LOAD_PARALLEL);
    if (parallel !== undefined) options.parallel = parallel;
    return options;
  },
};
