/** The parts of `Location` that `siteUrlFor` reads. */
export type FrameLocation = Pick<Location, 'protocol' | 'origin' | 'pathname' | 'search'> & {
  /** Chromium only; `undefined` in Firefox. */
  ancestorOrigins?: ArrayLike<string>;
};

/**
 * The URL to match sites against for a frame: its own for a normal page.
 * Script-injected frames are `about:blank` / `about:srcdoc` (reached via
 * `matchAboutBlank`, or `allFrames` re-injection from the background) but
 * inherit the parent's origin, so fall back to the outermost ancestor — the browser only injects there when the parent frame
 * matches the manifest patterns. `''` when there's nothing usable.
 */
export function siteUrlFor(frame: FrameLocation, referrer: string): string {
  if (frame.protocol === 'http:' || frame.protocol === 'https:') {
    return frame.origin + frame.pathname + frame.search;
  }
  const origins = frame.ancestorOrigins;
  const ancestor = origins?.length ? origins[origins.length - 1] : referrer;
  if (!ancestor) return '';
  try {
    const { origin } = new URL(ancestor);
    // Opaque origins (sandboxed frames, `about:` / `data:` URLs) are `"null"`.
    return origin === 'null' ? '' : origin + '/';
  } catch {
    return ''; // e.g. an ancestor origin of `"null"`
  }
}
