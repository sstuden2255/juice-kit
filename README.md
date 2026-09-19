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
