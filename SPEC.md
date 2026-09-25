# Project: JuiceKit (working name — rename later)

## What we're building
An open-source library of **animated gamification components for React** — the "juice layer" that existing gamification kits (e.g., Trophy UI) lack. Their components render *states* (streak count, rank, locked badge) with static CSS. Ours own the *moments*: level-ups, streak extensions, achievement unlocks — choreographed, spring-physics, particle-heavy sequences that demo as 8-second videos. Distribution model: shadcn-compatible registry (`npx shadcn add <url>/component-name`), copy-paste philosophy, MIT.

Also a Next.js site: landing page with live demos, per-component docs, and an interactive playground with shareable preset links.

## Stack (fixed — do not substitute)
- TypeScript (strict mode) everywhere
- Next.js (App Router) — site, docs, registry serving, API route handlers (this is our Node layer)
- Tailwind CSS v4 + Motion (framer-motion) for component animation
- Postgres (via Drizzle ORM) — playground share links, analytics rollups, email waitlist
- Redis (ioredis) — copy/install counters, rate limiting share creation
- Docker Compose — local dev: `web`, `postgres`, `redis`; plus a production Dockerfile for the web app
- GitHub Actions — CI: install → lint → typecheck → test → build → validate registry JSON
- Monorepo: pnpm workspaces (`apps/web`, `packages/registry` for component source)

## Non-negotiable quality bars
1. **60fps**: animate only `transform`/`opacity`; no layout-thrashing animations. Particles on `<canvas>`, not DOM nodes.
2. **`prefers-reduced-motion`**: every component ships a dignified reduced-motion fallback (instant state change + subtle fade). This is a first-class feature, documented per component.
3. **Zero runtime deps beyond Motion** in registry components. Particles are our own small canvas engine shipped as a registry primitive — no confetti libraries.
4. **Own-the-code**: components install as source into the consumer's repo via shadcn registry JSON. No npm package for components.
5. Every component: typed props with JSDoc, controlled + uncontrolled usage, dark/light theme-aware via CSS variables.

## Phase 1 — Scaffold & infrastructure
- Monorepo, Next.js app, Tailwind v4, Drizzle + Postgres schema/migrations, Redis client, Docker Compose (hot reload working), GitHub Actions workflow, ESLint/Prettier/Vitest configured.
- Verify: `docker compose up` gives a working dev environment; CI green on a hello-world page.

## Phase 2 — Animation primitives + 3 flagship components
Primitives (registry items other components depend on):
- `ParticleEngine` — canvas particle system (burst, fountain, directional emit; configurable count/colors/gravity/spread)
- `AnimatedNumber` — odometer-style count-up/roll with spring easing
- `ShineSweep` — masked highlight sweep effect

Flagship components (each a choreographed multi-stage sequence with imperative trigger API, e.g., `ref.current.play()` or state-driven):
1. `XPBar` — animated fill with spring overshoot, gain "chunk" flash, count-up label, level-boundary rollover event
2. `AchievementUnlock` — badge drops in with spring scale → shine sweep → particle burst → title/rarity reveal; promise/callback when sequence completes
3. `LevelUp` — radial glow burst, old level number morphs/flips to new, particle celebration, optional screen-flash

Each gets a demo page and Vitest + Testing Library smoke tests (renders, respects reduced motion, fires completion callbacks).

## Phase 3 — Registry + docs site
- Build script generating shadcn-compatible registry JSON (`/r/registry.json`, `/r/<name>.json`) from `packages/registry` source; validate against the shadcn registry schema in CI.
- Docs: getting-started page; per-component page with live interactive preview, prop table (generated from types if practical, otherwise hand-written), copyable source, and CLI install command.
- Landing page: hero that fires the flagship sequences on scroll/click. Make it shameless — the landing page IS the pitch.

## Phase 4 — Remaining v1 components
4. `StreakExtended` — flame flare + counter increment sequence, milestone variant (7/30/100)
5. `RankChange` — leaderboard row animates climbing past others, rank badge punch
6. `ComboCounter` — scale-punch per increment, escalating intensity, shake + color shift at milestones
7. `DailyRewardClaim` — chest/card open sequence with reward reveal
8. `ShineCard` — holographic foil card with pointer-tracking tilt/glare (the showpiece)

## Phase 5 — Playground, sharing, analytics
- `/playground`: pick component, tweak props via controls, replay sequence.
- Share: POST saves prop config to Postgres → nanoid slug → `/p/<slug>` renders it. Redis rate limit (per-IP) on creation. No auth in v1.
- Analytics: Redis INCR on component copy/CLI-command-copy events; nightly rollup route → Postgres; tiny internal `/stats` page.
- Waitlist email capture on landing (Postgres table, honeypot spam guard).

## Phase 6 — Animation polish pass
Deferred on purpose: components ship correct and on-spec through Phase 5, then the whole set gets its art direction in one pass rather than piecemeal.
- Readiness gate: record an 8-second clip of every component. One that can't carry 8 seconds isn't done, however green its tests are.
- Art direction: commit to a palette and a motion signature. Three shared spring presets used everywhere read as framework defaults, not as a style.
- Choreography: anticipation → impact → settle, with secondary motion trailing the primary. Most sequences currently land on a single beat.
- Verify on real hardware: animation feel and phone-width layout (~400px). A headless tab reports `document.hidden`, which freezes `requestAnimationFrame`, so neither is checkable in automation.

## Working style
- Work phase by phase; do not start a phase until the previous one builds, tests pass, and you've committed.
- Conventional commits, one branch per phase.
- Ask before adding any dependency not listed here.
- After each phase, print a short summary of what exists and how to run it.