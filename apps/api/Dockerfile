# The api image. Two stages, so the runtime carries no toolchain and no sources.
#
# The build bundles the @12-apps/* packages in — they publish raw TypeScript, so
# a Node host has to bundle them (see apps/api/scripts/build.mjs). One
# consequence worth knowing: the runtime stage needs no node_modules at all.
FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
# Every workspace manifest, before any source. Two reasons, and the first is a
# correctness one: `--frozen-lockfile` validates the lockfile against the WHOLE
# workspace, so copying only this app's manifest fails with ERR_PNPM_OUTDATED_LOCKFILE.
# The second is caching — this layer only changes when a dependency does.
COPY apps/api/package.json ./apps/api/
COPY apps/events/package.json ./apps/events/
COPY apps/client/package.json ./apps/client/
COPY apps/admin/package.json ./apps/admin/
COPY apps/super-admin/package.json ./apps/super-admin/
COPY packages/features/package.json ./packages/features/
COPY packages/spa-shell/package.json ./packages/spa-shell/
RUN pnpm install --frozen-lockfile
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter api build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/api/dist ./dist
EXPOSE 3000
# The orchestrator's liveness probe. /health answers before any subsystem is
# configured, which is what makes a flags-all-off deploy come up green.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/server.mjs"]
