import Link from "next/link";
import type { ReactNode } from "react";

const DEMOS = [
  { href: "/demo/xp-bar", label: "XPBar" },
  { href: "/demo/achievement-unlock", label: "AchievementUnlock" },
  { href: "/demo/level-up", label: "LevelUp" },
  { href: "/demo/primitives", label: "Primitives" },
] as const;

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6 sm:p-10">
      <nav className="flex flex-wrap items-center gap-4 text-sm">
        <Link href="/" className="font-semibold">
          JuiceKit
        </Link>
        {DEMOS.map((demo) => (
          <Link
            key={demo.href}
            href={demo.href}
            className="text-muted-foreground hover:text-foreground"
          >
            {demo.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
