/** `raw` resolved against `base`, if that makes an http(s) URL; else `null`. */
export function httpUrl(raw: string | null, base: string): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw, base);
    return /^https?:$/.test(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

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
