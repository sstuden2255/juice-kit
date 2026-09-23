/**
 * Hand-written usage snippets, one per registry item.
 *
 * Prop tables are generated from the types, but a good first example is a judgement call about
 * what someone actually wants to do with the component, so these stay written by hand. Import
 * paths match what `shadcn add` installs.
 */
export const USAGE_EXAMPLES: Record<string, string> = {
  "juice-utils": `import { cn } from "@/lib/juice-utils";

export function Card({ active, className }: { active?: boolean; className?: string }) {
  return <div className={cn("rounded-lg border p-4", active && "ring-2 ring-primary", className)} />;
}`,

  "juice-springs": `import { useAnimate } from "motion/react";
import { instant, springs } from "@/lib/juice-springs";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

const [scope, animate] = useAnimate();
const reduced = useReducedMotionPreference();

// Every JuiceKit sequence picks a preset, then falls back to \`instant\` under reduced motion.
await animate(scope.current, { scale: 1 }, reduced ? instant : springs.bouncy);`,

  "particle-engine": `import { ParticleEngine } from "@/lib/particle-engine";

const engine = new ParticleEngine(canvas, { maxParticles: 400 });
engine.resize(canvas.clientWidth, canvas.clientHeight);

// Omnidirectional burst from a point.
engine.burst({ x: 160, y: 120, count: 80, colors: ["#f5c542", "#ff9f1c"] });

// Upward fountain, and a narrow directional spray.
engine.fountain({ x: 160, y: 240, count: 60 });
engine.emit({ x: 0, y: 120, angle: 0, spread: 20, speed: [300, 700] });

engine.dispose(); // on unmount: cancels the frame loop and drops the pool`,

  "use-reduced-motion-preference": `"use client";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

export function Badge({ reducedMotion }: { reducedMotion?: boolean }) {
  // Passing the prop wins; passing nothing follows (prefers-reduced-motion: reduce).
  const reduced = useReducedMotionPreference(reducedMotion);
  return <div data-reduced={reduced}>{reduced ? "Unlocked" : "Unlocking…"}</div>;
}`,

  "particle-canvas": `"use client";

import { useRef } from "react";
import { ParticleCanvas } from "@/components/ui/particle-canvas";
import type { ParticleCanvasHandle } from "@/components/ui/particle-canvas";

export function Celebration() {
  const particles = useRef<ParticleCanvasHandle>(null);

  // The canvas fills its positioned parent, so give that parent \`relative\` and a size.
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-lg">
      <ParticleCanvas ref={particles} />
      <button onClick={() => particles.current?.burst({ count: 80 })}>Celebrate</button>
    </div>
  );
}`,

  "animated-number": `import { AnimatedNumber } from "@/components/ui/animated-number";

// Plain count-up: the digits roll, screen readers hear the final value.
<AnimatedNumber value={score} className="text-5xl font-bold" />

// Any Intl.NumberFormat options work, including currency and compact notation.
<AnimatedNumber value={revenue} format={{ style: "currency", currency: "USD" }} />
<AnimatedNumber value={views} format={{ notation: "compact" }} locale="en-GB" />`,

  "shine-sweep": `import { ShineSweep } from "@/components/ui/shine-sweep";

// Sweep continuously while a drop is on screen.
<ShineSweep active loop className="rounded-xl">
  <div className="rounded-xl bg-primary px-6 py-4 font-semibold">Rare drop</div>
</ShineSweep>

// Or sweep once, on demand.
const shine = useRef<ShineSweepHandle>(null);
<ShineSweep ref={shine}>{children}</ShineSweep>;
await shine.current?.play();`,

  "xp-bar": `"use client";

import { useRef } from "react";
import { XPBar } from "@/components/ui/xp-bar";
import type { XPBarHandle } from "@/components/ui/xp-bar";

// Uncontrolled: the bar owns the XP and carries overflow into the next level itself.
const bar = useRef<XPBarHandle>(null);

<XPBar
  ref={bar}
  defaultValue={35}
  max={100}
  onLevelUp={({ level, overflow }) => console.log(\`reached \${level}, \${overflow} XP over\`)}
/>;

bar.current?.gain(45);

// Controlled: you own value and level, and set them when onLevelUp fires.
<XPBar value={xp} level={level} max={100} onChange={setXp} />`,

  "achievement-unlock": `"use client";

import { useRef } from "react";
import { AchievementUnlock } from "@/components/ui/achievement-unlock";
import type { AchievementUnlockHandle } from "@/components/ui/achievement-unlock";

const toast = useRef<AchievementUnlockHandle>(null);

<AchievementUnlock
  ref={toast}
  title="Night Owl"
  description="Play a match after midnight"
  rarity="legendary"
  icon={<span aria-hidden>🦉</span>}
/>;

// play() resolves when the last reveal settles, so sequences can be chained.
await toast.current?.play();

// Or drive it from state instead of a ref.
<AchievementUnlock open={unlocked} title="Night Owl" rarity="epic" />`,

  "level-up": `"use client";

import { useRef } from "react";
import { LevelUp } from "@/components/ui/level-up";
import type { LevelUpHandle } from "@/components/ui/level-up";

const moment = useRef<LevelUpHandle>(null);

<LevelUp ref={moment} level={13} screenFlash onComplete={() => setOpen(false)} />;

await moment.current?.play();
moment.current?.reset(); // back to showing \`from\`, instantly`,
};
