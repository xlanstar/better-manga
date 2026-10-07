import { defineSite } from './types';

export const site = defineSite({
  name: 'hipmh',
  label: '嬉皮漫畫',
  // Reader only. The main site `m.hipmh.com` (catalogue, works pages) is not
  // matched: its chapter redirects are rewritten here instead (see below).
  // `reader.hipmh.top/` itself 301s to the main site; chapters live at
  // `/chapter/<hid>`. API / images: `hipapi1.s3file.top`, `cover.s3imgs.top`.
  // All domains: docs/manga-sites.md.
  matches: ['*://reader.hipmh.top/*'],
  features: {
    blockAds: {
      // An inline module script reads this node's data-config and hijacks
      // clicks on chapter / prev / next links: it opens the real page in a new
      // tab and sends the current tab to an ad. It bails out when the node is
      // missing, so remove it before that (deferred) script runs.
      remove: ['#nav-redirect-config'],
    },
    // Prev / next (and chapter list) links point at the main site's redirect
    // page, `https://m.hipmh.com/chapter/go?hid=…`, which bounces back to
    // `reader.hipmh.top/chapter/go?hid=…` and then to `/chapter/<hid>`. That
    // chain of cross-site navigations reveals the browser toolbar in
    // fullscreen. The page sets these hrefs late, after its data loads.
    skipRedirects: { rewriteLink: directChapterUrl },
  },
});

/** The redirect page's path ending, `/chapter/go` (optional trailing slash). */
const REDIRECT_PATH_END = /\/chapter\/go\/?$/;

/** `…/chapter/go?hid=X` (any host) → `<origin>…/chapter/X`, else null. */
export function directChapterUrl(href: string, origin: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const hid = url.searchParams.get('hid');
  if (!hid || !REDIRECT_PATH_END.test(url.pathname)) return null;
  const path = url.pathname.replace(REDIRECT_PATH_END, `/chapter/${encodeURIComponent(hid)}`);
  return new URL(path, origin).href;
}
