"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export interface DemoShellProps {
  title: string;
  description: string;
  children: (controls: { reducedMotion: boolean }) => ReactNode;
}

/** Page chrome for component demos: heading, a reduced-motion override, and a stage. */
export function DemoShell({ title, description, children }: DemoShellProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-muted-foreground">{description}</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
          />
          Force reduced motion
        </label>
      </header>
      <div className="flex min-h-80 flex-col items-center justify-center gap-6 rounded-xl border border-border bg-muted/40 p-8">
        {children({ reducedMotion })}
      </div>
    </section>
  );
}

export function DemoButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
