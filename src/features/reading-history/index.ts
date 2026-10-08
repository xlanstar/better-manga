import type { ChapterImages } from '@/utils/chapter-images';
import type { Feature } from '../types';

/**
 * Remember, for each work, the latest chapter read and where in it, so the
 * popup can offer to continue reading and reopening the chapter scrolls back
 * there. Kept only in this browser (see `storage.ts`). Site-specific: each
 * site says where the page names its work and chapter.
 *
 * - `index.ts` (this file): definition, registered in `features/index.ts`.
 * - `start.ts`: content-script side (records and restores), registered in
 *   `features/starters.ts`.
 * - `history.ts`, `storage.ts`: the stored history, shared with the popup
 *   and options page (`components/reading-history.tsx`) and written by the
 *   background (`entrypoints/background.ts`).
 * - Popup title and description: in `features/controls.ts`.
 */

export type ReadingHistorySiteConfig = {
  /**
   * The chapter page's link to its work (e.g. in the breadcrumb): its text
   * is the work's title, its path identifies the work.
   */
  work?: string;
  /** The element whose text is the chapter's title. */
  chapter?: string;
  /** The chapter's page images, for the reading position. */
  images?: ChapterImages;
};
export type ReadingHistoryResolvedConfig = ReadingHistorySiteConfig & { enabled: boolean };

export const readingHistory: Feature<ReadingHistorySiteConfig, ReadingHistoryResolvedConfig> = {
  defaults: { enabled: true },
  siteSpecific: true,
  isUsable: ({ work, chapter }) => !!work?.trim() && !!chapter?.trim(),
};
