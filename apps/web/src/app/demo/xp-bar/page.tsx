"use client";

import { XPBar } from "@juicekit/registry/ui/xp-bar";
import type { XPBarHandle, XPBarLevelUpEvent } from "@juicekit/registry/ui/xp-bar";
import { useRef, useState } from "react";
import { DemoButton, DemoShell } from "@/components/demo/demo-shell";

export default function XPBarDemoPage() {
  const bar = useRef<XPBarHandle>(null);
  const [events, setEvents] = useState<XPBarLevelUpEvent[]>([]);
  const [epoch, setEpoch] = useState(0);

  return (
    <DemoShell
      title="XPBar"
      description="Uncontrolled here: gain XP through the imperative handle, watch the fill spring past the boundary, pulse, and carry the overflow into the next level."
    >
      {({ reducedMotion }) => (
        <>
          <div className="w-full max-w-md">
            <XPBar
              key={epoch}
              ref={bar}
              defaultValue={35}
              max={100}
              reducedMotion={reducedMotion}
              onLevelUp={(event) => setEvents((prev) => [event, ...prev])}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <DemoButton onClick={() => bar.current?.gain(10)}>+10 XP</DemoButton>
            <DemoButton onClick={() => bar.current?.gain(45)}>+45 XP</DemoButton>
            <DemoButton onClick={() => bar.current?.gain(230)}>+230 XP</DemoButton>
            <DemoButton
              onClick={() => {
                setEvents([]);
                setEpoch((n) => n + 1);
              }}
            >
              Reset
            </DemoButton>
          </div>
          <ol className="min-h-6 text-sm text-muted-foreground">
            {events.map((event, index) => (
              <li key={`${events.length - index}`}>
                Level up → {event.level} (overflow {event.overflow} XP)
              </li>
            ))}
          </ol>
        </>
      )}
    </DemoShell>
  );
}
