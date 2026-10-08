import { httpUrl } from '@/utils/url';
import type { ReadingHistorySiteConfig } from './index';

/** What the chapter page says about itself. */
export type ChapterInfo = { workId: string; workTitle: string; chapterTitle: string };

/**
 * The work and chapter the page shows, read with the site's selectors;
 * `null` until the page names both.
 */
export function readChapter(
  { work, chapter }: ReadingHistorySiteConfig,
  doc: Document,
): ChapterInfo | null {
  if (!work || !chapter) return null;
  try {
    const link = doc.querySelector(work);
    const workId = workIdFromHref(link?.getAttribute('href') ?? null, doc.baseURI);
    const workTitle = text(link);
    const chapterTitle = text(doc.querySelector(chapter));
    return workId && workTitle && chapterTitle ? { workId, workTitle, chapterTitle } : null;
  } catch {
    return null; // invalid selector
  }
}

/**
 * A work's id: its page's path, without a trailing slash, so the same work
 * on another of the site's domains is the same entry. `null` without one.
 */
export function workIdFromHref(href: string | null, base: string): string | null {
  const url = httpUrl(href, base);
  return (url && new URL(url).pathname.replace(/\/+$/, '')) || null;
}

/**
 * Whether two chapter URLs are the same chapter: same path (bar a trailing
 * slash) and query, on any of the site's domains.
 */
export function isSameChapter(a: string, b: string): boolean {
  try {
    return chapterKey(a) === chapterKey(b);
  } catch {
    return false;
  }
}

/** `href`'s path (bar a trailing slash) and query; throws if it isn't a URL. */
function chapterKey(href: string): string {
  const { pathname, search } = new URL(href);
  return pathname.replace(/\/+$/, '') + search;
}

function text(el: Element | null | undefined): string {
  return el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}
