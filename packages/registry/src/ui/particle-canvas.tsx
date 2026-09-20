"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { useReducedMotionPreference } from "../hooks/use-reduced-motion";
import { ParticleEngine } from "../lib/particle-engine";
import type { EmitOptions, ParticleEngineOptions } from "../lib/particle-engine";
import { cn } from "../lib/utils";

/** Emit options for the canvas: `x`/`y` default to the canvas center. */
export type ParticleCanvasEmitOptions = Omit<EmitOptions, "x" | "y"> & {
  x?: number;
  y?: number;
};

export interface ParticleCanvasHandle {
  /** Omnidirectional burst from `x`/`y` (default: center). */
  burst(options?: ParticleCanvasEmitOptions): void;
  /** Upward fountain from `x`/`y` (default: center). */
  fountain(options?: ParticleCanvasEmitOptions): void;
  /** Directional emission. */
  emit(options?: ParticleCanvasEmitOptions): void;
  /** Remove every particle immediately. */
  clear(): void;
  /** Alive particle count (0 when reduced motion is on or before mount). */
  readonly activeCount: number;
}

export interface ParticleCanvasProps extends Omit<
  ComponentPropsWithoutRef<"canvas">,
  "width" | "height"
> {
  /** Upper bound on simultaneously alive particles. Default 600. */
  maxParticles?: number;
  /** Force reduced motion on or off; defaults to the user's OS preference. */
  reducedMotion?: boolean;
  /** Engine options for tests or custom frame loops. */
  engineOptions?: Omit<ParticleEngineOptions, "maxParticles">;
}

/**
 * A pointer-transparent canvas that fills its positioned parent and exposes an imperative
 * handle for bursts. Particles are pure decoration, so under reduced motion every method is
 * a no-op: the surrounding component still changes state, just without confetti.
 */
export const ParticleCanvas = forwardRef<ParticleCanvasHandle, ParticleCanvasProps>(
  function ParticleCanvas({ className, maxParticles, reducedMotion, engineOptions, ...rest }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<ParticleEngine | null>(null);
    const reduced = useReducedMotionPreference(reducedMotion);
    const reducedRef = useRef(reduced);
    reducedRef.current = reduced;

    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const engine = new ParticleEngine(canvas, { ...engineOptions, maxParticles });
      engineRef.current = engine;

      const rect = canvas.getBoundingClientRect();
      engine.resize(rect.width, rect.height);

      let observer: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry) return;
          const { width, height } = entry.contentRect;
          engine.resize(width, height);
        });
        observer.observe(canvas);
      }

      return () => {
        observer?.disconnect();
        engine.dispose();
        engineRef.current = null;
      };
      // engineOptions and maxParticles are construction-time settings; changing them
      // recreates the engine, which is intended.
    }, [engineOptions, maxParticles]);

    useImperativeHandle(ref, () => {
      const withOrigin = (options: ParticleCanvasEmitOptions | undefined): EmitOptions | null => {
        const engine = engineRef.current;
        if (!engine || reducedRef.current) return null;
        const { width, height } = engine.size;
        return { ...options, x: options?.x ?? width / 2, y: options?.y ?? height / 2 };
      };
      return {
        burst(options) {
          const resolved = withOrigin(options);
          if (resolved) engineRef.current?.burst(resolved);
        },
        fountain(options) {
          const resolved = withOrigin(options);
          if (resolved) engineRef.current?.fountain(resolved);
        },
        emit(options) {
          const resolved = withOrigin(options);
          if (resolved) engineRef.current?.emit(resolved);
        },
        clear() {
          engineRef.current?.clear();
        },
        get activeCount() {
          return engineRef.current?.activeCount ?? 0;
        },
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-reduced-motion={reduced ? "true" : undefined}
        className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
        {...rest}
      />
    );
  },
);
