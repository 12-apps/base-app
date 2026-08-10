---
name: pr-stacking-rules
description: Stacking is fine HERE (CI has no branch filter) but gets zero check runs in future-pay
events: PreToolUse
trigger_pretool: Bash:gh\s+pr\s+create,mcp__github__create_pull_request:.*,Bash:git\s+push
trigger_session: false
inject: full
---

### You may stack here. You may not in future-pay.

GitHub is happy to stack: open a PR whose base is another PR's branch, and when
the parent merges GitHub **auto-retargets** the child onto the parent's base. So
the mechanics work everywhere. What differs between the org's repos is whether
CI runs on a stacked PR, and the difference is one line of YAML:

| repo | `pull_request` trigger | a stacked PR gets |
|---|---|---|
| **this repo** | `on: pull_request:` (no filter) | a full CI run |
| `shared-packages` | no filter | a full CI run |
| `future-pay` | `branches: [main]` | **zero check runs** |

In `future-pay` a stacked PR matches nothing — not a red run, *no run at all*,
so nothing blocks the merge and the code lands on the parent branch unverified.
The filter there is deliberate (it keeps runner spend on the PRs that gate a
release), so the answer is not to widen it.

**Here, stack freely.** Each PR in the stack gets its own verdict, and reviewing
a stack of small PRs beats one large one. If you are working across repos in one
change, remember the rule flips when you cross into `future-pay`.

### The retarget does not start a CI run

When the parent merges and GitHub moves the child's base, that alone emits **no
`pull_request` event** most workflows' `types:` list reacts to. The PR looks
current and still has no checks.

**Push to the branch.** `synchronize` fires reliably. Same fix as a PR that never
got checks at all — and for the same reason, do NOT close/reopen: a PR opened
through the API may never emit a usable `opened` event, and a close/reopen risks
stranding it.

```bash
git commit --allow-empty -m "chore: trigger CI after base retarget"
git push
```

### Which check to require

Require only **`CI Success`** in the branch ruleset. It aggregates the rest, and
it lists `static` in `needs` on purpose: if the static tier fails, its dependents
go `skipped` rather than `failure`, and an aggregation watching only the
dependents would pass with **zero tests run**.

### PR lifecycle for a finished change

1. Open as a **draft** once the work is pushed.
2. Push fix commits until every check is green, re-diagnosing each failure.
3. Mark **ready for review** only when CI passes clean.
4. Resolve every review comment with a follow-up commit, or a reply saying why it
   doesn't apply.

**If the PR for your branch is already MERGED**, treat follow-up work as a fresh
change — never stack new commits on merged history:

```bash
git fetch origin main && git checkout -B <branch-name> origin/main
```
