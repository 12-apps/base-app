---
name: ci-work-must-be-tested
description: A CI optimization needs positive and negative proof, measured results and a safe merge
events: UserPromptSubmit,PreToolUse
trigger_prompt: \b(ci|pipeline|workflows?|cache|turbo|vitest|affected tests?|starter)\b
trigger_pretool: Bash:git\s+push,Bash:gh\s+pr\s+merge
trigger_session: false
inject: full
---

## Delivery protocol

For CI work, testing and documenting the outcome are part of the request.

1. Open a draft PR against the current default branch. Preserve unrelated work.
2. Exercise the intended path and an adversarial case that must fail. A green
   exit, `tasks: 0`, an all-skipped report or replayed Turbo log is not execution.
3. Record commands, commit/run links, actual counts, elapsed times and whether
   caches were cold, warm or replayed in `docs/ci/EXPERIMENTS.md`. Record failed
   attempts, rejected approaches and rollback reasons too. Never invent savings.
4. Check the exact final head's CI, all required checks and review feedback.
   Mark ready only after the evidence is green. Merge only when authorized and
   safe; never replace missing checks with an administrative bypass.
5. Verify the post-merge full suite. If an optimization needs a live trigger,
   construct a bounded test that exercises it; do not declare it proved because
   the next unrelated commit might exercise it. Ask when scope or authority is
   genuinely unclear.

## Mechanism versus application policy

Reusable selection, result parsing, cache provenance and workflow orchestration
belong in `12-apps/ci`. The consumer owns its callers, task outputs, test commands,
input declarations and this documentation. Do not fork Future Pay's machinery
or copy its domain maps, migrations, seeds, deployment settings or secrets.

Current safe defaults: package-level affected selection, complete merge-tree
fingerprints, positive JUnit signal, full push safety net and an always-run
consumer contract suite. More granular skipping needs its own parity evidence.
