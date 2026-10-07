import { useEffect, useState } from 'react';
import { isCustomised, pruneUserSettings, type UserSettings } from '@/features/settings';
import { loadUserSettings, resetUserSettings, saveUserSettings } from '@/features/settings-storage';
import { sites, sitesFor, type Site } from '@/sites';

export type SettingsBySite = Record<string, UserSettings>;

type PopupSettings = {
  /** The supported site open in the current tab, if any. */
  currentSiteName: string | null;
  settingsBySite: SettingsBySite;
};

/**
 * The popup's data: which site the current tab shows, and the user settings
 * of every site. `settings` is `null` until both have loaded — together, so
 * the first render already knows the current site (the accordion only reads
 * its default open item on mount).
 */
export function usePopupSettings() {
  const [settings, setSettings] = useState<PopupSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([findCurrentSiteName(), loadAllUserSettings()]).then(
      ([currentSiteName, settingsBySite]) => {
        if (!cancelled) setSettings({ currentSiteName, settingsBySite });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Replace one site's user settings. `persist: false` updates the UI only
   * (e.g. while dragging a slider); `persist: true` also prunes and stores them.
   */
  const updateSiteSettings = (site: Site, next: UserSettings, persist: boolean) => {
    const value = persist ? pruneUserSettings(site.features, next) : next;
    setSettings(
      (prev) => prev && { ...prev, settingsBySite: { ...prev.settingsBySite, [site.name]: value } },
    );
    if (!persist) return;
    void (isCustomised(value) ? saveUserSettings(site.name, value) : resetUserSettings(site.name));
  };

  return { settings, updateSiteSettings };
}

async function findCurrentSiteName(): Promise<string | null> {
  // `activeTab` exposes the URL of the tab the popup was opened on.
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  return (tab?.url && sitesFor(tab.url)[0]?.name) || null;
}

async function loadAllUserSettings(): Promise<SettingsBySite> {
  const entries = await Promise.all(
    sites.map(async (site) => {
      const settings = await loadUserSettings(site.name).catch(() => ({}));
      return [site.name, settings] as const;
    }),
  );
  return Object.fromEntries(entries);
}
