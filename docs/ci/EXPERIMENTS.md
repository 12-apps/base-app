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

### Central correction evidence

The focused engine PR is [12-apps/ci #157](https://github.com/12-apps/ci/pull/157),
initial reviewed head `32cdc43b2c5ce54e5db0e9edce5bc963b8ea9a89`.
The parser itself is unchanged; the conditions and matrix report wiring are fixed.

- Existing targeted baseline: 244/244 passing. Corrected targeted set: 276/276.
- New controls executed against the old YAML: 31 cases, 15 pass and 16 fail
  (12 full-event false approvals plus four wiring assertions). Corrected YAML:
  31/31 passing. The harness executes real node:test JUnit and the central parser
  under the workflow conditions, rather than checking only text matches.
- Real Vitest 3.2.7: all-skipped runner exit 0 / signal guard exit 1; one executed
  case plus one skipped case: runner exit 0 / guard exit 0.
- Independent central review reported no findings. actionlint and diff checks
  passed. Hosted Self Tests: [run 36728972179](https://github.com/12-apps/ci/actions/runs/36728972179)
  (terminal result must be checked before release/adoption).
- Rejected first node:test harness attempt: inherited `NODE_TEST_CONTEXT` made
  the subprocess emit internal test output rather than JUnit. Removing that
  variable from the subprocess environment corrected the harness; rejected
  output is not counted as evidence. No production parser change was needed.
- Consumer prerequisite before advancing the shared major: Future Pay's full
  unit command must emit JUnit, and Turbo must restore those reports on cache hits.
  A full-event guard must not be released before its existing consumers can
  satisfy the contract.

### Additional starter cache evidence

- Real Turbo dry-run input mutation: `VITE_FEATURE_AUTH` changed the build hash
  for all three SPAs. Editing `tsconfig.base.json`, `.node-version` or the CI
  workflow changed all 12 executable build/type-check task hashes.
- Hosted [CI run 36727638615, attempt 2](https://github.com/12-apps/base-app/actions/runs/36727638615/attempts/2)
  re-ran the original `d7dde643` head. Lint and Build logged exact lane-verdict
  cache hits and skipped installation/work; Unit Plan reused its earlier
  passing verdict and created no unit shard. The first attempt executed 27
  cases. Root contracts still executed and CI Success passed. See the
  [experiment comment](https://github.com/12-apps/base-app/pull/11#issuecomment-5913272878).
  This is observed reuse, not a claimed time-savings percentage. A central
  implementation change must invalidate these old verdict identities.

### Hosted central result verified

Central PR #157 at `32cdc43b2c5ce54e5db0e9edce5bc963b8ea9a89` completed with
8 successful checks and one intentional skip, no pending or failing checks.
[Self Tests job 109933164052](https://github.com/12-apps/ci/actions/runs/36728972179/job/109933164052)
logged 31/31 full-suite wiring tests and 22/22 signal-guard tests, including all
16 lane/event/shard combinations. Example executed case: unit push with three
shards rejects zero execution and accepts one executed case; integration dispatch
has the same positive/negative proof. CodeQL and its three analyzers passed.
These are hosted runner/parser/condition tests, not a claim that a real consumer
push workflow has already exercised the corrected scheduler path. The release
still waits for the existing Future Pay full-command/JUnit-cache prerequisite.

### Central reconciliation and final pre-release proof

While E002 was under review, [ci #158](https://github.com/12-apps/ci/pull/158)
merged a separate XML parser fix for `>` inside quoted attributes. E002 was
reconciled onto that new main without reverting the parser fix. The earlier
v2.48.3 release contains #158 only; it is not evidence that #157 was released.

Final reviewed ci #157 head: `4f101f09dff7c5a18178bdc4961a3d58ed3a4804`.
[Self Tests run 36734581363](https://github.com/12-apps/ci/actions/runs/36734581363),
[Action Scripts job 109952804649](https://github.com/12-apps/ci/actions/runs/36734581363/job/109952804649),
and CodeQL job `109952989287` completed successfully. Hosted logs confirm
24/24 signal-guard tests and 31/31 full-suite wiring tests. Local reconciled
validation passed 278/278; independent review passed 55/55 with no findings.

Earlier baseline/fix counts remain above as historical observations, not the
final reconciled count. This proves the current engine implementation and its
runner/report/condition controls. A full consumer push is still pending rollout.
Future Pay's final prerequisite head `03a3440d` is being checked separately;
neither that merge nor the release is assumed from the green central PR.

## E003 — public CI stays on GitHub-hosted runners (2026-09-30, 12-10)

Requirement: base-app is open source and must not use the AWS cloud. This covers
CI runners, cache/artifact storage and deployment wiring; the React/Vite/Hono
applications are unchanged.

### Baseline observation and gap

- On original [CI run 36727638615](https://github.com/12-apps/base-app/actions/runs/36727638615),
  all 18 executed job entries across attempts 1 and 2 reported `ubuntu-latest`
  and the `GitHub Actions` runner group. Skipped jobs are not runner evidence.
- At pre-change head `59d8ee3f86c6bccebbf41349eafc07af78b030e3`, all ten executed
  jobs in [CI run 36735923689](https://github.com/12-apps/base-app/actions/runs/36735923689)
  and the [commit-message job](https://github.com/12-apps/base-app/actions/runs/36735923632)
  also used the GitHub Actions runner group with `ubuntu-latest`.
  [Scheduled Renovate](https://github.com/12-apps/base-app/actions/runs/36734479170)
  used the same standard hosted runner. Its earlier step name “self-hosted
  Renovate” described Renovate's execution mode, not an AWS/self-hosted runner.
- The central workflows nevertheless selected `vars.CI_RUNNER || 'ubuntu-latest'`.
  These successful executions show the effective historical assignment, not an
  audit of organization/repository variable settings or a guarantee that an
  inherited override could never redirect a later run. The available GitHub
  connection does not expose variable administration; no settings were changed.

### Enforcement and controls

The consumer now supplies `runner: ubuntu-latest` to static, tests and commitlint.
The shared engine owns and tests input-over-variable precedence. Root contracts,
CI Success and Renovate already use literal hosted runner labels. The consumer
suite checks all six job declarations, rejects removal of any explicit choice,
rejects self-hosted/AWS/inherited-variable choices, and rejects AWS action/storage,
secret inheritance and external Turbo remote-cache wiring.

Local dependency-free contracts: `node --test scripts/__tests__/*.test.mjs`
passed 24/24, zero skipped (221.893 ms test-runner duration). The four new tests
include six removed-selector mutations, nine unsafe-selector mutations and five
cloud/cache-wiring mutations, each expected to fail the policy assertion. These
are controlled test fixtures; no AWS job or infrastructure was started.

Additional local checks (Node 24.19.0, exact pnpm 9.0.0):

- Real unit execution passed 27 cases across five reports, five task cache misses,
  Turbo 5.409 s; the central report parser confirmed all 27 executed cases.
- A first static/build run overlapped the unit run and was killed with exit 137
  during `super-admin` type checking (10/19 tasks completed, no cache hits).
  This failed run is not counted as a pass or used for a timing comparison.
- Retried `pnpm turbo run lint check-types build --concurrency=2 --force --summarize`
  after unit completion: all 19 tasks executed successfully, no cache hits,
  Turbo 19.481 s. Bounded local concurrency required no workflow change.
- Actionlint 1.7.7 and `git diff --check` passed. Peer review of the caller and
  runner-contract delta found no blocker; final release compatibility is still
  a separate check.

Release-pin validation, final-head hosted CI and the post-merge full push remain
required before this change is complete. No GitHub billing savings are claimed.

### Released runner API adopted

[ci #161](https://github.com/12-apps/ci/pull/161) was normally released as
[v2.49.0](https://github.com/12-apps/ci/releases/tag/v2.49.0), commit
`ea88024608cb8c9f5ce8fe655fb64e6866bbf469`. This consumer pins that immutable
commit in all reusable callers and the root signal action. Inspected the released
sources: static, tests and commitlint declare optional `runner` and all 15 of
their job declarations use `inputs.runner || vars.CI_RUNNER || 'ubuntu-latest'`.
The explicit consumer choice therefore precedes an inherited AWS fleet label.

After the pin update, 24/24 local contracts passed again (209.919 ms), Actionlint
and whitespace validation passed. Hosted consumer validation is still required.
This runner release deliberately excludes central #157; E002's full-push guard
remains a separate adoption/merge gate and is not claimed fixed by v2.49.0.
