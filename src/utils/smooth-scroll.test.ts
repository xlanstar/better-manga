import { describe, expect, test } from 'bun:test';
import {
  glideTarget,
  holdLead,
  type Motion,
  motionAt,
  planMotion,
  scrollDuration,
} from './smooth-scroll';

/** The default animation length. */
const D = 300;

/** Positions of `motion` every ms, start to end. */
function trace(motion: Motion): number[] {
  const tops: number[] = [];
  for (let t = motion.start; t <= motion.start + motion.duration; t++) {
    tops.push(motionAt(motion, t).top);
  }
  return tops;
}

function isMonotonic(tops: number[]): boolean {
  const sign = Math.sign(tops.at(-1)! - tops[0]!);
  return tops.every((top, i) => i === 0 || (top - tops[i - 1]!) * sign >= -1e-9);
}

describe('scrollDuration', () => {
  test.each([100, 300, 600])('a 700 px move takes exactly %p ms', (duration) => {
    expect(scrollDuration(700, duration)).toBeCloseTo(duration, 9);
  });

  test('longer moves take longer, but less than proportionally', () => {
    expect(scrollDuration(1400, D)).toBeGreaterThan(scrollDuration(700, D));
    expect(scrollDuration(1400, D)).toBeLessThan(2 * scrollDuration(700, D));
  });

  test('shorter moves are quicker, but not instant', () => {
    expect(scrollDuration(100, D)).toBeLessThan(D);
    expect(scrollDuration(0, D)).toBeGreaterThan(D / 3);
  });

  test('is the same up and down', () => {
    expect(scrollDuration(-700, D)).toBe(scrollDuration(700, D));
  });

  test('scales with the duration', () => {
    expect(scrollDuration(2000, 2 * D)).toBeCloseTo(2 * scrollDuration(2000, D), 9);
  });

  test('is capped at twice the duration', () => {
    expect(scrollDuration(1e7, D)).toBe(2 * D);
  });
});

describe('motionAt', () => {
  const motion: Motion = { from: 100, to: 800, velocity: 0, start: 1000, duration: 300 };

  test('begins at `from`, at rest', () => {
    expect(motionAt(motion, 1000)).toEqual({ top: 100, velocity: 0, done: false });
  });

  test('ends at `to`, at rest', () => {
    expect(motionAt(motion, 1300)).toEqual({ top: 800, velocity: 0, done: true });
    expect(motionAt(motion, 9999)).toEqual({ top: 800, velocity: 0, done: true });
  });

  test('holds at `from` for frames stamped before the start', () => {
    expect(motionAt(motion, 990).top).toBe(100);
  });

  test('from rest it is symmetric: halfway at half time, easing both ends', () => {
    expect(motionAt(motion, 1150).top).toBeCloseTo(450);
    expect(motionAt(motion, 1030).top - 100).toBeLessThan(70); // < 10 % in the first 10 %
  });

  test('peaks at 1.5× the average speed', () => {
    expect(motionAt(motion, 1150).velocity).toBeCloseTo((1.5 * 700) / 300);
  });

  test('moves monotonically', () => {
    expect(isMonotonic(trace(motion))).toBe(true);
  });

  test('a zero-length motion is already done', () => {
    expect(motionAt({ ...motion, duration: 0 }, 1000)).toEqual({
      top: 800,
      velocity: 0,
      done: true,
    });
  });
});

describe('planMotion', () => {
  test('from rest, eases over scrollDuration', () => {
    expect(planMotion(0, 0, 700, 5, D)).toEqual({
      from: 0,
      to: 700,
      velocity: 0,
      start: 5,
      duration: scrollDuration(700, D),
    });
  });

  test('keeps the current speed when pressing again mid-scroll', () => {
    const motion = planMotion(300, 3, 1400, 0, D);
    expect(motionAt(motion, 0).velocity).toBe(3);
    expect(isMonotonic(trace(motion))).toBe(true);
  });

  test('keeps speed scrolling up too', () => {
    const motion = planMotion(1000, -3, 0, 0, D);
    expect(motionAt(motion, 0).velocity).toBe(-3);
    expect(isMonotonic(trace(motion))).toBe(true);
  });

  test('reversing starts from rest', () => {
    expect(planMotion(300, 3, 0, 0, D).velocity).toBe(0);
  });

  test('ends sooner rather than overshoot when fast and close', () => {
    const motion = planMotion(0, 10, 100, 0, D);
    expect(motion.duration).toBeCloseTo(30);
    const tops = trace(motion);
    expect(isMonotonic(tops)).toBe(true);
    expect(Math.max(...tops)).toBeLessThanOrEqual(100);
  });

  test('a move of less than half a pixel is done at once', () => {
    expect(planMotion(100, 2, 100.2, 0, D).duration).toBe(0);
  });
});

/** Hold Page Down, retargeting every `every` ms (a frame); speed at `at` ms. */
function holdSpeed(speed: number, duration: number, every: number, at: number): number {
  const lead = holdLead(speed, duration);
  let motion = planMotion(0, 0, 0, 0, duration);
  for (let t = 0; t <= at; t += every) {
    const { top, velocity } = motionAt(motion, t);
    if (top + lead > motion.to) motion = planMotion(top, velocity, top + lead, t, duration);
  }
  return motionAt(motion, at).velocity;
}

describe('holding a key', () => {
  test.each([
    [0.5, 300],
    [2, 300],
    [5, 300],
    [2, 100],
    [2, 600],
  ])('settles at the set speed (%p px/ms, %p ms animations)', (speed, duration) => {
    expect(holdSpeed(speed, duration, 16, 3000)).toBeCloseTo(speed, 1);
  });

  test('holds the same speed at 60 and 120 fps', () => {
    expect(holdSpeed(2, D, 8, 3000)).toBeCloseTo(holdSpeed(2, D, 16, 3000), 1);
  });

  test('a faster speed keeps the target further ahead', () => {
    expect(holdLead(4, D)).toBeGreaterThan(holdLead(2, D));
  });
});

describe('glideTarget', () => {
  test('coasts a third of the distance the speed would cover in `duration`', () => {
    expect(glideTarget(1000, 3, D)).toBe(1000 + D);
    expect(glideTarget(1000, -3, D)).toBe(1000 - D);
  });

  test('the glide eases out from the current speed without overshoot', () => {
    const motion = planMotion(1000, 3, glideTarget(1000, 3, D), 0, D);
    expect(motionAt(motion, 0).velocity).toBe(3);
    expect(isMonotonic(trace(motion))).toBe(true);
  });

  test('at rest it stays put', () => {
    expect(glideTarget(500, 0, D)).toBe(500);
  });
});
