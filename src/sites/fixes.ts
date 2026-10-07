import type { SiteName } from './index';
import { run as baozimh } from './baozimh';
import { run as hipmh } from './hipmh';

/**
 * Site fixes by site name, for the content script only (kept out of
 * `index.ts` so the popup doesn't bundle them). Every registered site needs an
 * entry (`null` = no fixes), so a new site can't be forgotten here.
 */
export const siteFixes: Record<SiteName, (() => void) | null> = {
  baozimh,
  'g-mh': null,
  hipmh,
};
