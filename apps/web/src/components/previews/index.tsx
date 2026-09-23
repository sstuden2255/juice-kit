"use client";

import type { ReactNode } from "react";
import { PreviewStage } from "@/components/docs/preview-stage";
import { AchievementUnlockPreview } from "./achievement-unlock";
import { LevelUpPreview } from "./level-up";
import {
  AnimatedNumberPreview,
  ParticleCanvasPreview,
  ShineSweepPreview,
  SpringsPreview,
} from "./primitives";
import { XPBarPreview } from "./xp-bar";

type Controls = { reducedMotion: boolean };
type Preview = { render: (controls: Controls) => ReactNode; tone?: "default" | "dark" };

/**
 * One live preview per registry item. `particle-engine` reuses the canvas preview because the
 * canvas component is how you drive the engine in React.
 */
const PREVIEWS: Record<string, Preview> = {
  "juice-springs": { render: (controls) => <SpringsPreview {...controls} /> },
  "particle-engine": {
    render: (controls) => <ParticleCanvasPreview {...controls} />,
    tone: "dark",
  },
  "particle-canvas": {
    render: (controls) => <ParticleCanvasPreview {...controls} />,
    tone: "dark",
  },
  "animated-number": { render: (controls) => <AnimatedNumberPreview {...controls} /> },
  "shine-sweep": { render: (controls) => <ShineSweepPreview {...controls} />, tone: "dark" },
  "xp-bar": { render: (controls) => <XPBarPreview {...controls} /> },
  "achievement-unlock": {
    render: (controls) => <AchievementUnlockPreview {...controls} />,
    tone: "dark",
  },
  "level-up": { render: (controls) => <LevelUpPreview {...controls} />, tone: "dark" },
};

export function ComponentPreview({ name }: { name: string }) {
  const preview = PREVIEWS[name];
  if (!preview) return null;
  return <PreviewStage tone={preview.tone}>{preview.render}</PreviewStage>;
}
