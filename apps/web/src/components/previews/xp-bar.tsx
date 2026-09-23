"use client";

import { useRef, useState } from "react";
import { XPBar } from "@juicekit/registry/ui/xp-bar";
import type { XPBarHandle, XPBarLevelUpEvent } from "@juicekit/registry/ui/xp-bar";
import { ActionButton } from "@/components/docs/controls";

export function XPBarPreview({ reducedMotion }: { reducedMotion: boolean }) {
  const bar = useRef<XPBarHandle>(null);
  const [events, setEvents] = useState<XPBarLevelUpEvent[]>([]);
  const [epoch, setEpoch] = useState(0);

  return (
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
      <div className="flex flex-wrap justify-center gap-2">
        <ActionButton onClick={() => bar.current?.gain(10)}>+10 XP</ActionButton>
        <ActionButton onClick={() => bar.current?.gain(45)}>+45 XP</ActionButton>
        <ActionButton onClick={() => bar.current?.gain(230)}>+230 XP</ActionButton>
        <ActionButton
          variant="secondary"
          onClick={() => {
            setEvents([]);
            setEpoch((n) => n + 1);
          }}
        >
          Reset
        </ActionButton>
      </div>
      <ol className="min-h-6 text-sm text-muted-foreground">
        {events.map((event, index) => (
          <li key={`${events.length - index}`}>
            Level up → {event.level} (overflow {event.overflow} XP)
          </li>
        ))}
      </ol>
    </>
  );
}
