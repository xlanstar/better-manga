/**
 * The reading history in `browser.storage.local`, one item holding every
 * entry (see `history.ts`), so the popup reads it in one call. Local only:
 * never synced, never sent anywhere. Everything read back is sanitized.
 *
 * Shared by the content script (`start.ts`) and the popup / options page,
 * so it imports neither side.
 */
import { storage } from 'wxt/utils/storage';
import { sanitizeHistory, withEntry, withoutEntry, type HistoryEntry } from './history';

const HISTORY_KEY = 'local:readingHistory';

export async function loadHistory(): Promise<HistoryEntry[]> {
  return sanitizeHistory(await storage.getItem(HISTORY_KEY));
}

/** Call `onHistory` with the history whenever it changes. Returns unsubscribe. */
export function watchHistory(onHistory: (history: HistoryEntry[]) => void): () => void {
  return storage.watch(HISTORY_KEY, (value) => onHistory(sanitizeHistory(value)));
}

/** Store `entry` as its work's latest. */
export function saveEntry(entry: HistoryEntry): Promise<void> {
  return update((history) => withEntry(history, entry));
}

export function removeEntry(entry: HistoryEntry): Promise<void> {
  return update((history) => withoutEntry(history, entry));
}

export function clearHistory(): Promise<void> {
  return storage.removeItem(HISTORY_KEY);
}

/** This page's writes, one at a time, so none overwrites another. */
let writes = Promise.resolve();

function update(change: (history: HistoryEntry[]) => HistoryEntry[]): Promise<void> {
  writes = writes
    .then(async () => storage.setItem(HISTORY_KEY, change(await loadHistory())))
    .catch(() => {});
  return writes;
}
