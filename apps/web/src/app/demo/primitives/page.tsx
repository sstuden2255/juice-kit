"use client";

import { AnimatedNumber } from "@juicekit/registry/ui/animated-number";
import { ParticleCanvas } from "@juicekit/registry/ui/particle-canvas";
import type { ParticleCanvasHandle } from "@juicekit/registry/ui/particle-canvas";
import { ShineSweep } from "@juicekit/registry/ui/shine-sweep";
import type { ShineSweepHandle } from "@juicekit/registry/ui/shine-sweep";
import { useRef, useState } from "react";
import { DemoButton, DemoShell } from "@/components/demo/demo-shell";

export default function PrimitivesDemoPage() {
  const particles = useRef<ParticleCanvasHandle>(null);
  const shine = useRef<ShineSweepHandle>(null);
  const [score, setScore] = useState(1280);

  return (
    <DemoShell
      title="Primitives"
      description="The building blocks the flagship components are choreographed from: a canvas particle system, an odometer number, and a masked shine sweep."
    >
      {({ reducedMotion }) => (
        <div className="grid w-full gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-background">
              <ParticleCanvas ref={particles} reducedMotion={reducedMotion} />
            </div>
            <div className="flex gap-2">
              <DemoButton onClick={() => particles.current?.burst({ count: 80 })}>Burst</DemoButton>
              <DemoButton onClick={() => particles.current?.fountain({ y: 150 })}>
                Fountain
              </DemoButton>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-40 w-full items-center justify-center rounded-lg border border-border bg-background text-5xl font-bold">
              <AnimatedNumber value={score} reducedMotion={reducedMotion} />
            </div>
            <div className="flex gap-2">
              <DemoButton onClick={() => setScore((s) => s + Math.floor(Math.random() * 900) + 50)}>
                Add points
              </DemoButton>
              <DemoButton onClick={() => setScore(0)}>Zero</DemoButton>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-40 w-full items-center justify-center rounded-lg border border-border bg-background">
              <ShineSweep ref={shine} reducedMotion={reducedMotion} className="rounded-lg">
                <div className="rounded-lg bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground">
                  Rare drop
                </div>
              </ShineSweep>
            </div>
            <DemoButton onClick={() => void shine.current?.play()}>Shine</DemoButton>
          </div>
        </div>
      )}
    </DemoShell>
  );
}
