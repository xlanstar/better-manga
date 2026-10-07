/**
 * Smooth scrolling tuned for reading.
 *
 * `scrollBy({ behavior: 'smooth' })` falls short for a reader: each call is
 * measured from the current position, so a press mid-animation drops what was
 * left; every retarget restarts from rest, so a held key crawls; and it
 * cannot be timed. Here:
 *
 * - Presses add up: each one moves the running animation's end, not its
 *   current position, so N presses always scroll N steps.
 * - Speed carries over when a new press lands mid-animation (cubic Hermite
 *   curve), so stacked presses don't jolt; reversing starts from rest at once.
 * - Gentle start and landing (smoothstep), and longer moves take a bit longer
 *   so peak speed — and blur — grows slowly. How long is up to the user.
 * - A held key glides at a steady, user-set speed instead of hopping a page
 *   per auto-repeat; letting go coasts to a stop.
 * - Always animated, like the browser's own Page Up/Down: Chrome animates
 *   those even with `prefers-reduced-motion: reduce`.
 *
 * Times are in ms, speeds in px/ms.
 */

/** User-tunable timing (the `smoothScroll` feature's options). */
export type SmoothScrollTiming = {
  /**
   * How long a 700 px move (70 % of a 1000 px screen) takes. Shorter moves
   * take a little less, longer ones a little more. Letting go of a held key
   * coasts this long too.
   */
  duration: number;
  /** Speed while a key is held. */
  holdSpeed: number;
};

/**
 * Shape of a move's duration over its distance: `base + perSqrtPx · √distance`,
 * scaled so a `referencePx` move takes the user's `duration`, and at most
 * twice that.
 */
const DURATION_SHAPE = { base: 150, perSqrtPx: 6, referencePx: 700 } as const;
/** A typical frame (60 Hz), for `holdLead`. */
const FRAME_MS = 1000 / 60;
/** No auto-repeat for this long means the held key is up (missed keyup). */
const HOLD_TIMEOUT_MS = 300;
/** Events that mean the user took over scrolling. */
const TAKEOVER_EVENTS = ['wheel', 'touchstart', 'pointerdown'] as const;

/** One leg of the animation: `from` → `to`, leaving `from` at `velocity`. */
export type Motion = {
  from: number;
  to: number;
  velocity: number;
  start: number;
  duration: number;
};

/** How long a move of `distance` px takes, for a 700 px move taking `duration`. */
export function scrollDuration(distance: number, duration: number): number {
  const { base, perSqrtPx, referencePx } = DURATION_SHAPE;
  const shape = (px: number) => base + perSqrtPx * Math.sqrt(Math.abs(px));
  return Math.min(2 * duration, (duration * shape(distance)) / shape(referencePx));
}

/** Position and velocity of `motion` at `now`, and whether it is over. */
export function motionAt(
  { from, to, velocity, start, duration }: Motion,
  now: number,
): { top: number; velocity: number; done: boolean } {
  if (duration <= 0 || now >= start + duration) return { top: to, velocity: 0, done: true };
  // Cubic Hermite: leaves `from` at `velocity`, arrives at `to` at rest.
  // Frames stamped before the start (rAF times are the frame's start) hold.
  const s = Math.max(0, (now - start) / duration);
  const distance = to - from;
  const momentum = velocity * duration;
  return {
    top: from + momentum * (s - 2 * s ** 2 + s ** 3) + distance * (3 * s ** 2 - 2 * s ** 3),
    velocity: (momentum * (1 - 4 * s + 3 * s ** 2) + distance * (6 * s - 6 * s ** 2)) / duration,
    done: false,
  };
}

/**
 * A move from `top` to `to` starting at `now`, keeping `velocity` if it
 * already heads that way (a stacked press) and dropping it if not (reversing
 * should respond at once). `duration`: see `SmoothScrollTiming`.
 */
export function planMotion(
  top: number,
  velocity: number,
  to: number,
  now: number,
  duration: number,
): Motion {
  const distance = to - top;
  if (Math.abs(distance) < 0.5) return { from: top, to, velocity: 0, start: now, duration: 0 };
  const carried = Math.sign(velocity) === Math.sign(distance) ? velocity : 0;
  // The curve overshoots `to` when momentum alone would carry more than 3× the
  // distance; ending sooner turns it into a plain ease-out instead.
  const length = scrollDuration(distance, duration);
  return {
    from: top,
    to,
    velocity: carried,
    start: now,
    duration: carried ? Math.min(length, (3 * distance) / carried) : length,
  };
}

/**
 * How far ahead of the current position a held key keeps the target, so the
 * animation, retargeted every frame, settles at `speed`.
 *
 * Retargeting keeps the speed; the new curve (duration T, lead L) starts with
 * acceleration `(6L − 4·speed·T) / T²` and then decelerates (its jerk is
 * negative), losing a little speed before the next frame retargets it.
 * Starting with enough acceleration to make up for one frame of h ms gives
 * `L = speed · (4T + h) / 6`; T depends on L, so solve by iteration (it
 * converges in a few steps).
 */
export function holdLead(speed: number, duration: number): number {
  let lead = (speed * (4 * duration + FRAME_MS)) / 6;
  for (let i = 0; i < 8; i++) {
    lead = (speed * (4 * scrollDuration(lead, duration) + FRAME_MS)) / 6;
  }
  return lead;
}

/** Where coasting from `velocity` stops, easing out over `duration`. */
export function glideTarget(top: number, velocity: number, duration: number): number {
  return top + (velocity * duration) / 3;
}

/** `top` kept within `el`'s scroll range. */
function clampTo(el: Element, top: number): number {
  return Math.min(el.scrollHeight - el.clientHeight, Math.max(0, top));
}

export type SmoothScroller = {
  /**
   * Scroll `el` by `delta` px. A `repeat` (held key) glides at
   * `timing.holdSpeed` instead of adding a full step each time.
   */
  scrollBy(el: Element, delta: number, timing: SmoothScrollTiming, repeat?: boolean): void;
  /** The held key was let go: coast to a stop rather than run on. */
  release(): void;
  /** Drop the animation where it is (e.g. another key scrolls). */
  stop(): void;
};

/**
 * One animation at a time; it gives way when the user scrolls by other means.
 * Stops for good when `signal` aborts.
 */
export function createSmoothScroller(signal: AbortSignal): SmoothScroller {
  let el: Element | null = null;
  let motion: Motion | null = null;
  /** `el.scrollTop` right after our last write, to tell others' moves apart. */
  let written = 0;
  /** The last press's animation length. */
  let duration = 0;
  /** While a key is held (auto-repeat seen): which way, and how far ahead to aim. */
  let hold: { direction: number; lead: number; lastRepeat: number } | null = null;
  let frame = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    el = null;
    motion = null;
    hold = null;
  };

  // Something else moved the box (scroll anchoring as images load above):
  // shift along with it instead of fighting it.
  const followDrift = () => {
    if (!el || !motion) return;
    const drift = el.scrollTop - written;
    if (Math.abs(drift) < 1) return;
    motion.from += drift;
    motion.to += drift;
    written += drift;
  };

  /** Retarget to `to` from where the animation is at `now`, keeping its speed. */
  const retarget = (now: number, to: number) => {
    if (!el || !motion) return;
    const { top, velocity } = motionAt(motion, now);
    motion = planMotion(top, velocity, to, now, duration);
  };

  // Held: keep the target `lead` ahead, every frame, so the speed holds steady
  // whatever the key-repeat rate.
  const extendHold = (now: number) => {
    if (!el || !motion || !hold) return;
    const { top } = motionAt(motion, now);
    const to = clampTo(el, top + hold.direction * hold.lead);
    if ((to - motion.to) * hold.direction > 0) retarget(now, to);
  };

  // Let go: coast to a stop, only ever sooner than the current target.
  const glide = (now: number) => {
    hold = null;
    if (!el || !motion) return;
    const { top, velocity } = motionAt(motion, now);
    const to = clampTo(el, glideTarget(top, velocity, duration));
    if ((motion.to - to) * Math.sign(velocity) > 0) retarget(now, to);
  };

  const step = (now: number) => {
    frame = 0;
    if (!el || !motion) return;
    followDrift();
    // A keyup can go missing (focus moved away mid-hold): no repeat for a
    // while means the key is up.
    if (hold && now - hold.lastRepeat > HOLD_TIMEOUT_MS) glide(now);
    else extendHold(now);
    const { top, done } = motionAt(motion, now);
    // 'instant' overrides the site's CSS `scroll-behavior: smooth`, which would
    // otherwise smooth every frame and lag behind.
    el.scrollTo({ top, behavior: 'instant' });
    // Read back: the browser rounds to device pixels and clamps at the ends.
    written = el.scrollTop;
    if (done) motion = null;
    else frame = requestAnimationFrame(step);
  };

  const release = () => {
    if (hold) glide(performance.now());
  };

  for (const type of TAKEOVER_EVENTS) {
    window.addEventListener(type, stop, { capture: true, passive: true, signal });
  }
  window.addEventListener('blur', release, { signal });
  signal.addEventListener('abort', stop, { once: true });

  return {
    scrollBy(target, delta, timing, repeat = false) {
      if (signal.aborted) return;
      if (el !== target) stop();
      followDrift();
      const now = performance.now();
      duration = timing.duration;
      if (!motion) {
        written = target.scrollTop;
        motion = planMotion(written, 0, written, now, duration);
      }
      el = target;

      if (repeat) {
        const direction = Math.sign(delta);
        const lead = holdLead(timing.holdSpeed, duration);
        hold = { direction, lead, lastRepeat: now };
        extendHold(now);
      } else {
        hold = null;
        // Presses add up: from where the animation is heading.
        retarget(now, clampTo(target, motion.to + delta));
      }
      if (!frame) frame = requestAnimationFrame(step);
    },
    release,
    stop,
  };
}
