import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

export default defineConfig([
  // eslint-config-next's own ignores are root-relative (".next/**"), so they do not cover
  // apps/web/.next. Declare workspace-wide ignores here. node_modules and .git are ignored
  // by ESLint itself.
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/dist/**",
    "**/coverage/**",
    "**/.vitest/**",
    "**/next-env.d.ts",
    "apps/web/drizzle/**",
    "apps/web/public/**",
  ]),

  // apps/web: the full Next.js ruleset (react, react-hooks, jsx-a11y, import, @next/next)
  // plus typescript-eslint recommended. `extends` AND-combines our `files` with each
  // extended entry's own `files`, which a plain spread would overwrite.
  {
    name: "juicekit/web",
    files: ["apps/web/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    extends: [nextVitals, nextTs],
    settings: {
      next: { rootDir: "apps/web/" },
      // eslint-config-next sets react.version to "detect"; eslint-plugin-react 7.37.x's
      // detection calls context.getFilename(), which ESLint 10 removed, and crashes.
      // An explicit version skips detection. Remove once eslint-config-next ships an
      // ESLint 10 compatible release (vercel/next.js#91710).
      react: { version: "19.3" },
    },
  },

  // packages/registry: type-aware linting through the TypeScript project service, which
  // picks up packages/registry/tsconfig.json automatically.
  {
    name: "juicekit/registry",
    files: ["packages/registry/**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Root-level config files and scripts.
  {
    name: "juicekit/root",
    files: ["*.{mjs,mts}", "scripts/**/*.mjs"],
    extends: [tseslint.configs.recommended],
  },

  // Must be last: disables formatting rules that conflict with Prettier.
  prettier,
]);
