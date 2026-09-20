import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-semibold tracking-tight">JuiceKit</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Animated gamification components for React. Phase 1 scaffold: Next.js, Tailwind v4, Drizzle,
        Redis, Docker, and CI.
      </p>
      <Link
        href="/demo"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Open the component demos
      </Link>
      <code className="rounded-md border border-border bg-muted px-2 py-1 text-sm">
        GET /api/health
      </code>
    </main>
  );
}
