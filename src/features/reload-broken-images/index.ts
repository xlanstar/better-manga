import type { ChapterImages } from '@/utils/chapter-images';
import type { Feature } from '../types';

/**
 * Retry chapter images that fail to load (a dropped connection, a busy image
 * server), which would otherwise stay broken until the page is reloaded. Each
 * is requested again a few times, waiting longer each time (see `retry.ts`),
 * and once more when the browser comes back online. Site-specific: each site
 * names its chapter images.
 */

export type ReloadBrokenImagesSiteConfig = {
  images?: ChapterImages;
};

export const reloadBrokenImages: Feature<ReloadBrokenImagesSiteConfig> = {
  defaults: { enabled: true },
  siteSpecific: true,
  isUsable: ({ images }) => !!images?.selector.trim(),
};
