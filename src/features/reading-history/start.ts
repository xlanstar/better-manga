import { siteFor } from '@/sites';
import { onDomReady } from '@/utils/dom';
import type { FeatureStart } from '../types';
import { isSameChapter, readChapter } from './chapter';
import { CHAPTER_START, isSameWork, type HistoryEntry, type ReadingPosition } from './history';
import type { ReadingHistoryResolvedConfig } from './index';
import { isNearStart, readPosition, restorePosition, userInputSignal } from './position';
import { loadHistory, saveEntry } from './storage';

/** While the reader scrolls, the position is saved at most this often. */
const SAVE_INTERVAL_MS = 2000;

/**
 * Record the chapter as its work's latest, with the reading position: when
 * the page opens, at most every `SAVE_INTERVAL_MS` while scrolling, and when
 * the page is hidden or left. Reopening the chapter last read scrolls back
 * to where the reader was, unless that's the start or they scroll first.
 *
 * Top frame only, which also leaves out fast-load's hidden prefetch frame:
 * a preloaded chapter doesn't count as read.
 */
export const startReadingHistory: FeatureStart<ReadingHistoryResolvedConfig> = (config, signal) => {
  if (window !== window.top) return;
  const site = siteFor(location.href)?.name;
  if (!site) return;
  const userInput = userInputSignal(signal);
  onDomReady(() => {
    void loadHistory()
      .catch(() => [])
      .then((history) => {
        if (!signal.aborted) trackChapter(site, config, history, userInput, signal);
      });
  });
};

/** This page's URL, without the hash. */
function pageUrl(): string {
  return location.origin + location.pathname + location.search;
}

function trackChapter(
  site: string,
  config: ReadingHistoryResolvedConfig,
  history: readonly HistoryEntry[],
  userInput: AbortSignal,
  signal: AbortSignal,
) {
  const { images } = config;

  // Until the reader moves, the position being restored is where they are.
  let restoring: ReadingPosition | null = null;
  const chapter = readChapter(config, document);
  const last = chapter && history.find((e) => isSameWork(e, { site, workId: chapter.workId }));
  if (
    images &&
    last &&
    !userInput.aborted &&
    isSameChapter(last.url, pageUrl()) &&
    !isNearStart(last.position)
  ) {
    restoring = last.position;
    restorePosition(restoring, images, AbortSignal.any([signal, userInput]));
  }

  let saved = '';
  const save = () => {
    const info = readChapter(config, document);
    if (!info || signal.aborted) return;
    const position =
      (!userInput.aborted && restoring) || (images ? readPosition(images) : CHAPTER_START);
    const entry = { site, ...info, url: pageUrl(), position };
    // Unchanged since the last save: nothing to write.
    const snapshot = JSON.stringify(entry);
    if (snapshot === saved) return;
    saved = snapshot;
    void saveEntry({ ...entry, updatedAt: Date.now() });
  };
  save();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const onScroll = () => {
    timer ??= setTimeout(() => {
      timer = undefined;
      save();
    }, SAVE_INTERVAL_MS);
  };
  signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  window.addEventListener('scroll', onScroll, { passive: true, signal });
  window.addEventListener('pagehide', save, { signal });
  document.addEventListener(
    'visibilitychange',
    () => document.visibilityState === 'hidden' && save(),
    { signal },
  );
  // Back to this chapter from the back/forward cache: read again, now.
  window.addEventListener(
    'pageshow',
    (event) => {
      if (!event.persisted) return;
      saved = '';
      save();
    },
    { signal },
  );
}
