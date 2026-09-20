"use client";

import { AchievementUnlock } from "@juicekit/registry/ui/achievement-unlock";
import type {
  AchievementRarity,
  AchievementUnlockHandle,
} from "@juicekit/registry/ui/achievement-unlock";
import { useRef, useState } from "react";
import { DemoButton, DemoShell } from "@/components/demo/demo-shell";

const RARITIES: AchievementRarity[] = ["common", "rare", "epic", "legendary"];

export default function AchievementUnlockDemoPage() {
  const toast = useRef<AchievementUnlockHandle>(null);
  const [rarity, setRarity] = useState<AchievementRarity>("legendary");
  const [playing, setPlaying] = useState(false);

  return (
    <DemoShell
      title="AchievementUnlock"
      description="Badge drops in on a spring, a shine sweeps across it, particles burst, then title, rarity and description reveal in a stagger. play() resolves when the sequence ends."
    >
      {({ reducedMotion }) => (
        <>
          <AchievementUnlock
            ref={toast}
            title="Night Owl"
            description="Play a match after midnight"
            rarity={rarity}
            icon={<span aria-hidden="true">🦉</span>}
            reducedMotion={reducedMotion}
            onComplete={() => setPlaying(false)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rarity}
              onChange={(event) => setRarity(event.target.value as AchievementRarity)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              {RARITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <DemoButton
              disabled={playing}
              onClick={() => {
                setPlaying(true);
                toast.current?.reset();
                void toast.current?.play();
              }}
            >
              Unlock
            </DemoButton>
            <DemoButton onClick={() => toast.current?.reset()}>Reset</DemoButton>
          </div>
        </>
      )}
    </DemoShell>
  );
}
