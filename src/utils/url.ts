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
