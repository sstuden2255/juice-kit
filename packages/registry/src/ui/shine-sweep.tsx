"use client";

import { useAnimate } from "motion/react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { useReducedMotionPreference } from "../hooks/use-reduced-motion";
import { cn } from "../lib/utils";

export interface ShineSweepHandle {
  /** Run one sweep. Resolves when it finishes (or immediately if one is already running). */
  play(): Promise<void>;
}

export interface ShineSweepProps extends ComponentPropsWithoutRef<"span"> {
  /** Run a sweep whenever this turns true. With `loop`, keeps sweeping while true. */
  active?: boolean;
  /** Repeat while `active`. Default false. */
  loop?: boolean;
  /** Seconds per sweep. Default 1.1. */
  duration?: number;
  /** Seconds to wait before each sweep. Default 0. */
  delay?: number;
  /** Gradient angle in degrees. Default 105. */
  angle?: number;
  /** Highlight color. Default `var(--juice-shine, rgba(255, 255, 255, 0.7))`. */
  color?: string;
  /** Force reduced motion on or off; defaults to the user's OS preference. */
  reducedMotion?: boolean;
  /** Called after each completed sweep. */
  onComplete?: () => void;
}

/**
 * Masked highlight sweep over its children. The highlight strip only animates `transform`
 * (and opacity under reduced motion), so it stays on the compositor.
 */
export const ShineSweep = forwardRef<ShineSweepHandle, ShineSweepProps>(function ShineSweep(
  {
    active = false,
    loop = false,
    duration = 1.1,
    delay = 0,
    angle = 105,
    color = "var(--juice-shine, rgba(255, 255, 255, 0.7))",
    reducedMotion,
    onComplete,
    className,
    children,
    ...rest
  },
  ref,
) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduced = useReducedMotionPreference(reducedMotion);
  const running = useRef<Promise<void> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const play = useCallback((): Promise<void> => {
    if (running.current) return running.current;
    const strip = scope.current?.querySelector<HTMLElement>("[data-shine-strip]");
    if (!strip) return Promise.resolve();
    const run = (async () => {
      if (reducedRef.current) {
        await animate(strip, { opacity: [0, 1, 0] }, { duration: 0.35, delay, ease: "easeInOut" });
      } else {
        await animate(strip, { x: ["-110%", "110%"] }, { duration, delay, ease: [0.4, 0, 0.2, 1] });
      }
    })();
    running.current = run;
    return run.finally(() => {
      running.current = null;
      onCompleteRef.current?.();
    });
  }, [animate, scope, duration, delay]);

  useImperativeHandle(ref, () => ({ play }), [play]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const cycle = async () => {
      do {
        await play();
      } while (loop && !cancelled);
    };
    void cycle();
    return () => {
      cancelled = true;
    };
  }, [active, loop, play]);

  const stripStyle: CSSProperties = reduced
    ? { background: color, opacity: 0 }
    : {
        background: `linear-gradient(${angle}deg, transparent 25%, ${color} 50%, transparent 75%)`,
        transform: "translateX(-110%)",
      };

  return (
    <span
      ref={scope}
      data-reduced-motion={reduced ? "true" : undefined}
      className={cn("relative inline-block overflow-hidden", className)}
      {...rest}
    >
      {children}
      <span
        data-shine-strip=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={stripStyle}
      />
    </span>
  );
});
