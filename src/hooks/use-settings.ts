import { useEffect, useRef, useState } from 'react';
import { pruneUserSettings, type UserSettings } from '@/features/settings';
import {
  mergeStoredSettings,
  saveGlobalSettings,
  saveSiteSettings,
  setSiteDisabled,
  subscribeStoredSettings,
  type StoredSettings,
} from '@/features/settings-storage';
import { sites, type Site } from '@/sites';

const EMPTY: StoredSettings = { global: {}, bySite: {}, disabledSites: new Set() };

/**
 * Every site's user settings, kept in sync with storage (so the popup and the
 * options page can both be open). `settings` is `null` until loaded.
 *
 * Updates take `persist`: `false` updates the UI only (e.g. while dragging a
 * slider); `true` also prunes and stores.
 */
export function useSettings() {
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  // Latest state, for pruning in event handlers.
  const latest = useRef<StoredSettings>(EMPTY);
  useEffect(() => {
    latest.current = settings ?? EMPTY;
  }, [settings]);

  useEffect(() => {
    const names = sites.map((s) => s.name);
    return subscribeStoredSettings(names, setSettings);
  }, []);

  const updateGlobal = (next: UserSettings, persist: boolean) => {
    const value = persist ? pruneUserSettings(undefined, next) : next;
    setSettings((prev) => prev && mergeStoredSettings(prev, { global: value }));
    if (persist) void saveGlobalSettings(value);
  };

  const updateSite = (site: Site, next: UserSettings, persist: boolean) => {
    const value = persist ? pruneUserSettings(site.features, next, latest.current.global) : next;
    setSettings((prev) => prev && mergeStoredSettings(prev, { bySite: { [site.name]: value } }));
    if (persist) void saveSiteSettings(site.name, value);
  };

  const setDisabled = (site: Site, disabled: boolean) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const disabledSites = new Set(prev.disabledSites);
      if (disabled) disabledSites.add(site.name);
      else disabledSites.delete(site.name);
      return { ...prev, disabledSites };
    });
    void setSiteDisabled(site.name, disabled);
  };

  return { settings, updateGlobal, updateSite, setDisabled };
}
