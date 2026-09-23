"use client";

import { useRef, useState } from "react";
import { useAnimate } from "motion/react";
import { AnimatedNumber } from "@juicekit/registry/ui/animated-number";
import { ParticleCanvas } from "@juicekit/registry/ui/particle-canvas";
import type { ParticleCanvasHandle } from "@juicekit/registry/ui/particle-canvas";
import { ShineSweep } from "@juicekit/registry/ui/shine-sweep";
import type { ShineSweepHandle } from "@juicekit/registry/ui/shine-sweep";
import { instant, springs } from "@juicekit/registry/lib/springs";
import { ActionButton } from "@/components/docs/controls";

export function ParticleCanvasPreview({ reducedMotion }: { reducedMotion: boolean }) {
  const particles = useRef<ParticleCanvasHandle>(null);
  return (
    <>
      <div className="relative h-56 w-full max-w-lg overflow-hidden rounded-lg border border-border bg-background">
        <ParticleCanvas ref={particles} reducedMotion={reducedMotion} />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <ActionButton onClick={() => particles.current?.burst({ count: 90 })}>Burst</ActionButton>
        <ActionButton onClick={() => particles.current?.fountain({ y: 210, count: 80 })}>
          Fountain
        </ActionButton>
        <ActionButton
          onClick={() => particles.current?.emit({ count: 60, angle: 0, spread: 25, gravity: 200 })}
        >
          Directional
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => particles.current?.clear()}>
          Clear
        </ActionButton>
      </div>
    </>
  );
}

export function AnimatedNumberPreview({ reducedMotion }: { reducedMotion: boolean }) {
  const [score, setScore] = useState(1280);
  return (
    <>
      <div className="text-6xl font-bold tabular-nums">
        <AnimatedNumber value={score} reducedMotion={reducedMotion} />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <ActionButton onClick={() => setScore((value) => value + 137)}>+137</ActionButton>
        <ActionButton onClick={() => setScore((value) => value + 4821)}>+4,821</ActionButton>
        <ActionButton onClick={() => setScore((value) => Math.max(0, value - 970))}>
          −970
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => setScore(0)}>
          Zero
        </ActionButton>
      </div>
    </>
  );
}

export function ShineSweepPreview({ reducedMotion }: { reducedMotion: boolean }) {
  const shine = useRef<ShineSweepHandle>(null);
  const [loop, setLoop] = useState(false);
  return (
    <>
      <ShineSweep
        ref={shine}
        active={loop}
        loop={loop}
        reducedMotion={reducedMotion}
        className="rounded-xl"
      >
        <div className="rounded-xl bg-primary px-8 py-6 text-xl font-semibold text-primary-foreground">
          Rare drop
        </div>
      </ShineSweep>
      <div className="flex flex-wrap justify-center gap-2">
        <ActionButton onClick={() => void shine.current?.play()}>Sweep once</ActionButton>
        <ActionButton variant="secondary" onClick={() => setLoop((value) => !value)}>
          {loop ? "Stop looping" : "Loop"}
        </ActionButton>
      </div>
    </>
  );
}

const PRESETS = [
  ["snappy", springs.snappy],
  ["bouncy", springs.bouncy],
  ["gentle", springs.gentle],
  ["instant", instant],
] as const;

export function SpringsPreview({ reducedMotion }: { reducedMotion: boolean }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [away, setAway] = useState(false);

  const run = () => {
    const next = !away;
    setAway(next);
    for (const [name, transition] of PRESETS) {
      const dot = scope.current?.querySelector<HTMLElement>(`[data-spring="${name}"]`);
      if (dot) void animate(dot, { x: next ? "12rem" : 0 }, reducedMotion ? instant : transition);
    }
  };

  return (
    <div ref={scope} className="flex flex-col items-center gap-6">
      <div className="flex flex-col gap-3">
        {PRESETS.map(([name]) => (
          <div key={name} className="flex items-center gap-4">
            <span className="w-16 font-mono text-xs text-muted-foreground">{name}</span>
            <div className="relative h-6 w-56 rounded-full bg-muted">
              <div
                data-spring={name}
                className="absolute top-1 left-1 size-4 rounded-full bg-primary will-change-transform"
              />
            </div>
          </div>
        ))}
      </div>
      <ActionButton onClick={run}>{away ? "Send back" : "Send across"}</ActionButton>
    </div>
  );
}
