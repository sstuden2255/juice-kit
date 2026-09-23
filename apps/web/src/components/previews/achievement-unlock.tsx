"use client";

import { useRef, useState } from "react";
import { AchievementUnlock } from "@juicekit/registry/ui/achievement-unlock";
import type {
  AchievementRarity,
  AchievementUnlockHandle,
} from "@juicekit/registry/ui/achievement-unlock";
import { ActionButton } from "@/components/docs/controls";

const RARITIES: AchievementRarity[] = ["common", "rare", "epic", "legendary"];

export function AchievementUnlockPreview({ reducedMotion }: { reducedMotion: boolean }) {
  const toast = useRef<AchievementUnlockHandle>(null);
  const [rarity, setRarity] = useState<AchievementRarity>("legendary");
  const [playing, setPlaying] = useState(false);

  return (
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
      <div className="flex flex-wrap items-center justify-center gap-2">
        <select
          aria-label="Rarity"
          value={rarity}
          onChange={(event) => setRarity(event.target.value as AchievementRarity)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        >
          {RARITIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ActionButton
          disabled={playing}
          onClick={() => {
            setPlaying(true);
            toast.current?.reset();
            void toast.current?.play();
          }}
        >
          Unlock
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => toast.current?.reset()}>
          Reset
        </ActionButton>
      </div>
    </>
  );
}
