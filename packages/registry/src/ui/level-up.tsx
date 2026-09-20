"use client";

import { useAnimate } from "motion/react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useReducedMotionPreference } from "../hooks/use-reduced-motion";
import { springs } from "../lib/springs";
import { cn } from "../lib/utils";
import { ParticleCanvas } from "./particle-canvas";
import type { ParticleCanvasEmitOptions, ParticleCanvasHandle } from "./particle-canvas";

export interface LevelUpHandle {
  /** Run the level-up sequence. Resolves when it finishes; a running sequence is reused. */
  play(): Promise<void>;
  /** Return to the resting state (showing `from`) instantly. */
  reset(): void;
}

export interface LevelUpProps extends ComponentPropsWithoutRef<"div"> {
  /** The level being reached. */
  level: number;
  /** The level being left. Default `level - 1`. */
  from?: number;
  /** Controlled: play the sequence when it turns true, reset when false. */
  open?: boolean;
  /** Uncontrolled: play once on mount. Default false. */
  defaultOpen?: boolean;
  /** Text above the number. Default "Level up". */
  label?: ReactNode;
  /** Flash the whole viewport at the moment of the flip. Default false. */
  screenFlash?: boolean;
  /** Particle options, or `false` to disable particles. */
  particles?: ParticleCanvasEmitOptions | false;
  /** Force reduced motion on or off; defaults to the user's OS preference. */
  reducedMotion?: boolean;
  /** Called when the sequence finishes. */
  onComplete?: () => void;
}

/**
 * Level-up moment: a radial glow bursts outward, the old level flips away and the new one
 * flips in with a spring punch, particles erupt, and (optionally) the screen flashes.
 */
export const LevelUp = forwardRef<LevelUpHandle, LevelUpProps>(function LevelUp(
  {
    level,
    from,
    open,
    defaultOpen = false,
    label = "Level up",
    screenFlash = false,
    particles,
    reducedMotion,
    onComplete,
    className,
    ...rest
  },
  ref,
) {
  const previous = from ?? level - 1;
  const reduced = useReducedMotionPreference(reducedMotion);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const canvas = useRef<ParticleCanvasHandle>(null);
  const running = useRef<Promise<void> | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const particlesRef = useRef(particles);
  particlesRef.current = particles;
  const levelRef = useRef(level);
  levelRef.current = level;

  const play = useCallback((): Promise<void> => {
    if (running.current) return running.current;
    const root = scope.current;
    if (!root) return Promise.resolve();
    const glow = root.querySelector<HTMLElement>("[data-glow]");
    const oldNumber = root.querySelector<HTMLElement>("[data-old]");
    const newNumber = root.querySelector<HTMLElement>("[data-new]");
    const caption = root.querySelector<HTMLElement>("[data-caption]");
    const flash = root.querySelector<HTMLElement>("[data-flash]");
    const run = (async () => {
      setAnnouncement("");
      if (reducedRef.current) {
        await Promise.all([
          oldNumber && animate(oldNumber, { opacity: 0 }, { duration: 0.25 }),
          newNumber && animate(newNumber, { opacity: 1 }, { duration: 0.25 }),
          caption && animate(caption, { opacity: 1 }, { duration: 0.25 }),
          glow && animate(glow, { opacity: [0, 0.35, 0] }, { duration: 0.6 }),
        ]);
        return;
      }
      const glowBurst =
        glow &&
        animate(
          glow,
          { scale: [0.2, 1.8], opacity: [0, 0.85, 0] },
          { duration: 0.9, ease: "easeOut" },
        );
      if (oldNumber) {
        await animate(
          oldNumber,
          { rotateX: -90, opacity: 0, y: -12 },
          { duration: 0.22, ease: "easeIn" },
        );
      }
      const emit = particlesRef.current;
      if (emit !== false) {
        canvas.current?.fountain({ count: 70, ...emit });
        canvas.current?.burst({ count: 40, speed: [150, 420], ...emit });
      }
      await Promise.all([
        newNumber && animate(newNumber, { rotateX: 0, opacity: 1, scale: 1 }, springs.bouncy),
        caption && animate(caption, { opacity: 1, y: 0 }, { ...springs.gentle, delay: 0.1 }),
        flash && animate(flash, { opacity: [0, 0.75, 0] }, { duration: 0.4, ease: "easeOut" }),
        glowBurst,
      ]);
    })();
    running.current = run;
    return run.finally(() => {
      running.current = null;
      setAnnouncement(`Level ${levelRef.current}`);
      onCompleteRef.current?.();
    });
  }, [animate, scope]);

  const reset = useCallback(() => {
    const root = scope.current;
    if (!root) return;
    const glow = root.querySelector<HTMLElement>("[data-glow]");
    const oldNumber = root.querySelector<HTMLElement>("[data-old]");
    const newNumber = root.querySelector<HTMLElement>("[data-new]");
    const caption = root.querySelector<HTMLElement>("[data-caption]");
    const flash = root.querySelector<HTMLElement>("[data-flash]");
    const instant = { duration: 0 };
    if (glow) animate(glow, { scale: 0.2, opacity: 0 }, instant);
    if (oldNumber) animate(oldNumber, { rotateX: 0, opacity: 1, y: 0 }, instant);
    if (newNumber) animate(newNumber, { rotateX: 90, opacity: 0, scale: 1.3 }, instant);
    if (caption) animate(caption, { opacity: 0, y: 6 }, instant);
    if (flash) animate(flash, { opacity: 0 }, instant);
    canvas.current?.clear();
    setAnnouncement("");
  }, [animate, scope]);

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset]);

  // defaultOpen only matters on mount, so it is read through a ref.
  const defaultOpenRef = useRef(defaultOpen);
  useEffect(() => {
    if (open === undefined) {
      if (defaultOpenRef.current) void play();
      return;
    }
    if (open) void play();
    else reset();
  }, [open, play, reset]);

  return (
    <div
      ref={scope}
      data-reduced-motion={reduced ? "true" : undefined}
      className={cn(
        "relative inline-flex min-w-48 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl p-8 text-foreground",
        className,
      )}
      {...rest}
    >
      <ParticleCanvas ref={canvas} reducedMotion={reducedMotion} />
      <div
        data-glow=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle, var(--juice-glow, var(--primary)) 0%, transparent 65%)",
          transform: "scale(0.2)",
          opacity: 0,
        }}
      />
      <div
        data-caption=""
        className="relative text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase will-change-transform"
        style={{ opacity: 0, transform: "translateY(6px)" }}
      >
        {label}
      </div>
      <div
        className="relative text-6xl font-bold tabular-nums"
        style={{ perspective: "600px", height: "1.15em", minWidth: "1.5em" }}
        aria-hidden="true"
      >
        <span
          data-old=""
          className="absolute inset-0 flex items-center justify-center will-change-transform"
          style={{ transformOrigin: "50% 50% -0.4em" }}
        >
          {previous}
        </span>
        <span
          data-new=""
          className="absolute inset-0 flex items-center justify-center will-change-transform"
          style={{
            transformOrigin: "50% 50% -0.4em",
            transform: "rotateX(90deg) scale(1.3)",
            opacity: 0,
          }}
        >
          {level}
        </span>
      </div>
      {screenFlash && (
        <div
          data-flash=""
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 bg-white"
          style={{ opacity: 0 }}
        />
      )}
      <span className="sr-only">
        Level {previous} to level {level}
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
});
