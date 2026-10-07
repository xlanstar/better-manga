import { overridePageKeyScroll } from '@/utils/scroll';
import type { Feature, FeatureStart } from './types';

/**
 * Page Up/Down scrolls a fixed ratio of the viewport, leaving overlap.
 *
 * Two named exports so the popup can import the definition without the
 * content-script code: `pageScroll` (definition, registered in
 * `features/index.ts`) and `startPageScroll` (registered in `runtime.ts`).
 */

/** What a site may declare. `container` is an adapter, not a user setting. */
export type PageScrollSiteConfig = { ratio?: number; container?: string };
export type PageScrollUserConfig = { enabled?: boolean; ratio?: number };
export type PageScrollResolved = { enabled: boolean; ratio: number; container?: string };

export const PAGE_SCROLL_RATIO = { min: 0.3, max: 1, step: 0.05 } as const;

export const pageScroll: Feature<PageScrollSiteConfig, PageScrollUserConfig, PageScrollResolved> = {
  defaults: { enabled: true, ratio: 0.7 },
  sanitize({ enabled, ratio }) {
    const out: PageScrollUserConfig = {};
    if (typeof enabled === 'boolean') out.enabled = enabled;
    if (typeof ratio === 'number' && Number.isFinite(ratio)) {
      out.ratio = Math.min(PAGE_SCROLL_RATIO.max, Math.max(PAGE_SCROLL_RATIO.min, ratio));
    }
    return out;
  },
};

export const startPageScroll: FeatureStart<PageScrollResolved> = (get) =>
  overridePageKeyScroll(() => {
    const s = get();
    return s?.enabled ? s : null;
  });
