/** Wait before the first retry; each one after waits twice as long. */
const FIRST_RETRY_MS = 1000;

/** Retries before giving up on a URL: after 1 s, 2 s and 4 s. */
const MAX_RETRIES = 3;

/** An image's failed loads of `url` in a row. */
export type Failures = { url: string; count: number };

/** `failures` plus a failed load of `url`; another URL starts the count over. */
export function addFailure(failures: Failures | undefined, url: string): Failures {
  return { url, count: failures?.url === url ? failures.count + 1 : 1 };
}

/** How long to wait before retrying after `count` failures in a row; `null` to give up. */
export function retryDelay(count: number): number | null {
  return count <= MAX_RETRIES ? FIRST_RETRY_MS * 2 ** (count - 1) : null;
}
