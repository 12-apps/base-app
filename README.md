# base-app

The starting point for a new 12-apps application: the same stack every real app
in the org runs, consuming the shared **`@12-apps/*`** packages published from
[`12-apps/shared-packages`](https://github.com/12-apps/shared-packages), with
the subsystems most apps need wired up and **switched off by default**.

```
apps/
  api/          # Hono on @hono/node-server — /api/** and /health, no pages
  client/       # customer-facing SPA        (Vite + React 19 + react-router)
  admin/        # tenant backoffice          (same stack)
  super-admin/  # platform backoffice        (same stack)
  events/       # the WebSocket gateway, in its own process
packages/
  features/     # the flag names and the parser, shared by every host
  spa-shell/    # what the three SPAs share — placeholder for @12-apps/app-shell
```

## Why this shape

**Three front ends, because three audiences.** A customer app, a tenant
backoffice and a platform console have different authorization, different
navigation and different deploy risk. `admin` gates on tenant permissions and
`super-admin` on platform ones — the distinction `@12-apps/rbac` already models
through the scope on every decision.

**`events` is its own process** because sockets are long-lived and
connection-bound while API requests are short and CPU-bound: one process for
both scales the wrong axis, and a deploy of the API would drop every open
subscription. It also performs **no authorization** — it relays exactly the
topics a connection names, which stays true far more easily when the code that
*could* authorize is somewhere else.

## Develop

```bash
pnpm install
pnpm dev                  # api :3000, client :4001, admin :3002,
                          # super-admin :3004, events :3010
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

## Containers

One image per app — five of them. The SPAs are separate containers even though
they are static bundles, because they are three audiences: a backoffice fix
should not rebuild or restart the customer app, and rolling one back must not
roll back the others.

```bash
docker compose up --build      # client :8080, admin :8081, super-admin :8082
                               # api :3000, events :3010
```

Each SPA container serves its bundle and proxies `/api` to the `api` container,
so the browser talks to one origin exactly as it does through Vite's dev proxy.

**An SPA image is per-environment.** Vite inlines `VITE_FEATURE_*` at build
time, so the same bundle cannot be promoted from staging to production with
different flags — hence `args` rather than `environment` on those services. The
Node images read `FEATURE_*` at runtime and are identical everywhere.

No token is needed to install: the `@12-apps/*` packages publish **public** to
`registry.npmjs.org`.

Copy `.env.example` to `.env` to turn a subsystem on. Nothing has to be set for
the stack to start.

## Feature flags

One flag per subsystem, all off, defined once in `packages/features` and read
from a different source by each host — `process.env.FEATURE_*` in the Node
processes, `import.meta.env.VITE_FEATURE_*` in the SPA (Vite only exposes
`VITE_`-prefixed vars, and inlines them at build time).

**The server's answer is authoritative.** The SPA flag only decides whether the
UI mounts; it ships inside the bundle and a reader can flip it.

Subsystems whose package does not exist yet still have their exact mount written
and **commented** at the call site — in `apps/api/src/app.ts` and
`packages/spa-shell/src/providers.tsx` — next to the ticket that ships them.
Adopting one is installing the package and uncommenting a block.

`packages/spa-shell` is deliberately thin. It is a placeholder for
`@12-apps/app-shell` ([12-18](https://linear.app/12-apps/issue/12-18)), and
growing a second private shell is the thing that ticket exists to prevent —
anything bigger than a mount belongs in the package.

## Subsystem status

[docs/BASE-REPO-READINESS.md](./docs/BASE-REPO-READINESS.md) has the matrix.
Short version: RBAC and the PWA invite mount today; authentication,
notifications, action audit, the event system, entity history, entitlements,
storage and onboarding are each missing one or both halves of their package.
Tracked by Linear epic [12-9](https://linear.app/12-apps/issue/12-9).

## CI

`.github/workflows/ci.yml` consumes the org's reusable monorepo pipeline from
[`12-apps/ci`](https://github.com/12-apps/ci) (`monorepo-static` +
`monorepo-tests`), and `commitlint.yml` its Conventional-Commits gate. Make
**`CI Success`** the only required check — it aggregates the rest, including the
static tier, whose failure would otherwise leave its dependents `skipped` rather
than `failure`.

## Dependency pins

`@12-apps/*` are pinned **exactly**, which makes every bump reviewable — and
means nothing raises them on its own. That is what
`.github/workflows/renovate.yml` is for; it needs a `RENOVATE_TOKEN` repo secret
and exits green with a warning until one exists. Without both halves the pins
rot silently: this repo's lockfile sat on `@12-apps/ui` 1.0.0 while 1.23.0 was
published, because `"latest"` was resolved once and then frozen.
