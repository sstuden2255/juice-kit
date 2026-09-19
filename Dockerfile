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
