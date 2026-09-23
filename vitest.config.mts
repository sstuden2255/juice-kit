import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      // Every workspace package that ships a vitest.config.mts becomes a project.
      "apps/*/vitest.config.mts",
      "packages/*/vitest.config.mts",
      // The registry build is plain Node ESM with no package of its own, so it is declared
      // inline rather than given a config file next to two scripts.
      {
        test: {
          name: "scripts",
          include: ["scripts/**/*.test.mjs"],
          environment: "node",
        },
      },
    ],
  },
});
