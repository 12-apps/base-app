# Starting a React application with the optimized CI baseline

Source baseline: [12-apps/ci v2.48.2](https://github.com/12-apps/ci/releases/tag/v2.48.2),
commit `be3300542208ebab5b30a75f58d018518f9d3459`, and the validated
[Future Pay #2273](https://github.com/12-apps/future-pay/pull/2273) safety work.
The reusable workflow entry points are commit-pinned. Their internal `@v2`
actions still follow the supported major; central execution identity invalidates
stored verdicts when those downloaded sources change.

## New repository checklist

1. Create a repository from this template. Rename the root package, app metadata,
   browser titles and `@base/*` workspace scope consistently. Commit the resulting
   lockfile with the pinned `pnpm@9.0.0`; install with `pnpm install --frozen-lockfile`.
2. Use Node 24 (`.node-version`, matching CI). The existing React 19/Vite client,
   admin and super-admin are the web starting points. Keep the Hono API and events
   process only when the product needs them. No credentials are required to boot
   the default, dormant feature configuration.
3. Run `pnpm test:ci-contracts`, `pnpm lint`, `pnpm check-types`, `pnpm test:ci`,
   and `pnpm build`. For an affected test rehearsal, set both `TURBO_SCM_BASE`
   to an existing base SHA and `TURBO_SCM_HEAD=HEAD`, then run
   `node scripts/ci-unit.mjs --affected`.
4. Open a draft PR. Confirm the CI contracts, lint, types, build, real unit-test
   counts and `CI Success` on that exact commit. Require `CI Success` and the
   existing commit-message gate in the repository's ruleset. This code does not
   enable branch protection or prove that a ruleset exists.
5. Only configure deployment providers, runner labels, optional feature secrets
   or paid infrastructure after the application chooses them. The starter's
   existing Dockerfiles and descriptors are examples, not an automatic deployment.
6. Preserve `push: [main]` as the full-suite safety net. If changing the default
   branch, update both CI triggers and the central `default-branch` test input.
7. Follow the experiment protocol before widening any optimization. Copy an
   optimization only when its inputs and tests apply to the new app.

## What is inherited

- Fail-fast static tier, package-level affected lint/types/tests/build, matching
  stack-aware bases and PR cancellation without cancelling the main safety net
- pnpm dependency cache, Turbo cache restoration, PR read-only Turbo cache usage,
  and persistent Vitest results for failed-first ordering, managed centrally
- Complete-tree verdict reuse for lint, types, units and builds. Every tracked
  path, mode and gitlink is counted. Central keys also cover commands, actual
  runtime, implementation and immutable base/merge-base provenance. Failed or
  cancelled lanes cannot supply passing evidence
- JUnit reports declared as Turbo outputs: a genuine task-cache hit restores its
  test evidence. The central guard rejects absent, zero and all-skipped evidence
- A consumer wrapper that widens an empty/unreadable affected selection to the
  full test suite and rejects an empty full task graph
- Root CI contract tests that always run without dependency installation, including
  docs-only PRs, plus fail-closed aggregation of the expected lane results
- Root workflow/script/TypeScript/runtime inputs in `globalDependencies`; Vite
  feature flags remain explicit build environment inputs

Whole-tree fingerprints intentionally invalidate on documentation edits too.
They safely optimize identical-tree retries; no cross-doc-commit hit rate or
runtime savings is claimed. Local Turbo cache replay is measured separately from
GitHub Actions lane-verdict reuse.

## Adding a workspace or input

Add genuine tests before adding a `test` script. Never use `echo no tests` or
`--passWithNoTests` as proof. The two shared source-only packages currently have
no direct test script; their consumers exercise them, and this limitation is
explicit. Each tested workspace must emit `reports/junit.xml`, list it in Turbo
outputs, and be included in `unit-junit-reports` and `vitest-cache-paths`.

Keep app runtime assets under their app/package, where `apps/**` and `packages/**`
route them to CI. New root runtime inputs need both the caller's positive
`code-paths` list and an appropriate Turbo input declaration. New Vite environment
variables that alter emitted bytes belong in `apps/<app>/turbo.json` `build.env`.
Test an input mutation and prove the relevant task hash changes before trusting
cache reuse. Do not hash credentials or copy environment secrets into the repo.

## Deliberate limits

Future Pay's symbol/database/route maps, selective migrations and per-test
skip-green need an actual application test/dependency graph. This starter has no
Prisma database or integration suite, so those mechanisms remain unconfigured;
copying merchant domains would select the wrong tests. Begin new fine-grained
selection in shadow mode with positive and negative parity tests, then measure
before enforcement. No Next.js smoke lane applies to these Vite apps.

The quality rollout remains [12-36](https://linear.app/12-apps/issue/12-36).
Subsystem adoption remains the existing [readiness matrix](../BASE-REPO-READINESS.md).
Do not confuse those open scopes with this CI baseline.
