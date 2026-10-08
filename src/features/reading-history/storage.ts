/**
 * The reading history in `browser.storage.local`, one item holding every
 * entry (see `history.ts`), so the popup reads it in one call. Local only:
 * never synced, never sent anywhere. Everything read back is sanitized.
 *
 * Pages (the content script's `start.ts`, the popup / options page) read it
 * directly but only ask the background to change it: each write rewrites
 * the whole item, so writers in two tabs at once would drop each other's
 * entries. The background, the one writer, applies changes one at a time.
 */
import { browser } from 'wxt/browser';
import { storage } from 'wxt/utils/storage';
import {
  sanitizeChange,
  sanitizeHistory,
  withChange,
  type HistoryChange,
  type HistoryEntry,
} from './history';

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
  return send({ type: 'saveHistoryEntry', entry });
}

export function removeEntry(entry: HistoryEntry): Promise<void> {
  return send({ type: 'removeHistoryEntry', entry });
}

export function clearHistory(): Promise<void> {
  return send({ type: 'clearHistory' });
}

/** Fails silently, e.g. in a tab orphaned by an extension update. */
async function send(change: HistoryChange): Promise<void> {
  try {
    await browser.runtime.sendMessage(change);
  } catch {}
}

/** Background only: apply the changes pages send. */
export function startHistoryWriter(): void {
  browser.runtime.onMessage.addListener((message) => {
    const change = sanitizeChange(message);
    if (change) void update((history) => withChange(history, change));
    // No reply: pages see the result through `watchHistory`.
  });
}

/** Writes, one at a time, so none overwrites another. */
let writes = Promise.resolve();

function update(change: (history: HistoryEntry[]) => HistoryEntry[]): Promise<void> {
  writes = writes
    .then(async () => storage.setItem(HISTORY_KEY, change(await loadHistory())))
    .catch(() => {});
  return writes;
}
