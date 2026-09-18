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
};

export default nextConfig;
