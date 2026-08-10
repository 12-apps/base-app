# The client image — its own container, deliberately.
#
# The three SPAs are static bundles, so one image could serve all of them. They
# are separate because they are three AUDIENCES: a fix to the backoffice should
# not rebuild or restart the customer app, rolling back one must not roll back
# the others, and they can sit behind different hosts. The blast radius of a bad
# build is one audience.
#
# NOTE this image is per-ENVIRONMENT, unlike the Node ones. Vite inlines
# VITE_FEATURE_* at BUILD time, so the same bundle cannot be promoted from
# staging to production with different flags — build per environment, or the
# flags are wrong wherever it lands.
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
COPY apps/client ./apps/client
ARG VITE_FEATURE_RBAC=""
ARG VITE_FEATURE_PWA=""
RUN pnpm --filter client build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx/default.conf.template /etc/nginx/templates/default.conf.template
# Where this container forwards /api. Overridden per environment; the default
# is the compose service name.
ENV API_UPSTREAM=http://api:3000
EXPOSE 80
