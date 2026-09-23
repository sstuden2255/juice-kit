"use client";

import { useRef, useState } from "react";
import { LevelUp } from "@juicekit/registry/ui/level-up";
import type { LevelUpHandle } from "@juicekit/registry/ui/level-up";
import { ActionButton, ToggleField } from "@/components/docs/controls";

export function LevelUpPreview({ reducedMotion }: { reducedMotion: boolean }) {
  const moment = useRef<LevelUpHandle>(null);
  const [level, setLevel] = useState(12);
  const [screenFlash, setScreenFlash] = useState(false);
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <LevelUp
        ref={moment}
        level={level}
        screenFlash={screenFlash}
        reducedMotion={reducedMotion}
        onComplete={() => setPlaying(false)}
      />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ToggleField checked={screenFlash} onChange={setScreenFlash}>
          Screen flash
        </ToggleField>
        <ActionButton
          disabled={playing}
          onClick={() => {
            setPlaying(true);
            moment.current?.reset();
            void moment.current?.play().then(() => setLevel((n) => n + 1));
          }}
        >
          Level up
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => moment.current?.reset()}>
          Reset
        </ActionButton>
      </div>
    </>
  );
}
