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
| RBAC | `NEXT_PUBLIC_FEATURE_RBAC` | `@12-apps/rbac` | **Mountable** — context + `<Can>` work; nothing resolves the permission set yet (12-13) |
| Installable app | `NEXT_PUBLIC_FEATURE_PWA` | `@12-apps/pwa` | **Mountable** — invite works; no manifest endpoint (12-23) |
| Reporting | `NEXT_PUBLIC_FEATURE_REPORTS` | `@12-apps/report-builder` | **Complete package**, needs a database to mount against |
| Authentication | `NEXT_PUBLIC_FEATURE_AUTH` | `@12-apps/auth` | Partial — config only (12-12) |
| Entitlements | `NEXT_PUBLIC_FEATURE_ENTITLEMENTS` | `@12-apps/entitlements` | Partial — core only, no snapshot producer (12-19) |
| Entity history | `NEXT_PUBLIC_FEATURE_ENTITY_HISTORY` | `@12-apps/entity-lifecycle` | Partial — core only, no surface (12-17) |
| Event system | `NEXT_PUBLIC_FEATURE_EVENTS` | `@12-apps/realtime` | Partial — bus only (12-16) |
| Background jobs | `NEXT_PUBLIC_FEATURE_JOBS` | `@12-apps/jobs` | Partial — registry + drivers (12-22) |
| Onboarding | `NEXT_PUBLIC_FEATURE_ONBOARDING` | `@12-apps/onboarding` | Partial — React only (12-23) |
| MCP surface | `NEXT_PUBLIC_FEATURE_MCP` | `@12-apps/mcp` | Partial — no OAuth AS, no model (12-23) |
| Observability | `NEXT_PUBLIC_FEATURE_OBSERVABILITY` | `@12-apps/observability-frontend` | **Not installable here** — peers on `react-router-dom` + `vite` (12-21) |
| Action audit | `NEXT_PUBLIC_FEATURE_AUDIT` | — | **No package** (12-14) |
| Notifications | `NEXT_PUBLIC_FEATURE_NOTIFICATIONS` | — | **No package** (12-15) |
| Storage / uploads | `NEXT_PUBLIC_FEATURE_STORAGE` | — | **No package** (12-20) |
| Impersonation | `NEXT_PUBLIC_FEATURE_IMPERSONATION` | — | **No package** (12-24) |
| App shell | — | — | **No package** — `@repo/spa-shared` is private to future-pay (12-18) |

## Two things that made this repo unbuildable

Both were found by trying to consume the packages rather than by reading them,
and both only bite a **Next.js** host — which is why three Vite SPAs never
surfaced them.

### `main` did not build (12-28)

47 of the 51 `@12-apps/ui` components that call MUI's `styled` carry no
`"use client"` directive. MUI marks `@mui/material/styles/styled.js` as
client-only, so a **server** component importing one of them evaluates a client
export in the server layer and `next build` dies at "Collecting page data" with
*"Attempted to call the default export of …/styled.js from the server"*.

`app/page.tsx` imported `Heading`, which is one of the 47. It is now marked
`"use client"` as a workaround; the line can go once the package is fixed.

### Every `@12-apps/*` import needs a `transpilePackages` entry (12-29)

17 of 21 packages publish raw TypeScript — their `exports` map points at
`./src/*.ts` and they have no build step. (`@12-apps/ui` does build a `dist`,
and its own `exports` never point at it.) Turbopack meets a `.ts` file inside
`node_modules` and fails with "Unknown module type" unless the package is named
in `transpilePackages`. Vite consumers never see this.

That list grows with every package the app imports, and it is discoverable only
by hitting the error — the opposite of plug-and-play.

## Why so much is "partial"

Two systemic gaps, both visible across the whole package set.

### One package has both halves

A port is supposed to land as a package exposing a factory per half —
`createApiFoo({…})` for the backend and `createWebFoo({…})` for the frontend —
so a host declares the mount and owns nothing but config. `report-builder` is
the only package in `shared-packages` that does it
(`createApiReportBuilder` + `createWebReportBuilder`, `./server` + `./react` +
`./hono`, a package-owned Prisma fragment and an `ADOPTING.md`). `payments`
comes closest (`mountPayments` + `createPaymentFlows`).

Everything else exports a framework-free core and leaves the endpoints, the
screens and the wiring to the host. That is why `future-pay` still carries tens
of thousands of lines of what should be library code — 1,647 for RBAC, 2,854 for
entity history, 2,614 for entitlements, 1,340 + 656 + 1,747 for the event
system — and why a second app cannot have those subsystems by installing
anything.

### Package-owned Prisma models are the exception, not the rule

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
to prevent. That is 12-26, and it blocks more of this list than any single port
does.

## CI

`future-pay` consumes ten reusable workflows from `12-apps/ci`
(`monorepo-static`, `monorepo-tests`, `quality`, `mcp-contract`,
`mcp-test-coverage`, `rbac-coverage`, `entitlements-coverage`,
`nextjs-prod-smoke`, `cost-report`, `cd`). This repo consumes one:
`commitlint`, which is the only one that needs nothing in the consumer.

The rest are gated on repo shape. `monorepo-static.yml` and `monorepo-tests.yml`
run `turbo lint/check-types --affected` and restore per-package `.turbo` caches,
so they want a pnpm workspace + turborepo; `quality.yml` wants a set of
consumer-side configs and `quality:*` scripts. Giving base-app that shape is
12-27; adopting the pipeline on top of it is 12-10.

## What this repo deliberately does not copy from future-pay

Three SPAs, a realtime gateway, a docs site, Gherkin journeys, the payments
LOC burn-down and the MCP store-compliance artifacts. Those are Future-Pay's
problems, not every app's. A base repo ships one API host and one frontend.
