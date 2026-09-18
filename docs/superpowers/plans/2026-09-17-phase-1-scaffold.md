# Phase 1 Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the JuiceKit monorepo so that lint, typecheck, test, build, and registry validation all pass on a hello-world Next.js page, with Drizzle migrations, a Redis client, a Docker Compose dev environment, and a GitHub Actions workflow in place.

**Architecture:** A pnpm 12 workspace with two packages: `apps/web` (Next.js 16 App Router site, also the Node layer: route handlers, Drizzle/Postgres, ioredis) and `packages/registry` (component source, Phase 2+). Shared tooling (TypeScript, ESLint flat config, Prettier, Vitest projects) lives at the root. Docker Compose bind-mounts the repo and masks `node_modules`/`.next` with named volumes so Linux binaries never collide with macOS ones; a separate multi-stage Dockerfile builds the Next standalone output for production.

**Tech Stack:** TypeScript 6.0.3 (strict), Next.js 16.3.5, React 19.3.0, Tailwind CSS 4.3.3, Motion 13.4.0, Drizzle ORM 0.45.2 + drizzle-kit 0.31.10 + postgres.js 3.4.9, ioredis 6.0.0, Vitest 5.0.1 + Vite 8.3.0 + jsdom 29.1.1 + Testing Library, ESLint 10.10.0 + eslint-config-next 16.3.5 + typescript-eslint 8.70.0, Prettier 3.9.8, pnpm 12.4.2, Docker Compose (Compose Spec), GitHub Actions.

**Spec:** `SPEC.md` (repo root). This plan implements the "Phase 1 — Scaffold & infrastructure" section.

## Global Constraints

Copied from `SPEC.md`:

- Stack (fixed — do not substitute): TypeScript (strict mode) everywhere; Next.js (App Router); Tailwind CSS v4 + Motion (framer-motion); Postgres (via Drizzle ORM); Redis (ioredis); Docker Compose — local dev: `web`, `postgres`, `redis`; plus a production Dockerfile for the web app; GitHub Actions — CI: install → lint → typecheck → test → build → validate registry JSON; Monorepo: pnpm workspaces (`apps/web`, `packages/registry`).
- Verify: `docker compose up` gives a working dev environment; CI green on a hello-world page.
- Work phase by phase; do not start a phase until the previous one builds, tests pass, and you've committed.
- Conventional commits, one branch per phase (this phase: branch `phase-1/scaffold`, already created).
- Ask before adding any dependency not listed here. Resolution for this plan: only packages that are required glue for a listed tool are added (drivers, adapters, type packages, the Vite peer that Vitest 5 requires). Every such package is called out in the README "Dependency notes" section for sign-off. Nothing discretionary (no husky, lint-staged, zod, dotenv, ajv, prettier-plugin-tailwindcss, @eslint/js, @vitejs/plugin-react).
- After each phase, print a short summary of what exists and how to run it.

## Environment facts (verified 2026-09-17)

- Host: macOS arm64, Node v24.14.1 (nvm), corepack 0.34.6. `pnpm` is NOT on PATH. Run every pnpm command as `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm <args>` from the repo root (aliased below as `pnpm`).
- Docker is NOT installed on the host. Docker/Compose files are written from verified facts but cannot be executed here; Task 5 validates syntax only and the README tells the user how to verify.
- No local Postgres or Redis. `drizzle-kit generate` works offline; migrations are not applied locally.
- Git repo exists with `main` (contains SPEC.md) and the working branch `phase-1/scaffold` checked out.

## Decisions locked by research

| Topic          | Decision                                                                                                                           | Why                                                                                                                                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript     | Pin exactly `6.0.3` (never `^`)                                                                                                    | typescript-eslint 8.70.0 supports `<6.1.0`; npm `latest` is 7.0.2 which it rejects. Next 16.3.5 has no upper bound.                                                                                                                                             |
| tsconfig       | `tsconfig.base.json` + per-package `extends`                                                                                       | Next 16 never rewrites a tsconfig that uses `extends`, so we hand-write its required options. TS 6: no `baseUrl` (hard error), `types: []` default so packages opt in to `node`.                                                                                |
| ESLint         | ESLint 10 + eslint-config-next 16.3.5 with `settings.react.version: "19.3"`                                                        | eslint-plugin-react 7.37.x calls `context.getFilename()` (removed in ESLint 10) only when version is `detect`. Verified fix. Fallback if a rule crashes: pin `eslint@9.39.5`.                                                                                   |
| Vitest         | Root `vitest.config.mts` with `test.projects`; `vite@8.3.0` installed explicitly; no `@vitejs/plugin-react`                        | Vite is a required peer of Vitest 5. Vite 8's Oxc transform reads tsconfig `jsx: react-jsx`, so JSX works without the plugin. `.mts` avoids the CJS config-loader warning.                                                                                      |
| jsdom          | `29.1.1`                                                                                                                           | jsdom 30 requires Node ≥24.15; host has 24.14.1. Bump when Node is upgraded.                                                                                                                                                                                    |
| Web app layout | `apps/web/src/{app,db,lib}` with `@/* -> ./src/*`                                                                                  | Keeps app code, DB, and lib code out of the package root.                                                                                                                                                                                                       |
| Package names  | `@juicekit/web`, `@juicekit/registry`                                                                                              | Scoped names used in every `--filter`.                                                                                                                                                                                                                          |
| Next config    | `output: "standalone"`, `outputFileTracingRoot` = repo root, `typescript.tsconfigPath: "tsconfig.build.json"`, `agentRules: false` | Standalone lands at `.next/standalone/apps/web/server.js`; tests are excluded from the build type-check; `next dev` otherwise writes AGENTS.md/CLAUDE.md every start. typedRoutes, reactCompiler, cacheComponents stay OFF.                                     |
| Migrations     | `scripts/migrate.mts` run with `node --env-file-if-exists=.env`                                                                    | `drizzle-kit migrate` exits 1 with no error text on an unreachable DB. The script uses the same `drizzle.__drizzle_migrations` table.                                                                                                                           |
| Postgres       | `postgres:18-alpine`, volume at `/var/lib/postgresql`                                                                              | 18+ images moved the VOLUME; `UNIQUE NULLS NOT DISTINCT` needs ≥15.                                                                                                                                                                                             |
| Redis          | `redis:8-alpine`                                                                                                                   | Current image; AGPLv3 option for an unmodified server container imposes nothing on MIT app code. `redis:7.2-alpine` is the BSD-only alternative.                                                                                                                |
| pnpm settings  | All in `pnpm-workspace.yaml` (`catalog`, `allowBuilds`)                                                                            | pnpm 12 ignores non-auth `.npmrc` keys and errors on unknown workspace keys. `allowBuilds: { esbuild: false, unrs-resolver: false }` is required or install exits 1. pnpm may append `minimumReleaseAgeExclude` entries for pins younger than 24h; commit them. |
| Hot reload     | Bind mount + masked volumes; Turbopack native watcher                                                                              | Compose `develop.watch` is not triggered by plain `docker compose up`. Turbopack polling (`watchOptions.pollIntervalMs`) is broken on ≤16.3.5; the fallback is `NEXT_DEV_ARGS=--webpack WATCHPACK_POLLING=true docker compose up`.                              |

## File Structure

```
juice-kit/
├── .editorconfig                      # editor defaults
├── .gitignore
├── .nvmrc                             # "24" — drives actions/setup-node
├── .prettierrc.json / .prettierignore
├── .dockerignore
├── LICENSE                            # MIT
├── README.md
├── package.json                       # workspace root: shared tooling + orchestration scripts
├── pnpm-workspace.yaml                # packages, catalog, allowBuilds
├── pnpm-lock.yaml                     # generated by Task 1
├── tsconfig.base.json                 # strict shared compiler options
├── tsconfig.json                      # root: type-checks vitest.config.mts + scripts/*.mjs
├── eslint.config.mjs                  # single flat config for the whole repo
├── vitest.config.mts                  # test.projects over apps/* and packages/*
├── Dockerfile                         # production image (Next standalone)
├── compose.yaml                       # dev: web + postgres + redis
├── docker/web.dev.Dockerfile          # dev image: node + pnpm only
├── scripts/validate-registry.mjs      # CI step placeholder (dependency-free)
├── .github/workflows/ci.yml
├── docs/superpowers/plans/…           # this plan
├── apps/web/
│   ├── package.json                   # @juicekit/web
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tsconfig.json                  # extends base; Next include list; @/* alias
│   ├── tsconfig.build.json            # same minus tests; used by `next build`
│   ├── vitest.config.mts / vitest.setup.ts
│   ├── drizzle.config.ts
│   ├── .env.example
│   ├── public/.gitkeep
│   ├── scripts/migrate.mts            # loud programmatic migrator
│   ├── drizzle/                       # generated SQL + meta (committed)
│   └── src/
│       ├── app/globals.css            # Tailwind v4 + theme tokens
│       ├── app/layout.tsx / page.tsx / page.test.tsx
│       ├── app/api/health/route.ts / route.test.ts
│       ├── db/schema.ts / client.ts
│       └── lib/redis.ts
└── packages/registry/
    ├── package.json                   # @juicekit/registry
    ├── tsconfig.json
    ├── vitest.config.mts
    └── src/index.ts / index.test.ts
```

## Conventions for every task

- Run commands from the repo root `/Users/simonstuden/projects/juice-kit` unless a step says otherwise.
- `pnpm` below means `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm`.
- Every commit message ends with these two lines (blank line before them):

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Nwqd3wF2bMWH6GWup8ShSL
```

- Do not commit until the task's verification steps pass. Do not `git add -A` blindly: check `git status` and add the listed files (plus `pnpm-lock.yaml` / `pnpm-workspace.yaml` when pnpm changed them).

---

### Task 1: Workspace root, package manifests, and install

**Files:**

- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`, `.nvmrc`, `.editorconfig`, `.gitignore`, `.prettierrc.json`, `.prettierignore`, `LICENSE`
- Create: `apps/web/package.json`, `packages/registry/package.json`
- Generated: `pnpm-lock.yaml`

**Interfaces:**

- Produces: package names `@juicekit/web` and `@juicekit/registry`; root scripts `dev`, `build`, `start`, `lint`, `lint:fix`, `typecheck`, `test`, `test:watch`, `format`, `format:check`, `validate:registry`, `db:*`; catalog entries `react`, `react-dom`, `@types/react`, `@types/react-dom`, `typescript`, `motion`, `tailwindcss`.
- Later tasks add files only; no further dependency changes are needed.

- [ ] **Step 1: Write `package.json` (root)**

```json
{
  "name": "juicekit",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "packageManager": "pnpm@12.4.2",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "dev": "pnpm --filter @juicekit/web dev",
    "build": "pnpm --filter @juicekit/web build",
    "start": "pnpm --filter @juicekit/web start",
    "lint": "eslint . --max-warnings 0 && prettier --check .",
    "lint:fix": "eslint . --fix && prettier --write .",
    "typecheck": "tsc --noEmit -p tsconfig.json && pnpm -r run typecheck",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "validate:registry": "node scripts/validate-registry.mjs",
    "db:generate": "pnpm --filter @juicekit/web db:generate",
    "db:migrate": "pnpm --filter @juicekit/web db:migrate",
    "db:push": "pnpm --filter @juicekit/web db:push",
    "db:check": "pnpm --filter @juicekit/web db:check",
    "db:studio": "pnpm --filter @juicekit/web db:studio"
  },
  "devDependencies": {
    "@types/node": "24.13.5",
    "eslint": "10.10.0",
    "eslint-config-next": "16.3.5",
    "eslint-config-prettier": "10.1.8",
    "prettier": "3.9.8",
    "typescript": "catalog:",
    "typescript-eslint": "8.70.0",
    "vite": "8.3.0",
    "vitest": "5.0.1"
  }
}
```

- [ ] **Step 2: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - apps/*
  - packages/*

# Versions that must be identical in every workspace package. Reference with "catalog:".
catalog:
  "@types/react": 19.3.0
  "@types/react-dom": 19.3.0
  motion: 13.4.0
  react: 19.3.0
  react-dom: 19.3.0
  tailwindcss: 4.3.3
  typescript: 6.0.3

# pnpm 11+ refuses to run dependency install scripts until each one is decided here
# (strictDepBuilds). esbuild (via drizzle-kit) and unrs-resolver (via eslint-config-next)
# ship prebuilt platform binaries as optionalDependencies, so their scripts stay off.
allowBuilds:
  esbuild: false
  unrs-resolver: false
```

- [ ] **Step 3: Write `tsconfig.base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "es2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": []
  }
}
```

- [ ] **Step 4: Write `tsconfig.json` (root, for root-level config/scripts only)**

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"],
    "allowJs": true,
    "checkJs": true
  },
  "include": ["vitest.config.mts", "scripts/**/*.mjs"]
}
```

- [ ] **Step 5: Write `.nvmrc`, `.editorconfig`, `.gitignore`, `.prettierrc.json`, `.prettierignore`, `LICENSE`**

`.nvmrc`:

```
24
```

`.editorconfig`:

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

`.gitignore`:

```
# dependencies
node_modules/
.pnp
.pnp.*

# next.js
.next/
out/
next-env.d.ts

# build / test output
build/
dist/
coverage/
.vitest/
*.tsbuildinfo

# env files: commit only the examples
.env*
!.env.example

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# misc
.DS_Store
*.pem
.vercel
.turbo
```

`.prettierrc.json`:

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "printWidth": 100,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "endOfLine": "lf"
}
```

`.prettierignore`:

```
# package manager output (pnpm rewrites pnpm-workspace.yaml during installs)
pnpm-lock.yaml
pnpm-workspace.yaml
node_modules

# build / test output
.next
out
build
dist
coverage
.vitest
next-env.d.ts
*.tsbuildinfo

# generated by drizzle-kit
apps/web/drizzle/

# registry build output (Phase 3)
apps/web/public/r/
```

`LICENSE`:

```
MIT License

Copyright (c) 2026 Simon Studen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 6: Write `apps/web/package.json`**

```json
{
  "name": "@juicekit/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node .next/standalone/apps/web/server.js",
    "typecheck": "next typegen && tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "node --env-file-if-exists=.env scripts/migrate.mts",
    "db:push": "drizzle-kit push",
    "db:check": "drizzle-kit check",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@juicekit/registry": "workspace:*",
    "drizzle-orm": "0.45.2",
    "ioredis": "6.0.0",
    "motion": "catalog:",
    "next": "16.3.5",
    "postgres": "3.4.9",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.3",
    "@testing-library/dom": "10.4.2",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@types/node": "24.13.5",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "drizzle-kit": "0.31.10",
    "jsdom": "29.1.1",
    "tailwindcss": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 7: Write `packages/registry/package.json`**

```json
{
  "name": "@juicekit/registry",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "motion": "^13.0.0",
    "react": "^18.2.0 || ^19.0.0",
    "react-dom": "^18.2.0 || ^19.0.0"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "motion": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 8: Install**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm install`

Expected: exit 0, `pnpm-lock.yaml` created with `lockfileVersion: '9.0'`. Acceptable output: "unmet peer eslint" warnings for eslint-plugin-import / jsx-a11y / react (ESLint 10 is outside their declared ranges, warnings only), and possibly "Added N entries to minimumReleaseAgeExclude in pnpm-workspace.yaml" for pins younger than 24 hours. If the install exits 1 with `ERR_PNPM_IGNORED_BUILDS`, read the listed package names, add each to `allowBuilds` in `pnpm-workspace.yaml` with value `false`, and re-run.

- [ ] **Step 9: Verify the toolchain versions resolve**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm exec tsc --version && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm exec eslint --version && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm exec vitest --version && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm --filter @juicekit/web exec next --version`

Expected: `Version 6.0.3`, `v10.10.0`, `vitest/5.0.1 ...`, `Next.js v16.3.5`.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json tsconfig.json .nvmrc .editorconfig .gitignore .prettierrc.json .prettierignore LICENSE apps/web/package.json packages/registry/package.json
git commit -m "chore: scaffold pnpm workspace with pinned toolchain

Root package.json, pnpm-workspace.yaml (catalog + allowBuilds), shared strict
tsconfig base, Prettier config, and package manifests for @juicekit/web and
@juicekit/registry. TypeScript is pinned to 6.0.3 because typescript-eslint 8.70
does not support 7.x.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Nwqd3wF2bMWH6GWup8ShSL"
```

---

### Task 2: ESLint, Vitest harness, and the registry package skeleton

**Files:**

- Create: `eslint.config.mjs`, `vitest.config.mts`
- Create: `packages/registry/tsconfig.json`, `packages/registry/vitest.config.mts`, `packages/registry/src/index.ts`, `packages/registry/src/index.test.ts`

**Interfaces:**

- Consumes: root devDependencies from Task 1.
- Produces: `registry` const exported from `@juicekit/registry` (`{ name: "juicekit", version: "0.0.0" }`); Vitest project names `registry` (this task) and `web` (Task 3).

- [ ] **Step 1: Write `packages/registry/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 2: Write the failing test `packages/registry/src/index.test.ts`**

```ts
import { expect, test } from "vitest";
import { registry } from "./index";

test("exposes the registry identity", () => {
  expect(registry).toEqual({ name: "juicekit", version: "0.0.0" });
});
```

- [ ] **Step 3: Write `packages/registry/vitest.config.mts`**

```ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "registry",
    environment: "node",
  },
});
```

- [ ] **Step 4: Write `vitest.config.mts` (root)**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every workspace package that ships a vitest.config.mts becomes a project.
    projects: ["apps/*/vitest.config.mts", "packages/*/vitest.config.mts"],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm test`

Expected: FAIL — `Failed to resolve import "./index"` (or "Cannot find module").

- [ ] **Step 6: Write `packages/registry/src/index.ts`**

```ts
/**
 * JuiceKit registry source.
 *
 * Animation primitives and components are added under `src/` in Phase 2 and published as
 * shadcn-compatible registry items in Phase 3. This module exists so the package has a
 * type-checked, tested entry point from day one.
 */
export const registry = {
  name: "juicekit",
  version: "0.0.0",
} as const;

export type Registry = typeof registry;
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm test`

Expected: `✓ |registry| src/index.test.ts` — 1 passed.

- [ ] **Step 8: Write `eslint.config.mjs` (root)**

```js
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
```

- [ ] **Step 9: Run lint and format check**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm exec eslint . --max-warnings 0 && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm exec prettier --check .`

Expected: both exit 0. If ESLint reports `contextOrFilename.getFilename is not a function`, the `react: { version: "19.3" }` setting is missing or misplaced. If Prettier lists files, run `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm format` and re-check (only formatting changes are acceptable).

- [ ] **Step 10: Run the registry typecheck**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm --filter @juicekit/registry typecheck && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm exec tsc --noEmit -p tsconfig.json`

Expected: both exit 0 with no output.

- [ ] **Step 11: Commit**

```bash
git add eslint.config.mjs vitest.config.mts packages/registry/tsconfig.json packages/registry/vitest.config.mts packages/registry/src/index.ts packages/registry/src/index.test.ts
git commit -m "chore: configure eslint, prettier, and vitest across the workspace

Single flat ESLint config (eslint-config-next for apps/web, typed
typescript-eslint for packages/registry) with the settings.react.version
workaround for ESLint 10, root Vitest projects config, and a tested
@juicekit/registry entry point.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Nwqd3wF2bMWH6GWup8ShSL"
```

---

### Task 3: Next.js app with Tailwind v4 and a tested hello-world page

**Files:**

- Create: `apps/web/tsconfig.json`, `apps/web/tsconfig.build.json`, `apps/web/next.config.ts`, `apps/web/postcss.config.mjs`, `apps/web/vitest.config.mts`, `apps/web/vitest.setup.ts`, `apps/web/public/.gitkeep`
- Create: `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/page.test.tsx`

**Interfaces:**

- Consumes: root Vitest projects glob (`apps/*/vitest.config.mts`), ESLint `juicekit/web` block, catalog versions.
- Produces: Vitest project `web` (jsdom, jest-dom matchers, `@/*` alias); the `@/*` path alias mapping to `apps/web/src/*` used by Task 4; CSS tokens `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`, `--muted`, `--muted-foreground`, `--border`, `--ring`, `--radius` exposed as Tailwind utilities (`bg-background`, `text-muted-foreground`, `border-border`, `ring-ring`, `rounded-lg`, ...).

- [ ] **Step 1: Write `apps/web/tsconfig.json`**

Next 16 will not rewrite a tsconfig that uses `extends`, so every Next-required option, the include list, and the plugin are written by hand.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "allowJs": true,
    "incremental": true,
    "types": ["node"],
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Write `apps/web/tsconfig.build.json`**

`next build` type-checks this program (tests excluded); `pnpm typecheck` checks everything including tests.

```json
{
  "extends": "./tsconfig.json",
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.mts"
  ],
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.test.tsx",
    "vitest.config.mts",
    "vitest.setup.ts"
  ]
}
```

- [ ] **Step 3: Write `apps/web/next.config.ts`**

```ts
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
```

- [ ] **Step 4: Write `apps/web/postcss.config.mjs`**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 5: Write `apps/web/src/app/globals.css`**

```css
@import "tailwindcss";

/*
 * Tailwind's automatic source detection starts at process.cwd() (apps/web when started via
 * `pnpm dev`), so registry component sources must be registered explicitly. The path is
 * relative to this file. Explicit @source directories are scanned even when git-ignored.
 */
@source "../../../../packages/registry/src";

/* Class-based dark mode: matches the .dark element and its descendants with zero specificity. */
@custom-variant dark (&:where(.dark, .dark *));

/*
 * Design tokens are plain CSS variables (not @theme) because @theme blocks cannot be nested
 * under selectors or media queries. Values follow shadcn/ui's "neutral" base palette so
 * registry components render correctly in shadcn-based consumer apps.
 */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
  --ring: oklch(0.556 0 0);
}

/* Follow the OS preference until a theme toggle (Phase 3) sets an explicit .light/.dark class. */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --primary: oklch(0.922 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --border: oklch(1 0 0 / 10%);
    --ring: oklch(0.556 0 0);
  }
}

/*
 * Expose the tokens as utilities (bg-background, text-muted-foreground, border-border, ...).
 * `inline` is required: the values are var() references that must resolve where the utility
 * is applied, not once at :root.
 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 6: Write `apps/web/src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "JuiceKit",
  description: "Animated gamification components for React.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Write the failing test `apps/web/src/app/page.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import HomePage from "./page";

test("renders the JuiceKit heading", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1, name: "JuiceKit" })).toBeInTheDocument();
});
```

- [ ] **Step 8: Write `apps/web/vitest.config.mts` and `apps/web/vitest.setup.ts`**

`apps/web/vitest.config.mts`:

```ts
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
```

`apps/web/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Testing Library only auto-registers cleanup when Vitest globals are on; do it explicitly.
afterEach(() => {
  cleanup();
});

// jsdom has no matchMedia. Motion reads it for prefers-reduced-motion, so Phase 2 tests can
// flip `matches` per test via vi.mocked(window.matchMedia).mockImplementation(...).
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
```

- [ ] **Step 9: Run the test to verify it fails**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm test`

Expected: the `web` project fails with `Failed to resolve import "./page"`; the `registry` project still passes.

- [ ] **Step 10: Write `apps/web/src/app/page.tsx` and `apps/web/public/.gitkeep`**

`apps/web/src/app/page.tsx` (synchronous component: Vitest cannot render async Server Components):

```tsx
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
```

`apps/web/public/.gitkeep`: empty file (the production Dockerfile copies `apps/web/public`).

- [ ] **Step 11: Run the test to verify it passes**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm test`

Expected: 2 passed across projects `web` and `registry`.

- [ ] **Step 12: Typecheck, lint, build**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm typecheck && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm lint && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm build`

Expected: all exit 0. `next build` output includes `Running TypeScript` / `Finished TypeScript`, route `○ /` (static), and creates `apps/web/.next/standalone/apps/web/server.js`. Then run `git status --porcelain` and confirm the only untracked/modified paths are the files listed in this task (no rewritten tsconfig, no `apps/web/AGENTS.md`).

- [ ] **Step 13: Verify the standalone layout**

Run: `ls apps/web/.next/standalone/apps/web/server.js apps/web/.next/static >/dev/null && echo standalone-ok`

Expected: `standalone-ok`.

- [ ] **Step 14: Commit**

```bash
git add apps/web/tsconfig.json apps/web/tsconfig.build.json apps/web/next.config.ts apps/web/postcss.config.mjs apps/web/vitest.config.mts apps/web/vitest.setup.ts apps/web/public/.gitkeep apps/web/src/app/globals.css apps/web/src/app/layout.tsx apps/web/src/app/page.tsx apps/web/src/app/page.test.tsx
git commit -m "feat(web): add Next.js 16 app with Tailwind v4 and a tested hello-world page

App Router layout and page, Tailwind v4 CSS-first theme tokens (shadcn-compatible,
light/dark via CSS variables), standalone output with an explicit monorepo tracing
root, and a jsdom Vitest project with Testing Library.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Nwqd3wF2bMWH6GWup8ShSL"
```

---

### Task 4: Drizzle schema and migrations, Redis client, health route

**Files:**

- Create: `apps/web/drizzle.config.ts`, `apps/web/.env.example`, `apps/web/scripts/migrate.mts`
- Create: `apps/web/src/db/schema.ts`, `apps/web/src/db/client.ts`, `apps/web/src/lib/redis.ts`
- Create: `apps/web/src/app/api/health/route.ts`, `apps/web/src/app/api/health/route.test.ts`
- Generated: `apps/web/drizzle/0000_init.sql`, `apps/web/drizzle/meta/_journal.json`, `apps/web/drizzle/meta/0000_snapshot.json`

**Interfaces:**

- Consumes: `@/*` alias from Task 3; scripts `db:*` from Task 1.
- Produces: `getDb(): Db` from `@/db/client` (lazy, HMR-safe singleton; throws `DATABASE_URL is not set`); `getRedis(): Redis` from `@/lib/redis` (lazy singleton; throws `REDIS_URL is not set`); tables `playgroundShares`, `waitlistSignups`, `analyticsDaily` and their `$inferSelect`/`$inferInsert` types from `@/db/schema`; `GET /api/health` returning `{ status: "ok" | "degraded", checks: { postgres, redis } }` with 200/503.

- [ ] **Step 1: Write `apps/web/drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs dotenv at startup: it loads ./.env from the cwd (apps/web) only, never
// .env.local, and never overrides variables already in the environment.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // Must match drizzle({ casing }) in src/db/client.ts so runtime SQL and DDL agree.
  casing: "snake_case",
  dbCredentials: {
    // Only migrate / push / studio / pull connect; generate / check never do.
    url: process.env.DATABASE_URL ?? "postgres://juicekit:juicekit@localhost:5432/juicekit",
  },
  migrations: { table: "__drizzle_migrations", schema: "drizzle" },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 2: Write `apps/web/src/db/schema.ts`**

```ts
import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/** Serialisable playground prop bag; narrowed per component in Phase 5. */
export type PlaygroundProps = Record<string, unknown>;

const createdAt = () => timestamp({ withTimezone: true, mode: "date" }).defaultNow().notNull();

// The third argument must return a FLAT array of builders. Wrapping a builder in an object
// still type-checks (drizzle-orm #6140) but the index is silently dropped, so always compare
// the generated SQL against the constraints declared here.

/** Shareable playground configurations: POST /api/share -> /p/<slug> (Phase 5). */
export const playgroundShares = pgTable(
  "playground_shares",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** nanoid(21) */
    slug: varchar({ length: 21 }).notNull(),
    component: varchar({ length: 64 }).notNull(),
    props: jsonb().$type<PlaygroundProps>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("playground_shares_slug_idx").on(t.slug),
    index("playground_shares_component_idx").on(t.component),
  ],
);

/** Landing-page waitlist (Phase 5). Emails are stored lower-cased; the CHECK enforces it. */
export const waitlistSignups = pgTable(
  "waitlist_signups",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar({ length: 320 }).notNull(),
    source: varchar({ length: 64 }),
    createdAt: createdAt(),
  },
  (t) => [
    unique("waitlist_signups_email_uq").on(t.email),
    check("waitlist_signups_email_lowercase", sql`${t.email} = lower(${t.email})`),
  ],
);

/** Nightly rollup of Redis counters (Phase 5). */
export const analyticsDaily = pgTable(
  "analytics_daily",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** "YYYY-MM-DD" */
    day: date({ mode: "string" }).notNull(),
    event: varchar({ length: 64 }).notNull(),
    component: varchar({ length: 64 }),
    count: integer().notNull().default(0),
  },
  (t) => [
    // NULLS NOT DISTINCT (Postgres >= 15) makes (day, event, NULL) unique so the rollup can
    // upsert with onConflictDoUpdate({ target: [day, event, component] }).
    unique("analytics_daily_day_event_component_uq")
      .on(t.day, t.event, t.component)
      .nullsNotDistinct(),
  ],
);

export type PlaygroundShare = typeof playgroundShares.$inferSelect;
export type NewPlaygroundShare = typeof playgroundShares.$inferInsert;
export type WaitlistSignup = typeof waitlistSignups.$inferSelect;
export type NewWaitlistSignup = typeof waitlistSignups.$inferInsert;
export type AnalyticsDailyRow = typeof analyticsDaily.$inferSelect;
export type NewAnalyticsDailyRow = typeof analyticsDaily.$inferInsert;
```

- [ ] **Step 3: Write `apps/web/src/db/client.ts`**

```ts
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema> & { $client: postgres.Sql };

// Survives `next dev` HMR: modules re-evaluate, globalThis does not.
const globalForDb = globalThis as unknown as { __juicekitDb?: Db };

/** Lazy singleton: nothing connects at import time, so `next build` never touches Postgres. */
export function getDb(): Db {
  if (globalForDb.__juicekitDb) return globalForDb.__juicekitDb;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  // postgres() opens no socket until the first query.
  const client = postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 20,
    connect_timeout: 10,
    // Prepared statements stay on for a direct connection. Set DATABASE_PREPARE=false only
    // behind a transaction-mode pooler (PgBouncer transaction mode, Supabase pooler).
    prepare: process.env.DATABASE_PREPARE !== "false",
    onnotice: () => {},
  });

  const db = drizzle({ client, schema, casing: "snake_case" });
  globalForDb.__juicekitDb = db;
  return db;
}
```

- [ ] **Step 4: Write `apps/web/src/lib/redis.ts`**

```ts
import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { __juicekitRedis?: Redis };

/** Lazy singleton: connects on the first command, never at import or build time. */
export function getRedis(): Redis {
  if (globalForRedis.__juicekitRedis) return globalForRedis.__juicekitRedis;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");

  const redis = new Redis(url, {
    lazyConnect: true,
    // Fail queued commands after a couple of reconnect attempts instead of the default 20.
    maxRetriesPerRequest: 2,
    connectTimeout: 5_000,
    commandTimeout: 2_000,
    // ioredis 6 speaks RESP3 (HELLO 3) and downgrades automatically on Redis < 6. Reply
    // shapes stay RESP2-identical under the default replyMapping "legacy".
  });

  // ioredis swallows "error" events when nobody listens; log them so outages are visible.
  redis.on("error", (err: Error) => {
    console.error("[redis]", err.message);
  });

  globalForRedis.__juicekitRedis = redis;
  return redis;
}
```

- [ ] **Step 5: Write `apps/web/scripts/migrate.mts`**

```ts
// Same behaviour and tracking table (drizzle.__drizzle_migrations) as `drizzle-kit migrate`,
// which exits 1 with no error text when the database is unreachable. This prints the real
// error. Node 24 strips types natively; the .mts extension forces ESM.
//   node --env-file-if-exists=.env scripts/migrate.mts
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { max: 1, connect_timeout: 10, onnotice: () => {} });
try {
  await migrate(drizzle({ client }), { migrationsFolder: "./drizzle" });
  console.log("migrations applied");
} catch (err) {
  const cause = err instanceof Error && err.cause instanceof Error ? ` (${err.cause.message})` : "";
  console.error("migration failed:", err instanceof Error ? err.message + cause : err);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
```

- [ ] **Step 6: Write `apps/web/.env.example`**

```
# Host-side defaults (pnpm dev / db scripts on macOS): `docker compose up postgres redis`
# publishes both ports. Copy to apps/web/.env; drizzle-kit and `pnpm db:migrate` read that file.
DATABASE_URL=postgres://juicekit:juicekit@localhost:5432/juicekit
REDIS_URL=redis://localhost:6379

# Inside docker compose the web service gets service-name hosts from compose.yaml instead:
#   DATABASE_URL=postgres://juicekit:juicekit@postgres:5432/juicekit
#   REDIS_URL=redis://redis:6379

# Optional
# DATABASE_POOL_MAX=10      # postgres.js `max` (default 10)
# DATABASE_PREPARE=false    # only behind a transaction-mode pooler
```

- [ ] **Step 7: Write the failing test `apps/web/src/app/api/health/route.test.ts`**

```ts
// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";

const { executeMock, pingMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  pingMock: vi.fn(),
}));

vi.mock("@/db/client", () => ({ getDb: () => ({ execute: executeMock }) }));
vi.mock("@/lib/redis", () => ({ getRedis: () => ({ ping: pingMock }) }));

import { GET } from "./route";

type HealthBody = {
  status: "ok" | "degraded";
  checks: Record<"postgres" | "redis", { ok: boolean; latencyMs?: number; error?: string }>;
};

beforeEach(() => {
  executeMock.mockReset();
  pingMock.mockReset();
});

test("returns 200 when postgres and redis respond", async () => {
  executeMock.mockResolvedValue([{ "?column?": 1 }]);
  pingMock.mockResolvedValue("PONG");

  const res = await GET();
  const body = (await res.json()) as HealthBody;

  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("no-store");
  expect(body.status).toBe("ok");
  expect(body.checks.postgres.ok).toBe(true);
  expect(body.checks.redis.ok).toBe(true);
});

test("returns 503 and surfaces the cause when a dependency fails", async () => {
  executeMock.mockRejectedValue(
    new Error("Failed query: select 1\nparams: ", { cause: new Error("connect ECONNREFUSED") }),
  );
  pingMock.mockResolvedValue("PONG");

  const res = await GET();
  const body = (await res.json()) as HealthBody;

  expect(res.status).toBe(503);
  expect(body.status).toBe("degraded");
  expect(body.checks.postgres).toEqual({
    ok: false,
    error: "Failed query: select 1 (connect ECONNREFUSED)",
  });
  expect(body.checks.redis.ok).toBe(true);
});
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm test`

Expected: the new test file fails with `Failed to resolve import "./route"`.

- [ ] **Step 9: Write `apps/web/src/app/api/health/route.ts`**

```ts
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { getRedis } from "@/lib/redis";

const TIMEOUT_MS = 2_000;

type CheckResult = { ok: true; latencyMs: number } | { ok: false; error: string };

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Drizzle wraps driver failures as "Failed query: ..." with the real error in `cause`. */
function describeError(err: unknown): string {
  if (err instanceof Error) {
    const cause = err.cause instanceof Error ? ` (${err.cause.message})` : "";
    return `${err.message.split("\n")[0]}${cause}`;
  }
  return String(err);
}

async function runCheck(label: string, fn: () => Promise<unknown>): Promise<CheckResult> {
  const start = performance.now();
  try {
    // fn() is called inside the try so a synchronous throw (missing env var) is reported too.
    await withTimeout(fn(), TIMEOUT_MS, label);
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    return { ok: false, error: describeError(err) };
  }
}

// GET route handlers are dynamic by default in Next 15+; no segment config needed.
export async function GET(): Promise<Response> {
  const [postgres, redis] = await Promise.all([
    runCheck("postgres", () => getDb().execute(sql`select 1`)),
    runCheck("redis", () => getRedis().ping()),
  ]);
  const ok = postgres.ok && redis.ok;
  return Response.json(
    { status: ok ? "ok" : "degraded", checks: { postgres, redis } },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm test`

Expected: 4 passed (registry 1, web 3).

- [ ] **Step 11: Generate the initial migration (offline)**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm --filter @juicekit/web db:generate -- --name init`

Expected: creates `apps/web/drizzle/0000_init.sql`, `apps/web/drizzle/meta/_journal.json`, `apps/web/drizzle/meta/0000_snapshot.json`. Then run `cat apps/web/drizzle/0000_init.sql` and confirm it contains all of: `CREATE TABLE "analytics_daily"`, `CONSTRAINT "analytics_daily_day_event_component_uq" UNIQUE NULLS NOT DISTINCT("day","event","component")`, `CREATE TABLE "playground_shares"`, `"created_at" timestamp with time zone DEFAULT now() NOT NULL`, `CREATE TABLE "waitlist_signups"`, `CONSTRAINT "waitlist_signups_email_uq" UNIQUE("email")`, `CHECK ("waitlist_signups"."email" = lower("waitlist_signups"."email"))`, `CREATE UNIQUE INDEX "playground_shares_slug_idx"`, `CREATE INDEX "playground_shares_component_idx"`. If any is missing, the schema's extra-config array is wrong (see the comment in schema.ts).

- [ ] **Step 12: Verify the migration script fails loudly without a database**

Run: `cd apps/web && DATABASE_URL=postgres://u:p@127.0.0.1:1/db node --env-file-if-exists=.env scripts/migrate.mts; echo "exit=$?"; cd ../..`

Expected: prints `migration failed: ...` including `ECONNREFUSED`, then `exit=1`.

- [ ] **Step 13: Typecheck, lint, build**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm typecheck && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm lint && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm build`

Expected: all exit 0. The build must not attempt any connection (no `ECONNREFUSED` in the build log) and the route table lists `ƒ /api/health`.

- [ ] **Step 14: Commit**

```bash
git add apps/web/drizzle.config.ts apps/web/.env.example apps/web/scripts/migrate.mts apps/web/src/db/schema.ts apps/web/src/db/client.ts apps/web/src/lib/redis.ts apps/web/src/app/api/health/route.ts apps/web/src/app/api/health/route.test.ts apps/web/drizzle
git commit -m "feat(web): add Drizzle schema and migrations, Redis client, and health route

Postgres schema for playground shares, waitlist signups, and daily analytics
rollups with the initial generated migration; lazy HMR-safe postgres.js and
ioredis singletons; a loud programmatic migrator; and GET /api/health returning
200/503 with per-dependency results (unit-tested with mocked clients).

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Nwqd3wF2bMWH6GWup8ShSL"
```

---

### Task 5: Docker Compose dev environment and production Dockerfile

**Files:**

- Create: `compose.yaml`, `docker/web.dev.Dockerfile`, `Dockerfile`, `.dockerignore`

**Interfaces:**

- Consumes: `@juicekit/web` scripts `db:migrate`, `build`; standalone layout `.next/standalone/apps/web/server.js`; `apps/web/public/.gitkeep`.
- Produces: `docker compose up` → http://localhost:3000 with Postgres on 5432 and Redis on 6379; `docker build -t juicekit-web .` → production image listening on 3000.

- [ ] **Step 1: Write `compose.yaml`**

```yaml
services:
  web:
    build:
      context: .
      dockerfile: docker/web.dev.Dockerfile
    # 1) install Linux dependencies into the masked node_modules volumes (a few seconds once
    #    the lockfile is unchanged; minutes on the very first run)
    # 2) apply Drizzle migrations (exits 1 with the real error if Postgres is unreachable)
    # 3) start the Turbopack dev server (binds 0.0.0.0 by default)
    # HMR fallback if edits are not picked up through the bind mount:
    #   NEXT_DEV_ARGS=--webpack WATCHPACK_POLLING=true docker compose up
    command: >
      sh -c "pnpm install --frozen-lockfile
      && pnpm --filter @juicekit/web db:migrate
      && pnpm --filter @juicekit/web exec next dev ${NEXT_DEV_ARGS:-}"
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://juicekit:juicekit@postgres:5432/juicekit
      REDIS_URL: redis://redis:6379
      NEXT_TELEMETRY_DISABLED: "1"
      WATCHPACK_POLLING: ${WATCHPACK_POLLING:-false}
    volumes:
      - .:/app
      # Mask every host node_modules (macOS binaries) and Next's build output with named volumes.
      - root_node_modules:/app/node_modules
      - web_node_modules:/app/apps/web/node_modules
      - registry_node_modules:/app/packages/registry/node_modules
      - web_next:/app/apps/web/.next
      # pnpm content-addressable store; survives recreating the containers.
      - pnpm_store:/pnpm/store
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: juicekit
      POSTGRES_PASSWORD: juicekit
      POSTGRES_DB: juicekit
    ports:
      - "5432:5432"
    volumes:
      # Postgres 18+ images declare VOLUME /var/lib/postgresql (PGDATA=/var/lib/postgresql/18/docker).
      - postgres_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U juicekit -d juicekit"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s

  redis:
    image: redis:8-alpine
    command: ["redis-server", "--save", "60", "1"]
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  root_node_modules:
  web_node_modules:
  registry_node_modules:
  web_next:
  pnpm_store:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Write `docker/web.dev.Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1
# Dev image for compose.yaml: only Node + pnpm. Source is bind-mounted; dependencies are
# installed into named volumes at container start (see the web service command).
FROM node:24-bookworm-slim
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# corepack is deprecated and gone from Node 25+, so install pnpm explicitly.
RUN npm install -g pnpm@12.4.2
WORKDIR /app
EXPOSE 3000
```

- [ ] **Step 3: Write `Dockerfile` (production)**

```dockerfile
# syntax=docker/dockerfile:1
# Production image for apps/web. Build from the repo root:
#   docker build -t juicekit-web .
#   docker run --rm -p 3000:3000 -e DATABASE_URL=... -e REDIS_URL=... juicekit-web
ARG NODE_IMAGE=node:24-bookworm-slim

# ---------- base: Node 24 (glibc) + pnpm 12 ----------
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@12.4.2
WORKDIR /app

# ---------- deps: lockfile + workspace settings only, so this layer survives source edits ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch

# ---------- build ----------
FROM deps AS build
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @juicekit/web build

# ---------- runner: only the traced standalone output ----------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
# outputFileTracingRoot is the repo root, so the standalone tree mirrors the monorepo.
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 4: Write `.dockerignore`**

```
**/node_modules
**/.next
**/out
**/coverage
**/.vitest
**/*.tsbuildinfo
**/next-env.d.ts
.git
.github
**/.env*
!**/.env.example
**/.DS_Store
```

- [ ] **Step 5: Validate syntax without Docker**

Run: `node -e "const fs=require('fs');const y=fs.readFileSync('compose.yaml','utf8');if(!/^services:/m.test(y)||/^version:/m.test(y))process.exit(1);for(const f of ['Dockerfile','docker/web.dev.Dockerfile']){const d=fs.readFileSync(f,'utf8');if(!/^FROM /m.test(d))process.exit(1)}console.log('docker-files-ok')"` and `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm exec prettier --check compose.yaml .dockerignore`

Expected: `docker-files-ok` and Prettier exit 0. If `docker` is available on the machine running this task, also run `docker compose config --quiet` (expected: exit 0) and `docker build -t juicekit-web .` followed by `docker run --rm -p 3000:3000 juicekit-web` + `curl -si localhost:3000/api/health` (expected: HTTP 503 JSON because no DB is configured, proving the server boots).

- [ ] **Step 6: Commit**

```bash
git add compose.yaml docker/web.dev.Dockerfile Dockerfile .dockerignore
git commit -m "chore: add Docker Compose dev environment and production Dockerfile

compose.yaml runs web (bind-mounted source, node_modules and .next masked by
named volumes, migrate-then-dev), postgres:18-alpine, and redis:8-alpine with
healthchecks. The multi-stage Dockerfile builds the Next standalone output with
a pnpm fetch layer cache and runs as the node user.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Nwqd3wF2bMWH6GWup8ShSL"
```

---

### Task 6: GitHub Actions workflow and registry validation placeholder

**Files:**

- Create: `.github/workflows/ci.yml`, `scripts/validate-registry.mjs`

**Interfaces:**

- Consumes: root scripts `lint`, `typecheck`, `test`, `build`, `validate:registry`.
- Produces: CI job `ci` on push to `main` and on pull requests.

- [ ] **Step 1: Write `scripts/validate-registry.mjs`**

Dependency-free placeholder for the CI stage "validate registry JSON". Phase 3 replaces the checks with validation against the shadcn registry schema (that needs a JSON-schema validator, which requires dependency sign-off).

```js
// Validates shadcn-style registry items under apps/web/public/r/ (built in Phase 3).
// Exits 0 with a note when the directory does not exist yet.
import { readdir, readFile } from "node:fs/promises";

const REGISTRY_DIR = new URL("../apps/web/public/r/", import.meta.url);

const ITEM_TYPES = new Set([
  "registry:lib",
  "registry:block",
  "registry:component",
  "registry:ui",
  "registry:hook",
  "registry:theme",
  "registry:page",
  "registry:file",
  "registry:style",
  "registry:base",
  "registry:font",
  "registry:item",
]);

/**
 * @param {string} file
 * @param {unknown} item
 * @returns {string | null} an error message, or null when the item is valid
 */
function validateItem(file, item) {
  if (typeof item !== "object" || item === null) return "not a JSON object";
  const record = /** @type {Record<string, unknown>} */ (item);
  if (file === "registry.json") {
    return Array.isArray(record.items) ? null : 'registry.json must have an "items" array';
  }
  if (typeof record.name !== "string" || record.name.length === 0) return 'missing "name"';
  if (typeof record.type !== "string" || !ITEM_TYPES.has(record.type)) {
    return `invalid "type": ${String(record.type)}`;
  }
  if (!Array.isArray(record.files)) return 'missing "files" array';
  return null;
}

/** @type {string[]} */
let files = [];
try {
  files = (await readdir(REGISTRY_DIR)).filter((name) => name.endsWith(".json"));
} catch {
  console.log("validate-registry: no apps/web/public/r directory yet (built in Phase 3)");
  process.exit(0);
}

let failures = 0;
for (const file of files) {
  try {
    const item = JSON.parse(await readFile(new URL(file, REGISTRY_DIR), "utf8"));
    const error = validateItem(file, item);
    if (error) {
      failures += 1;
      console.error(`validate-registry: ${file}: ${error}`);
    }
  } catch (err) {
    failures += 1;
    console.error(`validate-registry: ${file}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`validate-registry: ${files.length} file(s) checked, ${failures} failure(s)`);
process.exit(failures > 0 ? 1 : 0);
```

- [ ] **Step 2: Run the validator (no registry yet)**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm validate:registry`

Expected: `validate-registry: no apps/web/public/r directory yet (built in Phase 3)`, exit 0.

- [ ] **Step 3: Run the validator against a temporary invalid item**

Run: `mkdir -p apps/web/public/r && echo '{"name":"x","type":"bogus","files":[]}' > apps/web/public/r/x.json && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm validate:registry; echo "exit=$?"; rm -rf apps/web/public/r`

Expected: `validate-registry: x.json: invalid "type": bogus`, then `exit=1`. The directory is removed afterwards (confirm with `git status --porcelain apps/web/public`).

- [ ] **Step 4: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

env:
  NEXT_TELEMETRY_DISABLED: "1"

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v7

      # Reads "packageManager": "pnpm@12.4.2" from package.json. Do not also pass `version`.
      - uses: pnpm/action-setup@v6

      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: pnpm # runs `pnpm store path`, so pnpm must already be installed

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Lint (eslint + prettier)
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Validate registry JSON
        run: pnpm validate:registry
```

- [ ] **Step 5: Lint the new files**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm lint && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm exec tsc --noEmit -p tsconfig.json`

Expected: exit 0 (the root tsconfig type-checks `scripts/validate-registry.mjs` with `checkJs`).

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml scripts/validate-registry.mjs
git commit -m "ci: add GitHub Actions workflow and registry JSON validation step

install -> lint -> typecheck -> test -> build -> validate registry JSON on
Node 24 with pnpm 12 (store cached). The registry validator is a dependency-free
placeholder that Phase 3 upgrades to shadcn schema validation.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Nwqd3wF2bMWH6GWup8ShSL"
```

---

### Task 7: README and full verification pass

**Files:**

- Create: `README.md`

**Interfaces:**

- Consumes: everything above.

- [ ] **Step 1: Write `README.md`**

````markdown
# JuiceKit

Animated gamification components for React: level-ups, streak extensions, achievement
unlocks, and the rest of the "juice" that static gamification kits leave out. Components
install as source through a shadcn-compatible registry. MIT licensed.

This repository is a pnpm workspace:

| Path                | Package              | What it is                                                  |
| ------------------- | -------------------- | ----------------------------------------------------------- |
| `apps/web`          | `@juicekit/web`      | Next.js 16 site: docs, playground, registry, route handlers |
| `packages/registry` | `@juicekit/registry` | Component source published as registry items (Phase 2+)     |

Current status: **Phase 1 (scaffold and infrastructure)**. See `SPEC.md` for the roadmap.

## Prerequisites

- Node.js 24 (`.nvmrc`). pnpm 12.4.2 is pinned in `package.json`; if `pnpm` is not on your
  PATH, either run `corepack enable` once or prefix commands with `corepack pnpm`.
- Docker with Compose v2 for the containerised dev environment.

## Quick start (Docker)

```bash
docker compose up
```

First run builds the dev image and installs Linux dependencies into named volumes (a few
minutes); later runs take seconds. The `web` service installs dependencies, applies Drizzle
migrations, then starts `next dev` on http://localhost:3000. Postgres is published on 5432 and
Redis on 6379.

Verify:

```bash
curl -s localhost:3000/api/health   # {"status":"ok","checks":{"postgres":{...},"redis":{...}}}
```

Edit `apps/web/src/app/page.tsx`; the browser should update within a couple of seconds. If it
does not, Turbopack is not receiving file events through the bind mount. Fall back to webpack
with polling:

```bash
NEXT_DEV_ARGS=--webpack WATCHPACK_POLLING=true docker compose up
```

## Host workflow (Node on your machine, databases in Docker)

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

## Scripts (run from the repo root)

| Script                   | What it does                                                             |
| ------------------------ | ------------------------------------------------------------------------ |
| `pnpm dev`               | `next dev` for `apps/web`                                                |
| `pnpm build`             | `next build` (standalone output, type-checks `tsconfig.build.json`)      |
| `pnpm start`             | Runs the built standalone server                                         |
| `pnpm lint`              | ESLint (`--max-warnings 0`) and Prettier check                           |
| `pnpm lint:fix`          | ESLint `--fix` and Prettier write                                        |
| `pnpm typecheck`         | `tsc --noEmit` for root scripts, `packages/registry`, and `apps/web`     |
| `pnpm test`              | Vitest across all workspace projects (`pnpm test --project web` for one) |
| `pnpm format`            | Prettier write                                                           |
| `pnpm validate:registry` | Validates registry JSON under `apps/web/public/r` (Phase 3)              |
| `pnpm db:generate`       | Generate a migration from `apps/web/src/db/schema.ts` (offline)          |
| `pnpm db:migrate`        | Apply migrations (`apps/web/scripts/migrate.mts`, prints real errors)    |
| `pnpm db:push`           | Push the schema without a migration file (dev only)                      |
| `pnpm db:check`          | Validate the migrations folder (offline)                                 |
| `pnpm db:studio`         | Drizzle Studio                                                           |

CI (`.github/workflows/ci.yml`) runs install, lint, typecheck, test, build, and validate
registry JSON on every push to `main` and every pull request.

## Production image

```bash
docker build -t juicekit-web .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgres://... -e REDIS_URL=redis://... juicekit-web
```

Migrations are not run by the image. Run `pnpm db:migrate` against the target database as a
deploy step.

## Layout notes

- `apps/web/src/app` is the App Router tree; `src/db` holds the Drizzle schema and client;
  `src/lib` holds shared server utilities (Redis client). `@/*` maps to `apps/web/src/*`.
- Theme tokens live in `apps/web/src/app/globals.css` as CSS variables (shadcn "neutral"
  palette) exposed through `@theme inline`, so components are light/dark aware without
  `dark:` utilities. Classes used in `packages/registry/src` are picked up through `@source`.
- `apps/web/drizzle/` holds generated SQL migrations and snapshots; commit them.
- `apps/web/.env` is read by drizzle-kit and `pnpm db:migrate` on the host. Compose injects its
  own `DATABASE_URL` / `REDIS_URL`, which take precedence over the file.

## Dependency notes

Pinned exactly; bump deliberately.

- `typescript` is pinned to 6.0.3. typescript-eslint 8.70 rejects TypeScript 7.x.
- `eslint` 10 with `eslint-config-next` 16.3.5 needs `settings.react.version` set explicitly in
  `eslint.config.mjs` (see the comment there). Install prints unmet-peer warnings for three of
  its plugins; they are warnings only.
- `jsdom` is pinned to 29.1.1 because jsdom 30 requires Node >= 24.15.
- Packages added because a tool in the spec cannot run without them: `postgres` (Postgres
  driver for Drizzle), `drizzle-kit` (Drizzle CLI), `@tailwindcss/postcss` (Tailwind v4 in
  Next), `vite` (required peer of Vitest 5), `jsdom` and `@testing-library/dom` /
  `@testing-library/jest-dom` (Testing Library runtime and matchers), `eslint-config-next`,
  `typescript-eslint`, `eslint-config-prettier`, and the `@types/*` packages.
- Not added (would need sign-off): `@eslint/js`, `@vitejs/plugin-react`, `vite-tsconfig-paths`,
  git hooks, JSON-schema validators, `prettier-plugin-tailwindcss`.
````

- [ ] **Step 2: Format and run the full CI sequence locally**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm format && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm lint && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm typecheck && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm test && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm build && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm validate:registry`

Expected: every command exits 0.

- [ ] **Step 3: Confirm a clean tree apart from README (and any Prettier-only changes)**

Run: `git status --porcelain`

Expected: only `README.md` (untracked) and files that `pnpm format` reformatted. Review any reformatted file with `git diff` and include it in the commit.

- [ ] **Step 4: Commit**

```bash
git add README.md
git add -u
git commit -m "docs: add README with setup, scripts, and dependency notes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Nwqd3wF2bMWH6GWup8ShSL"
```

---

## Self-review

**Spec coverage (Phase 1 bullets):**

- Monorepo → Task 1. Next.js app → Task 3. Tailwind v4 → Task 3. Drizzle + Postgres schema/migrations → Task 4. Redis client → Task 4. Docker Compose with hot reload → Task 5 (cannot be executed on this host; README documents verification and the fallback). GitHub Actions workflow → Task 6. ESLint/Prettier/Vitest → Task 2 (+ Task 3 for the jsdom project). "CI green on a hello-world page" → Tasks 3, 6, 7 (local run of the identical command sequence).
- Quality bars touched in Phase 1: strict TypeScript everywhere (base config); theme-aware CSS variables (globals.css); zero runtime deps beyond Motion in the registry package (only `motion` is declared, as a peer).

**Placeholder scan:** none of the forbidden patterns appear; every file has full content.

**Type consistency:** `getDb`/`getRedis` names match between Task 4 files and the health route test mocks; `@/*` alias is defined in Task 3 and used in Task 4; Vitest project names `web`/`registry` match the README's `--project web` example; package names `@juicekit/web`/`@juicekit/registry` match every `--filter` in scripts, compose.yaml, and the Dockerfile.
