import type { ChapterImages } from '@/utils/chapter-images';
import { defineSite } from './types';

/** The chapter's page images. */
const images: ChapterImages = { selector: '#chapcontent img[data-src]', src: 'data-src' };

/**
 * 嬉皮漫畫: only the reader host is matched, so no `sections`.
 *
 * - Main site: `m.hipmh.com`, not matched.
 * - Reader: `reader.hipmh.top`, chapter `/chapter/<hid>`; `/` redirects to
 *   the main site. Rendered client-side; link hrefs are set after data loads.
 * - Backend: API `hipapi1.s3file.top`, images `cover.s3imgs.top`.
 * - Chapter links: go via `m.hipmh.com/chapter/go?hid=…` →
 *   `reader.hipmh.top/chapter/go?hid=…` → `/chapter/<hid>`. The cross-site
 *   hops show the browser toolbar in fullscreen.
 * - Ads: a deferred inline script reads `#nav-redirect-config` and, on a
 *   chapter link click, opens the chapter in a new tab and sends this tab to
 *   an ad. Without that node it does nothing.
 * - Domains: docs/manga-sites.md.
 */
export const site = defineSite({
  name: 'hipmh',
  label: '嬉皮漫畫',
  matches: ['*://reader.hipmh.top/*'],
  features: {
    blockAds: {
      // Must be gone before the deferred ad script runs.
      remove: ['#nav-redirect-config'],
    },
    skipRedirects: { rewriteLink: directChapterUrl },
    fastLoad: {
      origins: ['https://hip-tx-1.s3imgs.top'],
      images,
      nextChapter: {
        link: '#nextChapterLink',
        rewrite: directChapterUrl,
        keepStorage: ['ReadingHistory'],
      },
    },
    reloadBrokenImages: { images },
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
