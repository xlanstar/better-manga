import type { ChapterImages } from '@/utils/chapter-images';
import type { Feature } from '../types';

/**
 * Retry chapter images that fail to load (a dropped connection, a busy image
 * server), which would otherwise stay broken until the page is reloaded. Each
 * is requested again a few times, waiting longer each time (see `retry.ts`),
 * and once more when the browser comes back online. Site-specific: each site
 * names its chapter images.
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side, registered in `features/starters.ts`.
 * - Popup group: in `features/controls.ts`; title and description: in the
 *   locales (`<id>.title`, `<id>.description`).
 */

export type ReloadBrokenImagesSiteConfig = {
  images?: ChapterImages;
};
export type ReloadBrokenImagesResolvedConfig = ReloadBrokenImagesSiteConfig & {
  enabled: boolean;
};

export const reloadBrokenImages: Feature<
  ReloadBrokenImagesSiteConfig,
  ReloadBrokenImagesResolvedConfig
> = {
  defaults: { enabled: true },
  siteSpecific: true,
  isUsable: ({ images }) => !!images?.selector.trim(),
};
