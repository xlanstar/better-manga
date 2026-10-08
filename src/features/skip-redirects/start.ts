import type { FeatureStart } from '../types';
import type { SkipRedirectsResolvedConfig } from './index';

/** Every way a link gets followed or opened (incl. "open in new tab"). */
const EVENTS = ['click', 'auxclick', 'contextmenu'] as const;

// The page may set hrefs late (after its data loads), so rewrite on use
// rather than up front.
export const startSkipRedirects: FeatureStart<SkipRedirectsResolvedConfig> = (
  { rewriteLink },
  signal,
) => {
  if (!rewriteLink) return;
  const rewrite = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const direct = rewriteLink(link.href, location.origin);
    if (direct) link.href = direct;
  };
  // Window capture runs before any page listener on document or below.
  for (const type of EVENTS) window.addEventListener(type, rewrite, { capture: true, signal });
};
