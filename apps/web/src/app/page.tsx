export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-semibold tracking-tight">JuiceKit</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Animated gamification components for React. Phase 1 scaffold: Next.js, Tailwind v4, Drizzle,
        Redis, Docker, and CI.
      </p>
      <code className="rounded-md border border-border bg-muted px-2 py-1 text-sm">
        GET /api/health
      </code>
    </main>
  );
}
