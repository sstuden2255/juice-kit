import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production Dockerfile copies .next/standalone; with the tracing root at the repo root the
  // server lands at .next/standalone/apps/web/server.js. This also sets turbopack.root.
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  // `next build` type-checks tsconfig.build.json (no tests); `pnpm typecheck` covers tests.
  typescript: { tsconfigPath: "tsconfig.build.json" },
  // Keep `next dev` from writing AGENTS.md / CLAUDE.md into apps/web on every start.
  agentRules: false,
  // Drop the X-Powered-By: Next.js response header.
  poweredByHeader: false,
  // Phase 2's /demo pages were folded into the docs pages, which carry the same live previews
  // plus props and source. Keep the old links working.
  async redirects() {
    return [
      { source: "/demo", destination: "/docs", permanent: false },
      { source: "/demo/primitives", destination: "/docs", permanent: false },
      { source: "/demo/xp-bar", destination: "/docs/xp-bar", permanent: false },
      {
        source: "/demo/achievement-unlock",
        destination: "/docs/achievement-unlock",
        permanent: false,
      },
      { source: "/demo/level-up", destination: "/docs/level-up", permanent: false },
    ];
  },
};

export default nextConfig;
