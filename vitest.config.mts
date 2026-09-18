import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every workspace package that ships a vitest.config.mts becomes a project.
    projects: ["apps/*/vitest.config.mts", "packages/*/vitest.config.mts"],
    passWithNoTests: true,
  },
});
