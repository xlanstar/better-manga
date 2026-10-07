import { useEffect, useRef, useState } from 'react';
import { ALL_SITES, pruneUserSettings, type UserSettings } from '@/features/settings';
import {
  EMPTY_SETTINGS,
  mergeStoredSettings,
  saveGlobalSettings,
  saveSiteSettings,
  setSiteDisabled,
  subscribeStoredSettings,
  type StoredSettings,
} from '@/features/settings-storage';
import { settingsFeatures, type Site } from '@/sites';

/**
 * The global layer, the disabled sites and the overrides of `sites`, kept in
 * sync with storage (so the popup and the options page can both be open).
 * `settings` is `null` until loaded; `sites: null` waits before loading.
 *
 * Updates take `persist`: `false` updates the UI only (e.g. while dragging a
 * slider); `true` also prunes and stores.
 */
export function useSettings(sites: readonly Site[] | null) {
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  // Latest state, for pruning in event handlers.
  const latest = useRef<StoredSettings>(EMPTY_SETTINGS);
  useEffect(() => {
    latest.current = settings ?? EMPTY_SETTINGS;
  }, [settings]);

  // Compared by names, so callers needn't keep `sites` stable.
  const names = sites && JSON.stringify(sites.map((s) => s.name));
  useEffect(() => {
    if (names) return subscribeStoredSettings(JSON.parse(names) as string[], setSettings);
  }, [names]);

  const updateGlobal = (next: UserSettings, persist: boolean) => {
    const value = persist ? pruneUserSettings(ALL_SITES, next) : next;
    setSettings((prev) => prev && mergeStoredSettings(prev, { global: value }));
    if (persist) void saveGlobalSettings(value);
  };

  const updateSite = (site: Site, next: UserSettings, persist: boolean) => {
    const value = persist
      ? pruneUserSettings(settingsFeatures(site), next, latest.current.global)
      : next;
    setSettings((prev) => prev && mergeStoredSettings(prev, { bySite: { [site.name]: value } }));
    if (persist) void saveSiteSettings(site.name, value);
  };

  const setDisabled = (site: Site, disabled: boolean) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const disabledSites = new Set(prev.disabledSites);
      if (disabled) disabledSites.add(site.name);
      else disabledSites.delete(site.name);
      return mergeStoredSettings(prev, { disabledSites });
    });
    void setSiteDisabled(site.name, disabled);
  };

  return { settings, updateGlobal, updateSite, setDisabled };
}
