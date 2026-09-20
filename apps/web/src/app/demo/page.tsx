import Link from "next/link";

const DEMOS = [
  {
    href: "/demo/xp-bar",
    name: "XPBar",
    blurb: "Spring fill, gain flash, odometer label, level rollover.",
  },
  {
    href: "/demo/achievement-unlock",
    name: "AchievementUnlock",
    blurb: "Badge drop, shine sweep, particle burst, staggered reveal.",
  },
  {
    href: "/demo/level-up",
    name: "LevelUp",
    blurb: "Radial glow, number flip, particle fountain, optional screen flash.",
  },
  {
    href: "/demo/primitives",
    name: "Primitives",
    blurb: "ParticleCanvas, AnimatedNumber and ShineSweep on their own.",
  },
] as const;

export default function DemoIndexPage() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Component demos</h1>
      <ul className="grid gap-4 sm:grid-cols-2">
        {DEMOS.map((demo) => (
          <li key={demo.href}>
            <Link
              href={demo.href}
              className="block rounded-xl border border-border bg-background p-5 transition-colors hover:bg-accent"
            >
              <span className="block font-semibold">{demo.name}</span>
              <span className="block text-sm text-muted-foreground">{demo.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
