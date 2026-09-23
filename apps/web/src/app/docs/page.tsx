import Link from "next/link";
import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import { getRegistry, getRegistryBaseUrl, getRegistryByCategory } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Getting started",
  description: "Install JuiceKit components into your own project with the shadcn CLI.",
};

const CATEGORY_LABELS: Record<string, string> = {
  primitives: "Primitives",
  components: "Components",
};

export default function DocsIndexPage() {
  const registry = getRegistry();
  const baseUrl = getRegistryBaseUrl();

  return (
    <article className="flex max-w-3xl flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Getting started</h1>
        <p className="text-lg text-muted-foreground">
          JuiceKit is a registry, not a package. Components install as source into your repo, so you
          can read them, change the timings, and keep them.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Requirements</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
          <li>React 18.2 or 19, in a project the shadcn CLI can write to.</li>
          <li>
            Tailwind CSS v4. Components style themselves with the standard shadcn tokens (
            <code className="font-mono">--background</code>,{" "}
            <code className="font-mono">--primary</code>, and friends).
          </li>
          <li>
            <a
              href="https://motion.dev"
              rel="noreferrer noopener"
              target="_blank"
              className="underline underline-offset-4"
            >
              Motion
            </a>{" "}
            — the only runtime dependency any JuiceKit component has. The CLI installs it for you.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Install a component</h2>
        <p className="text-muted-foreground">
          Every item has its own URL. The CLI pulls in the primitives it depends on, so adding a
          flagship component is a single command.
        </p>
        <CodeBlock code={`npx shadcn@latest add ${baseUrl}/r/level-up.json`} />
        <p className="text-muted-foreground">
          That writes <code className="font-mono">components/ui/level-up.tsx</code> plus the
          particle canvas, the spring presets, the reduced-motion hook and the class-name helper it
          uses, then installs Motion.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Where files land</h2>
        <p className="text-muted-foreground">
          Paths follow the aliases in your <code className="font-mono">components.json</code>. Two
          helpers ship under a <code className="font-mono">juice-</code> prefix so installing
          JuiceKit can never overwrite your own <code className="font-mono">lib/utils.ts</code>.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Item
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Installs to
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Import
                </th>
              </tr>
            </thead>
            <tbody>
              {registry.items.map((item) => (
                <tr key={item.name} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link href={`/docs/${item.name}`} className="underline underline-offset-4">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px] text-muted-foreground">
                    {item.meta.target}
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px] text-muted-foreground">
                    {item.meta.alias}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Reduced motion</h2>
        <p className="text-muted-foreground">
          Every component reads <code className="font-mono">(prefers-reduced-motion: reduce)</code>{" "}
          and swaps its sequence for an instant state change with a short fade. Particles stop
          emitting entirely — the state still changes, just without confetti. A{" "}
          <code className="font-mono">reducedMotion</code> prop overrides the media query in either
          direction, which is what the switch under every preview on this site does.
        </p>
        <CodeBlock
          code={`// Follows the OS preference.
<LevelUp level={13} />

// Forced on, e.g. from your own accessibility setting.
<LevelUp level={13} reducedMotion />`}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Controlled, uncontrolled, or both</h2>
        <p className="text-muted-foreground">
          Components that own a moment expose a ref handle —{" "}
          <code className="font-mono">play()</code>, <code className="font-mono">reset()</code>,{" "}
          <code className="font-mono">gain()</code> — and a state prop that does the same thing. Use
          whichever fits: a ref when a game event fires the sequence, state when your store already
          knows.
        </p>
        <CodeBlock
          code={`const toast = useRef<AchievementUnlockHandle>(null);
await toast.current?.play();       // imperative

<AchievementUnlock open={unlocked} /> // state-driven`}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Theming</h2>
        <p className="text-muted-foreground">
          Colours come from CSS variables with sensible fallbacks, so a component picks up your
          theme without configuration and can be retinted by setting a variable anywhere up the
          tree. Items that define their own tokens list them on their docs page.
        </p>
        <CodeBlock
          code={`:root {
  --juice-rarity-legendary: oklch(0.78 0.17 80);
  --juice-shine: rgba(255, 255, 255, 0.7);
  --juice-glow: var(--primary);
}`}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Browse</h2>
        {getRegistryByCategory().map((group) => (
          <div key={group.category} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              {CATEGORY_LABELS[group.category] ?? group.category}
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href={`/docs/${item.name}`}
                    className="flex h-full flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/40"
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </article>
  );
}
