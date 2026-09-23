import Link from "next/link";
import { CopyButton } from "@/components/docs/copy-button";
import { HeroShowcase } from "@/components/site/hero-showcase";
import { SiteHeader } from "@/components/site/site-header";
import { getRegistry, getRegistryBaseUrl } from "@/lib/registry";
import { DARK_SURFACE } from "@/lib/theme";

const PITCH = [
  {
    title: "Moments, not states",
    body: "Other kits render a streak count. JuiceKit renders the streak extending — choreographed sequences with spring physics, staggered reveals, and particles that land when the number does.",
  },
  {
    title: "60fps or it doesn't ship",
    body: "Transform and opacity only, so every sequence stays on the compositor. Particles draw on a canvas with a pooled engine, never as DOM nodes.",
  },
  {
    title: "Dignified reduced motion",
    body: "Every component swaps its sequence for an instant state change and a short fade when the OS asks, or when you pass the prop. It is a documented feature, not an afterthought.",
  },
  {
    title: "You own the code",
    body: "Install with the shadcn CLI and the source lands in your repo. Retune the springs, restyle the badge, delete what you do not need. Motion is the only runtime dependency.",
  },
];

export default function HomePage() {
  const registry = getRegistry();
  const baseUrl = getRegistryBaseUrl();
  const install = `npx shadcn@latest add ${baseUrl}/r/level-up.json`;
  const flagship = registry.items.filter((item) => item.categories.includes("components"));
  const primitives = registry.items.filter((item) => item.categories.includes("primitives"));

  return (
    <>
      <SiteHeader repository={registry.homepage} />
      <main>
        <section
          style={DARK_SURFACE}
          className="bg-background text-foreground [background-image:radial-gradient(ellipse_at_top,oklch(0.3_0.09_290)_0%,transparent_60%)]"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-20 sm:px-6 sm:py-28">
            <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                Gamification components that actually feel like something.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground text-pretty">
                Level-ups, achievement unlocks and XP bars for React, built as choreographed
                sequences instead of static badges. Copy the source into your app and tune it.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/docs"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Get started
                </Link>
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <code className="font-mono text-[13px]">{install}</code>
                  <CopyButton value={install} />
                </div>
              </div>
            </div>
            <HeroShowcase />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight">Why it exists</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {PITCH.map((point) => (
              <div
                key={point.title}
                className="flex flex-col gap-2 rounded-xl border border-border p-6"
              >
                <h3 className="text-lg font-semibold">{point.title}</h3>
                <p className="text-muted-foreground">{point.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Components</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {flagship.map((item) => (
              <li key={item.name}>
                <Link
                  href={`/docs/${item.name}`}
                  className="flex h-full flex-col gap-2 rounded-xl border border-border p-6 transition-colors hover:bg-accent/40"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-sm text-muted-foreground">{item.description}</span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-16 text-3xl font-semibold tracking-tight">Primitives</h2>
          <p className="mt-2 text-muted-foreground">
            The building blocks the flagship sequences are made of. Install them on their own if you
            would rather choreograph your own moment.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {primitives.map((item) => (
              <li key={item.name}>
                <Link
                  href={`/docs/${item.name}`}
                  className="flex h-full flex-col gap-2 rounded-xl border border-border p-6 transition-colors hover:bg-accent/40"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-sm text-muted-foreground">{item.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>MIT licensed. Built with Next.js, Tailwind v4 and Motion.</p>
            <a
              href={registry.homepage}
              rel="noreferrer noopener"
              target="_blank"
              className="transition-colors hover:text-foreground"
            >
              Source on GitHub
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
