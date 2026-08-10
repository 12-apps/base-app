# base-app

The starting point for a new 12-apps application. It consumes the shared
**`@12-apps/*`** packages published from
[`12-apps/shared-packages`](https://github.com/12-apps/shared-packages) and
wires up the subsystems most apps end up needing — **every one of them switched
off by default**, so a fresh clone boots with nothing configured.

## What you get

- **The theme** — MUI + Emotion driven through `@12-apps/ui/mui/styles`, with
  the shared components rendering against it. MUI primitives are imported from
  `@12-apps/ui/mui/*` rather than `@mui/material`; ESLint enforces it.
- **A feature registry** — `lib/features.ts`, one flag per subsystem, all off.
  Turning one on is a single env var. Subsystems whose package does not exist
  yet still have their mount written and **commented** at the call site, next to
  the ticket that ships them, so adoption is uncommenting a block.
- **The org's commit gate** — `12-apps/ci`'s shared Conventional-Commits check,
  which needs nothing in this repo.
- **Moving dependency pins** — `@12-apps/*` are exact pins refreshed by a
  scheduled Renovate run, batched into one reviewable PR.

## Known sharp edges

Two package-side problems are worked around here rather than fixed here, because
the fix belongs upstream. Both are documented at their call site:

- `app/page.tsx` is a client component because 47 of the 51 `@12-apps/ui`
  components that call MUI's `styled` are missing a `"use client"` directive —
  which is what broke this repo's build on `main`.
- `next.config.mjs` lists every `@12-apps/*` package in `transpilePackages`,
  because they publish raw TypeScript source rather than built output.

## Subsystem status

Which flags do something today, and what the rest are waiting on, is tracked in
[docs/BASE-REPO-READINESS.md](./docs/BASE-REPO-READINESS.md). The short version:
RBAC and the PWA invite are mountable now; authentication, notifications, action
audit, the event system, entity history, entitlements, storage, observability
and onboarding are each missing one or both halves of their package.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm lint
pnpm check-types
pnpm build
```

No authentication token is needed to install: the `@12-apps/*` packages publish
**public** to `registry.npmjs.org`.

Copy `.env.example` to `.env.local` to turn a subsystem on.

## Dependency pins

`@12-apps/*` are pinned **exactly**, which makes every bump reviewable and
attributable — and means nothing raises them on its own. That is what
`.github/workflows/renovate.yml` is for; it needs a `RENOVATE_TOKEN` repo secret
and exits green with a warning until one exists. Without both halves the pins
rot silently: this repo's lockfile sat on `@12-apps/ui` 1.0.0 while 1.23.0 was
published, because `"latest"` was resolved once and then frozen in the lockfile.
