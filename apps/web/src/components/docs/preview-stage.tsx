"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@juicekit/registry/lib/utils";
import { DARK_SURFACE } from "@/lib/theme";
import { ToggleField } from "./controls";

export interface PreviewStageProps {
  /** Receives the stage's reduced-motion override, which mirrors the `reducedMotion` prop. */
  children: (controls: { reducedMotion: boolean }) => ReactNode;
  /** Dark stages suit the celebration sequences; light ones suit bars and numbers. */
  tone?: "default" | "dark";
  className?: string;
}

/**
 * The frame every live preview sits in: a stage plus the reduced-motion switch.
 *
 * The switch is deliberately part of the frame rather than a per-component extra. SPEC makes
 * reduced motion a first-class feature, so every preview on the site can be checked against it
 * without anyone changing an OS setting.
 */
export function PreviewStage({ children, tone = "default", className }: PreviewStageProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div
        style={tone === "dark" ? DARK_SURFACE : undefined}
        className={cn(
          "flex min-h-72 flex-col items-center justify-center gap-6 rounded-xl border border-border p-8",
          tone === "dark" ? "bg-background text-foreground" : "bg-muted/40",
          className,
        )}
      >
        {children({ reducedMotion })}
      </div>
      <div className="flex justify-end">
        <ToggleField checked={reducedMotion} onChange={setReducedMotion}>
          Force reduced motion
        </ToggleField>
      </div>
    </div>
  );
}
