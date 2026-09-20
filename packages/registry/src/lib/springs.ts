import type { Transition } from "motion/react";

/** Spring presets shared by JuiceKit components. All animate transform/opacity only. */
export const springs = {
  /** Fast settle with a small overshoot: fills, counters, badges landing. */
  snappy: { type: "spring", stiffness: 520, damping: 32, mass: 1 } satisfies Transition,
  /** Visible overshoot: level-up numbers, celebratory scale punches. */
  bouncy: { type: "spring", stiffness: 380, damping: 14, mass: 0.9 } satisfies Transition,
  /** No overshoot: reveals that should feel calm. */
  gentle: { type: "spring", stiffness: 180, damping: 26, mass: 1 } satisfies Transition,
} as const;

/** Zero-duration transition used when reduced motion is on. */
export const instant = { duration: 0 } satisfies Transition;
