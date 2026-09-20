"use client";

import { LevelUp } from "@juicekit/registry/ui/level-up";
import type { LevelUpHandle } from "@juicekit/registry/ui/level-up";
import { useRef, useState } from "react";
import { DemoButton, DemoShell } from "@/components/demo/demo-shell";

export default function LevelUpDemoPage() {
  const moment = useRef<LevelUpHandle>(null);
  const [level, setLevel] = useState(12);
  const [screenFlash, setScreenFlash] = useState(false);
  const [playing, setPlaying] = useState(false);

  return (
    <DemoShell
      title="LevelUp"
      description="Radial glow burst, the old number flips away and the new one punches in on a spring, particles erupt, and optionally the whole screen flashes."
    >
      {({ reducedMotion }) => (
        <>
          <LevelUp
            ref={moment}
            level={level}
            screenFlash={screenFlash}
            reducedMotion={reducedMotion}
            onComplete={() => setPlaying(false)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={screenFlash}
                onChange={(e) => setScreenFlash(e.target.checked)}
              />
              Screen flash
            </label>
            <DemoButton
              disabled={playing}
              onClick={() => {
                setPlaying(true);
                moment.current?.reset();
                void moment.current?.play().then(() => setLevel((n) => n + 1));
              }}
            >
              Level up
            </DemoButton>
            <DemoButton onClick={() => moment.current?.reset()}>Reset</DemoButton>
          </div>
        </>
      )}
    </DemoShell>
  );
}
