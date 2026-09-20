/**
 * JuiceKit registry: animation primitives and gamification components for React.
 *
 * Every component animates transform/opacity only, draws particles on a canvas, honours
 * prefers-reduced-motion (or a `reducedMotion` prop), and depends on nothing but Motion.
 * Items are published as shadcn-compatible registry entries in Phase 3.
 */
export const registry = {
  name: "juicekit",
  version: "0.0.0",
} as const;

export type Registry = typeof registry;

export { cn } from "./lib/utils";
export type { ClassValue } from "./lib/utils";
export { springs, instant } from "./lib/springs";
export { ParticleEngine, DEFAULT_PARTICLE_COLORS } from "./lib/particle-engine";
export type { EmitOptions, ParticleEngineOptions, ParticleShape } from "./lib/particle-engine";
export { useReducedMotionPreference } from "./hooks/use-reduced-motion";

export { ParticleCanvas } from "./ui/particle-canvas";
export type {
  ParticleCanvasEmitOptions,
  ParticleCanvasHandle,
  ParticleCanvasProps,
} from "./ui/particle-canvas";
export { AnimatedNumber, odometerPosition } from "./ui/animated-number";
export type { AnimatedNumberProps } from "./ui/animated-number";
export { ShineSweep } from "./ui/shine-sweep";
export type { ShineSweepHandle, ShineSweepProps } from "./ui/shine-sweep";
export { XPBar } from "./ui/xp-bar";
export type { XPBarHandle, XPBarLevelUpEvent, XPBarProps, XPBarState } from "./ui/xp-bar";
export { AchievementUnlock } from "./ui/achievement-unlock";
export type {
  AchievementRarity,
  AchievementUnlockHandle,
  AchievementUnlockProps,
} from "./ui/achievement-unlock";
export { LevelUp } from "./ui/level-up";
export type { LevelUpHandle, LevelUpProps } from "./ui/level-up";
