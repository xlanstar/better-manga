import { httpUrl } from '@/utils/url';

/**
 * `href` (resolved against `current`), if it is another page on `current`'s
 * origin, so worth prefetching: not `current` itself, whatever the hash;
 * else `null`.
 */
export function otherPageUrl(href: string, current: string): string | null {
  const url = httpUrl(href, current);
  if (!url) return null;
  const target = new URL(url);
  const here = new URL(current);
  const samePage = target.pathname === here.pathname && target.search === here.search;
  return target.origin === here.origin && !samePage ? url : null;
}
