# JuiceKit

Animated gamification components for React: level-ups, streak extensions, achievement
unlocks, and the rest of the "juice" that static gamification kits leave out. Components
install as source through a shadcn-compatible registry. MIT licensed.

This repository is a pnpm workspace:

| Path                | Package              | What it is                                                    |
| ------------------- | -------------------- | ------------------------------------------------------------- |
| `apps/web`          | `@juicekit/web`      | Next.js 16 site: landing page, docs, registry, route handlers |
| `packages/registry` | `@juicekit/registry` | Component source published as registry items                  |
| `scripts/registry`  | —                    | Build that turns that source into shadcn registry JSON        |

Current status: **Phase 3 (registry build, docs site, landing page)**. See `SPEC.md` for the
roadmap.

## Components

Everything lives in `packages/registry/src` and is exported from `@juicekit/registry` (barrel)
and as subpaths such as `@juicekit/registry/ui/xp-bar`. Every item animates `transform` and
`opacity` only, draws particles on a `<canvas>`, depends on nothing but Motion, and honours
`prefers-reduced-motion` (or a `reducedMotion` prop) with an instant state change plus a
subtle fade.

| Item                | Kind      | What it does                                                                                  |
| ------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `ParticleEngine`    | lib       | Canvas particle system: `burst`, `fountain`, directional `emit`; pooled, DPR aware            |
| `ParticleCanvas`    | primitive | Pointer-transparent canvas filling its parent, imperative handle, no-op under reduced motion  |
| `AnimatedNumber`    | primitive | Odometer digits on a spring, Intl formatting, formatted value exposed to assistive tech       |
| `ShineSweep`        | primitive | Masked highlight sweep over children; `active` prop or `play()` handle                        |
| `XPBar`             | component | Spring fill, gain flash, animated label, level rollover with `onLevelUp({ level, overflow })` |
| `AchievementUnlock` | component | Badge drop, shine, rarity particles, staggered reveal; `play()` resolves on completion        |
| `LevelUp`           | component | Radial glow, number flip, particle fountain, optional screen flash                            |

Each component supports controlled and uncontrolled use (`value`/`defaultValue`,
`open`/`defaultOpen`) and an imperative handle (`gain()`, `play()`, `reset()`). Every item has a
docs page at `/docs/<name>` with a live preview, a reduced-motion switch, generated prop
tables, its CSS variables, and the exact source the CLI installs.

Registry source conventions: `ui/` for components, `lib/` for framework-agnostic code, `hooks/`
for hooks; files import each other relatively and the registry build rewrites those to shadcn's
`@/` aliases; tests sit next to the code and run in jsdom with Testing Library, using
`test/reduced-motion.ts` to flip the media query and `test/canvas-mock.ts` for the 2D context.

## Registry

`pnpm build:registry` reads the manifest in `scripts/registry/items.mjs` and writes
`apps/web/public/r/registry.json` plus one JSON per item, which Next serves directly:

```bash
npx shadcn@latest add http://localhost:3000/r/level-up.json
```

The CLI follows `registryDependencies`, so that one command also installs the particle canvas,
engine, spring presets, reduced-motion hook and class-name helper, and adds Motion to
`package.json`.

Two things the build does that are worth knowing:

- **Imports are rewritten.** `../lib/springs` inside the workspace becomes `@/lib/juice-springs`
  in the emitted file. A relative import that does not resolve to a manifest entry fails the
  build rather than shipping.
- **Prop tables are extracted.** `scripts/registry/extract-props.mjs` parses each component with
  the TypeScript compiler, so the tables on the docs pages come from the component's own types
  and JSDoc. A prop documented with a capital `Default x.` gets a Default column; lowercase
  "defaults to …" stays prose.

`cn` and the spring presets install as `lib/juice-utils.ts` and `lib/juice-springs.ts` so adding
JuiceKit can never overwrite a shadcn consumer's own `lib/utils.ts`.

The output is generated, not committed: `pnpm dev`, `pnpm typecheck` and `pnpm build` all
produce it first, and CI builds it on its own step. `pnpm validate:registry` checks the emitted
JSON against the shadcn item and registry shapes, verifies every `registryDependencies` URL
resolves to an emitted item, and fails on any relative import that survived the rewrite. Set
`REGISTRY_BASE_URL` (or pass `--base-url`) to build install URLs for a real host.

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
migrations, then starts `next dev` on http://localhost:3000. Postgres is published on
127.0.0.1:5432 and Redis on 127.0.0.1:6379 (loopback only — they carry tracked credentials and
no Redis password; the `web` container reaches them by service name over the Compose network).

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

On Linux hosts the dev container runs as root, so files it writes into the checkout
(`apps/web/next-env.d.ts`, `apps/web/tsconfig.tsbuildinfo`, the named-volume mount points) end
up root-owned. Before switching to the host workflow below, run:

```bash
sudo chown -R "$USER" apps/web/next-env.d.ts apps/web/tsconfig.tsbuildinfo \
  node_modules apps/web/node_modules packages/registry/node_modules apps/web/.next
```

macOS Docker Desktop remaps ownership and is unaffected.

`.env not found. Continuing without it.` on stderr is Node's `--env-file-if-exists` notice from
`pnpm db:migrate`. It is expected inside Compose and in CI, where the environment comes from
elsewhere.

## Host workflow (Node on your machine, databases in Docker)

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
docker compose up -d --wait postgres redis   # --wait blocks until both healthchecks pass
pnpm db:migrate
pnpm dev
```

Without `--wait`, `up -d` returns as soon as the containers start; on a fresh volume Postgres
is still running `initdb`, and `pnpm db:migrate` makes a single attempt and fails with
`ECONNREFUSED`.

Need the databases reachable from another machine or a VM? Add an untracked
`compose.override.yaml` with the wider port mapping rather than editing `compose.yaml`:

```yaml
# compose.override.yaml — git-ignored. `!override` replaces the mapping instead of appending
# to it (Compose v2.24+); a plain list would concatenate and fail to bind the second time.
services:
  postgres:
    ports: !override ["5432:5432"]
  redis:
    ports: !override ["6379:6379"]
```

## Scripts (run from the repo root)

| Script                   | What it does                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| `pnpm dev`               | Builds the registry, then `next dev` for `apps/web`                       |
| `pnpm build`             | Builds the registry, then `next build` (standalone, type-checked)         |
| `pnpm start`             | Runs the built standalone server                                          |
| `pnpm lint`              | ESLint (`--max-warnings 0`) and Prettier check                            |
| `pnpm lint:fix`          | ESLint `--fix` and Prettier write                                         |
| `pnpm typecheck`         | Builds the registry, then `tsc --noEmit` across scripts and both packages |
| `pnpm test`              | Vitest across all workspace projects (`pnpm test --project web` for one)  |
| `pnpm test:watch`        | Vitest in watch mode                                                      |
| `pnpm format`            | Prettier write                                                            |
| `pnpm format:check`      | Prettier check only (the second half of `pnpm lint`)                      |
| `pnpm build:registry`    | Generates `apps/web/public/r` from `packages/registry/src`                |
| `pnpm validate:registry` | Validates the emitted registry JSON against the shadcn shapes             |
| `pnpm db:generate`       | Generate a migration from `apps/web/src/db/schema.ts` (offline)           |
| `pnpm db:migrate`        | Apply migrations (`apps/web/scripts/migrate.mts`, prints real errors)     |
| `pnpm db:push`           | Push the schema without a migration file (dev only)                       |
| `pnpm db:check`          | Validate the migrations folder (offline)                                  |
| `pnpm db:studio`         | Drizzle Studio                                                            |

CI (`.github/workflows/ci.yml`) runs install, build registry, `docker compose config`, lint,
typecheck, test, build, and validate registry JSON on every push to `main` and every pull
request.

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
  `src/lib` holds shared utilities (Redis client, registry loader, theme). `@/*` maps to
  `apps/web/src/*`. `src/components/previews` holds the interactive demos the docs pages embed.
- `apps/web/public/r` is generated by `pnpm build:registry` and git-ignored. Phase 2's `/demo`
  routes redirect to their `/docs` equivalents.
- Theme tokens live in `apps/web/src/app/globals.css` as CSS variables (shadcn "neutral"
  palette) exposed through `@theme inline`, so components are light/dark aware without
  `dark:` utilities. Classes used in `packages/registry/src` are picked up through `@source`.
- `apps/web/drizzle/` holds generated SQL migrations and snapshots; commit them.
- Registry source and tests live under `packages/registry/src`; package-root `*.ts` files
  (a future `vitest.setup.ts`, for instance) are type-checked and linted too.
- `apps/web/.env` is read on the host by `next dev` / `next start`, by drizzle-kit, and by
  `pnpm db:migrate`. Compose injects its own `DATABASE_URL` / `REDIS_URL`, which take
  precedence over the file.

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
  These were added without prior sign-off because the spec's tools cannot run without them;
  remove any you object to.
- Not added (would need sign-off): `@eslint/js`, `@vitejs/plugin-react`, `vite-tsconfig-paths`,
  git hooks, JSON-schema validators (`scripts/validate-registry.mjs` checks the shadcn shapes
  by hand instead), a syntax highlighter for the docs code blocks, `prettier-plugin-tailwindcss`.
- `redis:8-alpine` is RSALv2 / SSPLv1 / AGPLv3. Running the unmodified server imposes nothing
  on this MIT code; swap to `redis:7.2-alpine` (BSD) or Valkey if your policy requires it.
