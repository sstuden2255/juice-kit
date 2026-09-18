import { defineProject } from "vitest/config";

export default defineProject({
  // Vite 8 resolves tsconfig `paths` natively (replaces vite-tsconfig-paths).
  resolve: { tsconfigPaths: true },
  // The Oxc transform already reads tsconfig `jsx: react-jsx`; this pins the automatic runtime
  // even if that option ever changes.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    name: "web",
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
