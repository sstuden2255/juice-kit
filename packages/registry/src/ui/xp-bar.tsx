"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import type { Transition } from "motion/react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useReducedMotionPreference } from "../hooks/use-reduced-motion";
import { springs } from "../lib/springs";
import { cn } from "../lib/utils";
import { AnimatedNumber } from "./animated-number";

export interface XPBarLevelUpEvent {
  /** The level just reached. */
  level: number;
  /** XP carried into the new level. */
  overflow: number;
}

export interface XPBarState {
  value: number;
  max: number;
  level: number;
}

export interface XPBarHandle {
  /** Add XP. Uncontrolled bars update themselves; controlled bars call `onChange`. */
  gain(amount: number): void;
  /** Current state as displayed. */
  getState(): XPBarState;
}

export interface XPBarProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  /** XP within the current level (controlled). */
  value?: number;
  /** Initial XP within the current level (uncontrolled). Default 0. */
  defaultValue?: number;
  /** XP needed to complete the current level. */
  max: number;
  /** Current level (controlled). */
  level?: number;
  /** Initial level (uncontrolled). Default 1. */
  defaultLevel?: number;
  /** Controlled mode: receives the new XP after `gain()`. */
  onChange?: (value: number) => void;
  /**
   * Fires once per level boundary crossed, after the fill and flash finish. Uncontrolled bars
   * then carry the overflow into the next level; controlled bars expect the parent to set
   * `value` to `overflow` and bump `level`.
   */
  onLevelUp?: (event: XPBarLevelUpEvent) => void;
  /** Custom label row. `null` hides it. Default: level and an animated XP count. */
  label?: ReactNode | ((state: XPBarState) => ReactNode) | null;
  /** Spring for the fill. Default: snappy with a small overshoot. */
  transition?: Transition;
  /** Force reduced motion on or off; defaults to the user's OS preference. */
  reducedMotion?: boolean;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Level progress bar: spring-filled, with a flash on the gained chunk, an odometer XP label,
 * and a level-boundary rollover (fill to full, pulse, carry overflow into the next level).
 */
export const XPBar = forwardRef<XPBarHandle, XPBarProps>(function XPBar(
  {
    value: valueProp,
    defaultValue = 0,
    max,
    level: levelProp,
    defaultLevel = 1,
    onChange,
    onLevelUp,
    label,
    transition,
    reducedMotion,
    className,
    ...rest
  },
  ref,
) {
  const reduced = useReducedMotionPreference(reducedMotion);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalLevel, setInternalLevel] = useState(defaultLevel);
  const valueControlled = valueProp !== undefined;
  const levelControlled = levelProp !== undefined;
  const value = valueControlled ? valueProp : internalValue;
  const level = levelControlled ? levelProp : internalLevel;
  const safeMax = max > 0 ? max : 1;

  const fill = useMotionValue(clamp01(value / safeMax));
  const chunkStart = useMotionValue(0);
  const chunkScale = useMotionValue(0);
  const chunkOpacity = useMotionValue(0);
  const punch = useMotionValue(1);
  const flashOpacity = useMotionValue(0);
  const chunkX = useTransform(chunkStart, (start) => `${start * 100}%`);

  const [announcement, setAnnouncement] = useState("");
  const stateRef = useRef<XPBarState>({ value, max: safeMax, level });
  stateRef.current = { value, max: safeMax, level };
  const callbacks = useRef({ onChange, onLevelUp });
  callbacks.current = { onChange, onLevelUp };
  const rolloverFor = useRef<number | null>(null);
  const pendingReset = useRef(false);
  const sequence = useRef(0);

  useEffect(() => {
    const spring = transition ?? springs.snappy;
    const token = (sequence.current += 1);
    const isCurrent = () => token === sequence.current;

    if (value >= safeMax) {
      if (rolloverFor.current === value) return;
      rolloverFor.current = value;
      const overflow = value - safeMax;
      const nextLevel = level + 1;
      const run = async () => {
        if (reduced) {
          fill.jump(1);
          await animate(flashOpacity, [0.6, 0], { duration: 0.3 });
        } else {
          await animate(fill, 1, spring);
          if (!isCurrent()) return;
          await Promise.all([
            animate(punch, [1, 1.04, 1], { duration: 0.45, ease: "easeOut" }),
            animate(flashOpacity, [0, 0.9, 0], { duration: 0.5, ease: "easeOut" }),
          ]);
        }
        if (!isCurrent()) return;
        pendingReset.current = true;
        setAnnouncement(`Level ${nextLevel}`);
        callbacks.current.onLevelUp?.({ level: nextLevel, overflow });
        if (!valueControlled) setInternalValue(overflow);
        if (!levelControlled) setInternalLevel(nextLevel);
      };
      void run();
      return;
    }

    rolloverFor.current = null;
    const target = clamp01(value / safeMax);
    if (pendingReset.current) {
      pendingReset.current = false;
      fill.jump(0);
    }
    const previous = fill.get();
    if (target === previous) return;

    if (reduced) {
      fill.jump(target);
      if (target > previous) {
        chunkStart.jump(previous);
        chunkScale.jump(target - previous);
        void animate(chunkOpacity, [0.6, 0], { duration: 0.3 });
      }
      return;
    }

    const controls = [animate(fill, target, spring)];
    if (target > previous) {
      chunkStart.jump(previous);
      chunkScale.jump(target - previous);
      controls.push(animate(chunkOpacity, [0.85, 0], { duration: 0.7, ease: "easeOut" }));
    }
    return () => controls.forEach((c) => c.stop());
  }, [
    value,
    safeMax,
    level,
    reduced,
    transition,
    valueControlled,
    levelControlled,
    fill,
    chunkStart,
    chunkScale,
    chunkOpacity,
    punch,
    flashOpacity,
  ]);

  const gain = useCallback(
    (amount: number) => {
      const next = stateRef.current.value + amount;
      if (valueControlled) callbacks.current.onChange?.(next);
      else setInternalValue(next);
    },
    [valueControlled],
  );

  useImperativeHandle(ref, () => ({ gain, getState: () => stateRef.current }), [gain]);

  const state: XPBarState = { value, max: safeMax, level };
  const labelNode =
    label === null ? null : label === undefined ? (
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">Level {level}</span>
        <span className="text-muted-foreground">
          <AnimatedNumber value={Math.min(value, safeMax)} reducedMotion={reducedMotion} /> /{" "}
          {safeMax} XP
        </span>
      </div>
    ) : typeof label === "function" ? (
      label(state)
    ) : (
      label
    );

  return (
    <div
      data-reduced-motion={reduced ? "true" : undefined}
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...rest}
    >
      {labelNode}
      <motion.div
        role="progressbar"
        aria-label={`Level ${level} progress`}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.min(value, safeMax)}
        className="relative h-3 w-full overflow-hidden rounded-full border border-border bg-muted"
        style={{ scale: punch }}
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary will-change-transform"
          style={{ scaleX: fill }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary-foreground will-change-transform"
          style={{ x: chunkX, scaleX: chunkScale, opacity: chunkOpacity }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-primary-foreground"
          style={{ opacity: flashOpacity }}
        />
      </motion.div>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
});
