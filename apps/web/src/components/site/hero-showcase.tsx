"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AchievementUnlock } from "@juicekit/registry/ui/achievement-unlock";
import type { AchievementUnlockHandle } from "@juicekit/registry/ui/achievement-unlock";
import { LevelUp } from "@juicekit/registry/ui/level-up";
import type { LevelUpHandle } from "@juicekit/registry/ui/level-up";
import { XPBar } from "@juicekit/registry/ui/xp-bar";
import type { XPBarHandle } from "@juicekit/registry/ui/xp-bar";
import { ActionButton } from "@/components/docs/controls";

/** Resolves after `ms`, or immediately if the sequence was abandoned. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/**
 * The landing-page moment: XP crosses a level boundary, the level flips, the achievement lands.
 *
 * It fires once when scrolled into view and replays on demand, which is the point of the page —
 * SPEC asks the hero to be the pitch. Each component still honours reduced motion on its own,
 * so this choreography degrades with them rather than needing its own fallback.
 */
export function HeroShowcase() {
  const bar = useRef<XPBarHandle>(null);
  const levelUp = useRef<LevelUpHandle>(null);
  const achievement = useRef<AchievementUnlockHandle>(null);
  const stage = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [playing, setPlaying] = useState(false);
  const [epoch, setEpoch] = useState(0);

  const play = useCallback(async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const { signal } = controller;

    setPlaying(true);
    levelUp.current?.reset();
    achievement.current?.reset();
    setEpoch((value) => value + 1);

    // The bar starts at 70/100, so this crosses the boundary and carries the overflow.
    await sleep(350, signal);
    bar.current?.gain(55);
    await sleep(950, signal);
    if (!signal.aborted) await levelUp.current?.play();
    await sleep(200, signal);
    if (!signal.aborted) await achievement.current?.play();
    if (!signal.aborted) setPlaying(false);
  }, []);

  useEffect(() => {
    const element = stage.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      void play();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void play();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [play]);

  useEffect(() => () => abort.current?.abort(), []);

  return (
    <div ref={stage} className="flex w-full flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex items-center justify-center rounded-2xl border border-border bg-background/40 p-4">
          <LevelUp ref={levelUp} level={13} label="Level up" />
        </div>
        <div className="flex items-center justify-center rounded-2xl border border-border bg-background/40 p-4">
          <AchievementUnlock
            ref={achievement}
            title="Night Owl"
            description="Play a match after midnight"
            rarity="legendary"
            icon={<span aria-hidden="true">🦉</span>}
            className="border-transparent bg-transparent"
          />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-background/40 p-6">
        <XPBar key={epoch} ref={bar} defaultValue={70} max={100} defaultLevel={12} />
      </div>
      <div className="flex justify-center">
        <ActionButton onClick={() => void play()} disabled={playing}>
          {playing ? "Playing…" : "Replay the moment"}
        </ActionButton>
      </div>
    </div>
  );
}
