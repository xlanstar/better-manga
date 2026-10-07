import { keepRemoved } from '@/utils/dom';
import { onRetire } from '@/utils/lifecycle';
import type { Site } from './types';

export default {
  name: 'hipmh',
  label: '嬉皮漫畫',
  matches: ['*://reader.hipmh.top/*'],
  run() {
    // An inline module script reads this node's data-config and hijacks clicks
    // on chapter / prev / next links: it opens the real page in a new tab and
    // sends the current tab to an ad. It bails out when the node is missing,
    // so remove it before that (deferred) script runs.
    keepRemoved('#nav-redirect-config');
    skipChapterRedirects();
  },
} satisfies Site;

/**
 * Prev / next (and chapter list) links point at the main site's redirect page,
 * `https://m.hipmh.com/chapter/go?hid=…`, which bounces back to
 * `reader.hipmh.top/chapter/go?hid=…` and then to `/chapter/<hid>`. That chain
 * of cross-site navigations reveals the browser toolbar in fullscreen.
 * Point the link straight at `/chapter/<hid>` on this origin, right before the
 * browser follows it (the page sets these hrefs late, after its data loads).
 */
function skipChapterRedirects() {
  const rewrite = (e: Event) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const a = target.closest('a[href]');
    if (!(a instanceof HTMLAnchorElement)) return;
    const direct = directChapterUrl(a.href);
    if (direct) a.href = direct;
  };
  // Window capture runs before any page listener on document or below.
  const events = ['click', 'auxclick', 'contextmenu'] as const;
  for (const type of events) window.addEventListener(type, rewrite, true);
  onRetire(() => {
    for (const type of events) window.removeEventListener(type, rewrite, true);
  });
}

/** `…/chapter/go?hid=X` (any host) → `<this origin>…/chapter/X`, else null. */
function directChapterUrl(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const hid = url.searchParams.get('hid');
  if (!hid || !/\/chapter\/go\/?$/.test(url.pathname)) return null;
  const path = url.pathname.replace(/\/chapter\/go\/?$/, `/chapter/${encodeURIComponent(hid)}`);
  return new URL(path, location.origin).href;
}
