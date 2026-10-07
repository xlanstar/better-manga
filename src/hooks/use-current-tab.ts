import { useEffect, useState } from 'react';
import { siteFor, type Site } from '@/sites';

export type CurrentTab = {
  id: number | undefined;
  /** The supported site the tab shows, if any. */
  site: Site | null;
};

/** The tab the popup was opened on; `null` until known. */
export function useCurrentTab() {
  const [tab, setTab] = useState<CurrentTab | null>(null);
  useEffect(() => {
    let cancelled = false;
    // `activeTab` exposes the URL of the tab the popup was opened on.
    void browser.tabs
      .query({ active: true, currentWindow: true })
      .catch(() => [])
      .then(([active]) => {
        if (cancelled) return;
        setTab({ id: active?.id, site: active?.url ? siteFor(active.url) : null });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return tab;
}
