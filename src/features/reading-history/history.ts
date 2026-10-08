/**
 * The reading history: for each work (site + work id), the latest chapter
 * read, newest first. Pure; storing it is `storage.ts`'s job.
 */

/** Works kept; reading another drops the one read longest ago. */
export const MAX_HISTORY_ENTRIES = 200;

/**
 * Where the reader is in a chapter: the index of the page image at the top
 * of the screen, and how far into it (0–1). Not a pixel offset: images
 * lazy-load, so pixels shift.
 */
export type ReadingPosition = { page: number; offset: number };

export const CHAPTER_START: ReadingPosition = { page: 0, offset: 0 };

export type HistoryEntry = {
  /** `Site.name`. */
  site: string;
  workId: string;
  workTitle: string;
  chapterTitle: string;
  /** The chapter's URL. */
  url: string;
  position: ReadingPosition;
  /** When it was last read, in ms since the epoch. */
  updatedAt: number;
};

type Work = Pick<HistoryEntry, 'site' | 'workId'>;

/** A string naming `work`'s entry: the same for the same work only. */
export function workKey({ site, workId }: Work): string {
  return JSON.stringify([site, workId]);
}

/** Whether `a` and `b` are the same work. */
export function isSameWork(a: Work, b: Work): boolean {
  return a.site === b.site && a.workId === b.workId;
}

/** `history` with `entry` first, replacing its work's entry; capped. */
export function withEntry(history: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...withoutEntry(history, entry)].slice(0, MAX_HISTORY_ENTRIES);
}

/** `history` without `entry`'s work. */
export function withoutEntry(
  history: readonly HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  return history.filter((e) => !isSameWork(e, entry));
}

/**
 * Coerce an untrusted stored history: valid entries only, one per work (the
 * newest), newest first, capped. Idempotent.
 */
export function sanitizeHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries = raw
    .map(sanitizeEntry)
    .filter((e) => e !== null)
    .toSorted((a, b) => b.updatedAt - a.updatedAt);
  const seen = new Set<string>();
  return entries
    .filter((e) => {
      const key = workKey(e);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_HISTORY_ENTRIES);
}

function sanitizeEntry(raw: unknown): HistoryEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { site, workId, workTitle, chapterTitle, url, position, updatedAt } = raw as Record<
    string,
    unknown
  >;
  const texts = [site, workId, workTitle, chapterTitle];
  if (!texts.every((s) => typeof s === 'string' && s !== '')) return null;
  if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return null;
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) return null;
  return {
    site,
    workId,
    workTitle,
    chapterTitle,
    url,
    position: sanitizePosition(position),
    updatedAt,
  } as HistoryEntry;
}

function sanitizePosition(raw: unknown): ReadingPosition {
  if (typeof raw !== 'object' || raw === null) return CHAPTER_START;
  const { page, offset } = raw as Record<string, unknown>;
  if (!Number.isInteger(page) || (page as number) < 0) return CHAPTER_START;
  if (typeof offset !== 'number' || !(offset >= 0 && offset <= 1)) return CHAPTER_START;
  return { page: page as number, offset };
}
