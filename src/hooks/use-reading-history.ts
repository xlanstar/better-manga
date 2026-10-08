import { useEffect, useState } from 'react';
import type { HistoryEntry } from '@/features/reading-history/history';
import { loadHistory, watchHistory } from '@/features/reading-history/storage';

/**
 * The reading history, newest first, kept in sync with storage (a tab may
 * record while the page is open); `null` until loaded.
 */
export function useReadingHistory() {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  useEffect(() => {
    const unwatch = watchHistory(setHistory);
    // A change seen while loading is newer than the load.
    void loadHistory()
      .catch(() => [])
      .then((loaded) => setHistory((current) => current ?? loaded));
    return unwatch;
  }, []);
  return history;
}
