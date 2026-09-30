# CI experiment ledger

## E001 — portable optimized React starter (2026-09-30, 12-10)

Baseline: base-app `1bd220fcc4b28aa504ad731bc0962c5b228ff679`, frozen central
`@v1` callers, five real app suites using `--passWithNoTests`, a features
`echo no tests yet` placeholder and an untested spa-shell test script.

Hypothesis: adopt the validated central v2.48.2 safety/cache machinery without
copying Future Pay's product-specific selectors. Require actual test signal and
complete cache inputs before taking any skip.

### Outcomes so far

- 20 dependency-free consumer contract tests passed locally, zero skipped.
  Covered missing/failed/cancelled/skipped dependencies, malformed selection,
  zero-task fallback, immutable source pins, JUnit output declarations and
  complete-tree invalidation (including file modes and unusual filenames).
- First local install attempt used the environment's pnpm 11 instead of the
  repository's pnpm 9. It reported ignored lifecycle builds and wrote a local
  approval template. Rejected that run as baseline evidence; restored the
  workspace manifest and reinstalled with exact pnpm 9. No approval-policy
  mutation or package-manager upgrade is included in the change.
- Complete-tree fingerprints use Git's tree object directly. A second custom
  hash implementation and Future Pay's ignore map were rejected: both add
  unnecessary input-omission risk to a generic template.

### Required before completion

Record exact local suite/build/static results, cold/warm task-cache behavior,
negative signal cases, PR job evidence and the post-merge full run here or in a
linked PR experiment comment. A test that never ran, a skipped check or a replayed
log is not a fresh execution. GitHub lane-verdict savings remain unclaimed until
a live cache hit has been observed and checked against the exact inputs.

### Local execution evidence (Node 24.19.0, pnpm 9.0.0)

- `pnpm turbo run lint check-types build --summarize`: 19/19 tasks passed,
  0 cache hits, Turbo elapsed 14.504 s. Five application artifacts built.
- `node scripts/ci-unit.mjs`: 27 passing cases in six files across five apps,
  5/5 tasks, 0 cache hits, Turbo elapsed 9.945 s. The central v2.48.2 signal
  parser confirmed 27 executed cases across five JUnit reports.
- Deleted the generated app JUnit files, repeated the exact unit command:
  5/5 Turbo cache hits, 13 ms reported by Turbo; all five reports restored and
  the central parser again confirmed 27 cases. This is replayed evidence,
  not a second fresh test execution or a GitHub lane-verdict cache measurement.
- Set `TURBO_SCM_BASE=HEAD TURBO_SCM_HEAD=HEAD` on a clean committed tree:
  the affected dry-run selected no executable test task; the wrapper logged
  the full-suite fallback and ran five tasks (27 cases, 0 cache hits, 3.510 s).
- `node --test` contract suite: 20 passed, zero skipped; dual spec/JUnit output
  was accepted by the exact central signal parser as 20 executed cases.
- Central signal-parser negative fixtures: missing, zero-test, all-skipped and
  truncated JUnit each exited 1. Aggregate negative cases reject every missing,
  failed, cancelled or unexpectedly skipped required dependency.
- `actionlint` 1.7.7 passed all three workflow files; the caller's input names
  were checked against both reusable workflow declarations at the pinned commit.
- Booted the built API artifact and fetched `/health`: HTTP 200 with dormant
  feature list `[]`. No deploy was started.
- The environment's default pnpm 11 also interfered with an initial task run
  after installation; that attempt failed before any task passed and is excluded
  from timings. Explicit pnpm 9 PATH fixed the local harness; no repo workaround.
- Branch metadata reported main `protected: false` at verification time. Required
  checks are documented as repository setup, not represented as already enabled.

Timing is one local observation on this machine, not a forecast of runner cost.

## E002 — full-suite execution signal gap (2026-09-30, FUT-2098)

Independent adversarial review of E001 found one blocker in the inherited
central workflow: v2.48.2 runs the application JUnit signal guard only for
`pull_request`. Full push/dispatch/schedule runs can pass when every case skips,
although strict Vitest rejects a suite with no files. Removing
`--passWithNoTests` does not close an all-skipped suite.

Reproduced with installed Vitest 3.2.7: a real `test.skip` case and
`vitest run --reporter=default --reporter=junit --outputFile.junit=...` exited 0,
reporting one skipped test. Running the existing central parser on that report
exited 1 with `lane executed zero tests`. The parser is correct; the workflow
condition prevents it from running. No report-parser copy is needed here.

Controls: E001's real five-suite reports have 27 executed cases and pass; missing,
zero, skipped and truncated fixture reports fail. The proposed central fix must
cover unsharded and matrix unit/integration lanes on all events, including report
staging and post-matrix signal jobs. Zero planned work remains a legitimate skip;
label bypass remains PR-only so it cannot weaken the full-suite safety net.

The first base-app PR stays draft until the focused
[FUT-2098](https://linear.app/12-apps/issue/FUT-2098) engine change is tested,
reviewed and released, then its verified pin is adopted here. Successful PR CI
alone is not evidence that this full-push gap is closed. The remaining base-app
review found no additional blocker; runtime/cache claims remain bounded by E001.
