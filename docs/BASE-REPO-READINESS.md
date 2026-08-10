# Base repo readiness

What a new app gets from `@12-apps/*` today, what it still has to write itself,
and where the missing code currently lives.

Audit date: 2026-08-10, against `12-apps/future-pay`, `12-apps/shared-packages`
and `12-apps/ci` at `main`. Tracked by Linear epic
[12-9](https://linear.app/12-apps/issue/12-9).

## The adoption matrix

| Subsystem | Flag | Package | Status |
|---|---|---|---|
| UI components | — | `@12-apps/ui` | **Ready** — mounted |
| RBAC | `FEATURE_RBAC` | `@12-apps/rbac` | **Mountable** — context + `<Can>` work; nothing resolves the permission set yet (12-13) |
| Installable app | `VITE_FEATURE_PWA` | `@12-apps/pwa` | **Mountable** — invite works; no manifest endpoint (12-23) |
| Reporting | `FEATURE_REPORTS` | `@12-apps/report-builder` | **Complete package**, needs a database to mount against (12-33) |
| Observability | `FEATURE_OBSERVABILITY` | `@12-apps/observability-frontend` | Browser half installable now; needs the served-DSN endpoint (12-21) |
| Authentication | `FEATURE_AUTH` | `@12-apps/auth` | Partial — config only (12-12) |
| Entitlements | `FEATURE_ENTITLEMENTS` | `@12-apps/entitlements` | Partial — core only, no snapshot producer (12-19) |
| Entity history | `FEATURE_ENTITY_HISTORY` | `@12-apps/entity-lifecycle` | Partial — core only, no surface (12-17) |
| Event system | `FEATURE_EVENTS` | `@12-apps/realtime` | Partial — bus only; `apps/events` is a placeholder (12-16) |
| Background jobs | `FEATURE_JOBS` | `@12-apps/jobs` | Partial — registry + drivers (12-22) |
| Onboarding | `FEATURE_ONBOARDING` | `@12-apps/onboarding` | Partial — React only (12-23) |
| MCP surface | `FEATURE_MCP` | `@12-apps/mcp` | Partial — no OAuth AS, no model (12-23) |
| Action audit | `FEATURE_AUDIT` | — | **No package** (12-14) |
| Notifications | `FEATURE_NOTIFICATIONS` | — | **No package** (12-15) |
| Storage / uploads | `FEATURE_STORAGE` | — | **No package** (12-20) |
| Impersonation | `FEATURE_IMPERSONATION` | — | **No package** (12-24) |
| App shell | — | — | **No package** — `@repo/spa-shared` is private to future-pay (12-18) |
| Database | — | — | **Not here yet** — `packages/db` is 12-33 |

## Why so much is "partial"

Two systemic gaps, visible across the whole package set.

### One package has both halves

A port is supposed to land as a package exposing a factory per half —
`createApiFoo({…})` and `createWebFoo({…})` — so a host declares the mount and
owns nothing but config. `report-builder` is the only package in
`shared-packages` that does it (`createApiReportBuilder` +
`createWebReportBuilder`, `./server` + `./react` + `./hono`, a package-owned
Prisma fragment and an `ADOPTING.md`). `payments` comes closest
(`mountPayments` + `createPaymentFlows`).

Everything else exports a framework-free core and leaves the endpoints, the
screens and the wiring to the host. That is why `future-pay` still carries tens
of thousands of lines of what should be library code — 1,647 for RBAC, 2,854 for
entity history, 2,614 for entitlements, 1,340 + 656 + 1,747 for the event
system — and why a second app cannot get those subsystems by installing
anything.

### Package-owned Prisma models are the exception

`shared-packages` documents the seam: a package owns `prisma/<pkg>.prisma` **and
its migrations**, and a host adopts it by running that package's sync script.
Five packages do it — `entity-lifecycle`, `payments`, `product-research`,
`report-builder`, `shift`.

Every other persisted model a base app needs (`User`, `Role`, `Membership`,
`RoleAssignment`, `ResourceAssignment`, `AuditLog`, `Notification`,
`NotificationDelivery`, `NotificationPreference`, `PushSubscription`,
`OnboardingState`, `OAuthClient`, `OAuthRefreshToken`, `McpConnection`) is
hand-written in future-pay's own schema. Adopting auth or RBAC therefore means
hand-copying models and hand-writing migrations — exactly what the seam exists
to prevent. That is 12-26, and it blocks more of this list than any single port.

## Two packaging defects, and why they stopped mattering here

Both were found by consuming the packages from a **Next.js** host, which is what
this repo used to be. It is now a Vite SPA + Node processes, and neither blocks
anything here any more. They stay open because they are still true elsewhere.

- **12-28 — 47 of 51 `@12-apps/ui` components that call MUI's `styled` are
  missing `"use client"`.** A React Server Components problem: a server
  component importing one evaluates a client-only export in the server layer and
  the build dies. Vite has no server/client module graph, so the directive is
  inert here. Still real for `future-pay/apps/docs`, which is Next.
- **12-29 — 17 of 21 packages publish raw TypeScript** (`exports` → `./src/*.ts`,
  no build step; `@12-apps/ui` builds a `dist` its own exports never reach).
  Vite transforms dependency TypeScript on demand, so the SPA needs nothing. The
  **Node** hosts still pay it: `apps/api` and `apps/events` bundle with esbuild
  precisely so those packages are runnable, and a plain `tsc` build would emit
  imports Node cannot load.

## CI

`future-pay` consumes ten reusable workflows from `12-apps/ci`. This repo now
consumes three: `monorepo-static`, `monorepo-tests` and `commitlint`.

The rest are gated on things that do not exist yet, not on repo shape any more:
`quality.yml` wants consumer-side configs and `quality:*` scripts (12-36);
`cd.yml` wants Dockerfiles and per-app deploy descriptors (12-38);
`mcp-contract`, `rbac-coverage` and `entitlements-coverage` gate surfaces that
arrive with their ports. `nextjs-prod-smoke` will never apply — there is no
Next.js app, by design.

## What this repo deliberately does not copy from future-pay

Three SPAs (this ships one), a docs site, Gherkin journeys, the e2e affected
selector and its map, the payments LOC burn-down, MCP store-compliance
artifacts, the demo-store fixtures, and the pt-BR user-facing-language rule
(12-40). Those are Future-Pay's, and shipping them as a template teaches a new
app the wrong things.
