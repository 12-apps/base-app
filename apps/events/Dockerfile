# The events image. Two stages, so the runtime carries no toolchain and no sources.
#
# The build bundles the @12-apps/* packages in — they publish raw TypeScript, so
# a Node host has to bundle them (see apps/events/scripts/build.mjs). One
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
COPY apps/events ./apps/events
RUN pnpm --filter events build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/events/dist ./dist
EXPOSE 3010
CMD ["node", "dist/events.mjs"]
