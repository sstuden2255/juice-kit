"use client";

import { stagger, useAnimate } from "motion/react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { useReducedMotionPreference } from "../hooks/use-reduced-motion";
import { springs } from "../lib/springs";
import { cn } from "../lib/utils";
import { ParticleCanvas } from "./particle-canvas";
import type { ParticleCanvasEmitOptions, ParticleCanvasHandle } from "./particle-canvas";
import { ShineSweep } from "./shine-sweep";
import type { ShineSweepHandle } from "./shine-sweep";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface AchievementUnlockHandle {
  /** Run the unlock sequence. Resolves when it finishes; a running sequence is reused. */
  play(): Promise<void>;
  /** Return to the hidden state instantly. */
  reset(): void;
}

export interface AchievementUnlockProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Colors the badge, rarity label and particles. Default "common". */
  rarity?: AchievementRarity;
  /** Badge content. Default: a star. */
  icon?: ReactNode;
  /** Controlled: play the sequence when it turns true, hide when false. */
  open?: boolean;
  /** Uncontrolled: play once on mount. Default false. */
  defaultOpen?: boolean;
  /** Particle burst options, or `false` to disable particles. */
  particles?: ParticleCanvasEmitOptions | false;
  /** Force reduced motion on or off; defaults to the user's OS preference. */
  reducedMotion?: boolean;
  /** Called when the sequence finishes. */
  onComplete?: () => void;
}

/**
 * Rarity palette. Each entry is a CSS variable with a fallback so consumers can retheme with
 * `--juice-rarity-<name>` without touching the component.
 */
const RARITY: Record<AchievementRarity, { color: string; particles: readonly string[] }> = {
  common: {
    color: "var(--juice-rarity-common, oklch(0.62 0.02 260))",
    particles: ["#c7ccd6", "#e6e9ef", "#9aa3b2"],
  },
  rare: {
    color: "var(--juice-rarity-rare, oklch(0.62 0.17 250))",
    particles: ["#4cc9f0", "#3b82f6", "#a5d8ff", "#dbeafe"],
  },
  epic: {
    color: "var(--juice-rarity-epic, oklch(0.6 0.22 300))",
    particles: ["#7c5cff", "#c084fc", "#e9d5ff", "#ff5c8a"],
  },
  legendary: {
    color: "var(--juice-rarity-legendary, oklch(0.78 0.17 80))",
    particles: ["#f5c542", "#ffd97a", "#ff9f1c", "#fff3bf", "#ff7a59"],
  },
};

const HIDDEN_BADGE = { scale: 0.2, y: -40, opacity: 0 };
const HIDDEN_TEXT = { opacity: 0, y: 8 };

/**
 * Achievement toast: the badge drops in on a spring, a shine sweeps across it, particles burst,
 * then the title, rarity and description reveal in a stagger. `onComplete` and the `play()`
 * promise settle when the last reveal ends.
 */
export const AchievementUnlock = forwardRef<AchievementUnlockHandle, AchievementUnlockProps>(
  function AchievementUnlock(
    {
      title,
      description,
      rarity = "common",
      icon,
      open,
      defaultOpen = false,
      particles,
      reducedMotion,
      onComplete,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const reduced = useReducedMotionPreference(reducedMotion);
    const [scope, animate] = useAnimate<HTMLDivElement>();
    const shine = useRef<ShineSweepHandle>(null);
    const canvas = useRef<ParticleCanvasHandle>(null);
    const running = useRef<Promise<void> | null>(null);
    const [revealed, setRevealed] = useState(open ?? defaultOpen);
    const [announcement, setAnnouncement] = useState("");
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;
    const reducedRef = useRef(reduced);
    reducedRef.current = reduced;
    const particlesRef = useRef(particles);
    particlesRef.current = particles;
    const rarityRef = useRef(rarity);
    rarityRef.current = rarity;

    const play = useCallback((): Promise<void> => {
      if (running.current) return running.current;
      const root = scope.current;
      if (!root) return Promise.resolve();
      const badge = root.querySelector<HTMLElement>("[data-badge]");
      const texts = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
      const run = (async () => {
        setRevealed(true);
        setAnnouncement("");
        if (reducedRef.current) {
          await Promise.all([
            badge && animate(badge, { scale: 1, y: 0, opacity: 1 }, { duration: 0.25 }),
            ...texts.map((el) => animate(el, { opacity: 1, y: 0 }, { duration: 0.25 })),
          ]);
        } else {
          if (badge) await animate(badge, { scale: 1, y: 0, opacity: 1 }, springs.bouncy);
          const emit = particlesRef.current;
          if (emit !== false) {
            canvas.current?.burst({
              count: rarityRef.current === "legendary" ? 90 : 50,
              colors: RARITY[rarityRef.current].particles,
              shapes: ["circle", "square", "star"],
              ...emit,
            });
          }
          await Promise.all([
            shine.current?.play(),
            texts.length > 0
              ? animate(
                  texts,
                  { opacity: 1, y: 0 },
                  { ...springs.gentle, delay: stagger(0.12, { startDelay: 0.15 }) },
                )
              : undefined,
          ]);
        }
      })();
      running.current = run;
      return run.finally(() => {
        running.current = null;
        setAnnouncement("Achievement unlocked");
        onCompleteRef.current?.();
      });
    }, [animate, scope]);

    const reset = useCallback(() => {
      const root = scope.current;
      if (!root) return;
      const badge = root.querySelector<HTMLElement>("[data-badge]");
      const texts = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
      if (badge) animate(badge, HIDDEN_BADGE, { duration: 0 });
      if (texts.length > 0) animate(texts, HIDDEN_TEXT, { duration: 0 });
      canvas.current?.clear();
      setRevealed(false);
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

    const palette = RARITY[rarity];
    const rootStyle = { "--juice-rarity": palette.color, ...style } as CSSProperties;

    return (
      <div
        ref={scope}
        data-rarity={rarity}
        data-reduced-motion={reduced ? "true" : undefined}
        aria-hidden={revealed ? undefined : "true"}
        className={cn(
          "relative inline-flex w-72 flex-col items-center gap-3 overflow-hidden rounded-xl border border-border bg-background p-6 text-center text-foreground",
          className,
        )}
        style={rootStyle}
        {...rest}
      >
        <ParticleCanvas ref={canvas} reducedMotion={reducedMotion} />
        <ShineSweep ref={shine} reducedMotion={reducedMotion} className="rounded-full">
          <div
            data-badge=""
            className="flex size-20 items-center justify-center rounded-full text-3xl text-white shadow-lg will-change-transform"
            style={{
              backgroundColor: "var(--juice-rarity)",
              transform: "translateY(-40px) scale(0.2)",
              opacity: 0,
            }}
          >
            {icon ?? (
              <span aria-hidden="true" className="leading-none">
                ★
              </span>
            )}
          </div>
        </ShineSweep>
        <div className="flex flex-col items-center gap-1">
          <div
            data-reveal=""
            className="text-lg font-semibold will-change-transform"
            style={{ opacity: 0, transform: "translateY(8px)" }}
          >
            {title}
          </div>
          <div
            data-reveal=""
            className="text-xs font-semibold tracking-[0.2em] uppercase will-change-transform"
            style={{ color: "var(--juice-rarity)", opacity: 0, transform: "translateY(8px)" }}
          >
            {rarity}
          </div>
          {description !== undefined && (
            <div
              data-reveal=""
              className="text-sm text-muted-foreground will-change-transform"
              style={{ opacity: 0, transform: "translateY(8px)" }}
            >
              {description}
            </div>
          )}
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          {announcement}
        </span>
      </div>
    );
  },
);
