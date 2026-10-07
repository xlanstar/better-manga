import { useSyncExternalStore } from 'react';
import { getLocalePreference, subscribeLocale } from '@/utils/i18n';

/** The language preference; re-renders the caller when it changes. */
export function useLocalePreference() {
  return useSyncExternalStore(subscribeLocale, getLocalePreference);
}
