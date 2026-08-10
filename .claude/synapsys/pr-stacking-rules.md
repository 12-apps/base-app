---
name: pr-stacking-rules
description: Use gh stack — an ad-hoc based-on-branch PR is not a stack, and gets ZERO checks in future-pay
events: PreToolUse
trigger_pretool: Bash:gh\s+pr\s+create,Bash:gh\s+stack,mcp__github__create_pull_request:.*,mcp__github__merge_pull_request:.*,Bash:git\s+push
trigger_session: false
inject: full
---

### There are TWO ways to get a PR based on another branch, and only one gets CI

This is the distinction everything else hangs off, and it is easy to miss
because both produce a PR whose `base` is not `main`.

**1. A real GitHub stack** — created with the stacked-PRs feature (`gh stack`,
the web UI, or GitHub Mobile). Per [the docs][about] and the
[rollout guide][rollout]:

> CI checks triggered by pull requests on your default branch run for **all**
> pull requests in the stack, not just the bottom one.

> CI workflows triggering on pull requests targeting the default branch run for
> every stack member **with no configuration changes needed**.

> Required reviews, required status checks, and CODEOWNERS are all enforced
> against the stack's **base branch**.

So a `branches: [main]` filter — which `future-pay` has and this repo does not
— is **not** a reason to avoid stacking. GitHub runs the checks on every member
either way.

**2. An ad-hoc PR you merely pointed at another branch** — `gh pr create --base`,
or `create_pull_request({ base: "some-other-branch" })`. GitHub does not treat
this as a stack. The base does not match `branches: [main]`, so the workflow
matches nothing and the PR gets **zero check runs** — not a red run, *no run at
all*. Nothing blocks the merge and the code lands on the parent branch
unverified.

**This repo's own trigger has no branch filter** (`on: pull_request:`), so an
ad-hoc based-on-branch PR *does* get checks here. It is still the wrong tool:
GitHub does not know it is a stack, so none of the merge, rebase and retarget
automation below applies to it.

Where it bites hard is `future-pay`, whose trigger is
`pull_request: branches: [main]`. **Measured, not inferred:** future-pay#836 was
opened the ad-hoc way and had 0 check runs while every sibling PR in the same
batch had 20-26. Cross-repo work is where this rule earns its keep.

### Nothing needs enabling

> This is a workflow capability, not a gated feature. […] no setup or
> enablement — if teams already use pull requests, they can create stacks
> immediately.

(The CLI does define exit code 9, "Stacked pull requests are not enabled for
this repository", so a specific deployment may still refuse. Treat the rollout
guide as the rule and code 9 as the exception to read carefully if you see it.)

### Doing it

Needs `gh` 2.90.0+ and Git 2.20+.

```bash
gh extension install github/gh-stack

gh stack init                     # names the first branch; base = repo default
git add . && git commit -m "…"
gh stack add BRANCH-NAME          # next branch on top
gh stack add -Am "MESSAGE"        # or: stage + commit + branch, in one step
gh stack push                     # push every branch in the stack
gh stack submit                   # open/refresh the PRs with the right bases
gh stack view                     # where am I
gh stack sync --prune             # fetch, rebase, push, sync PR state
```

**Already opened them the ad-hoc way?** `gh stack link` converts existing PRs
into a stack on GitHub *without* local tracking:

```bash
gh stack link <branch-or-pr> <branch-or-pr> [...]
```

That is the repair for a PR sitting at zero checks — better than retargeting it
at `main` and losing the dependency, and much better than merging it on the
strength of its parent's green run.

### Merging a stack needs the ASYNCHRONOUS merge API

> Merging a stacked pull request requires the asynchronous merge API. Legacy
> endpoints cannot merge stacks.

This one bites automation, not humans. Any bot, script or MCP tool that merges
programmatically through a legacy merge endpoint will fail on a stacked PR —
check anything that merges for us before relying on stacks in a lane that
auto-merges.

Merging the **bottom** PR merges it and automatically rebases the rest onto the
base branch. Merging **mid-stack** merges everything below it; the ones above
stay open and re-target the stack's base. Merge requirements for every PR in the
stack come from the **bottom** PR's base, typically `main`.

### A base retarget does not start a CI run

Automatic or manual, the retarget emits no `pull_request` event this workflow's
`types:` list reacts to. The PR now matches the filter and **still has no
checks**, which looks exactly like the ad-hoc trap above.

**Push to the branch.** `synchronize` fires reliably. Same fix as a PR that never
got checks at all — and for the same reason, do NOT close/reopen: a PR opened
through the API may never emit a usable `opened` event, and a close/reopen risks
stranding it.

```bash
git commit --allow-empty -m "chore: trigger CI after base retarget"
git push
```

### Which check to require

Only **`CI Success`**. It aggregates the rest and lists `static` in `needs` on
purpose: a failing static tier leaves its dependents `skipped` rather than
`failure`, so an aggregation watching only the dependents would pass with zero
tests run.

### Limitations to know before planning a stack

- **Same repository only** — cross-fork stacks are not supported.
- **Not supported in GitHub Desktop.** CLI, web, Mobile, and Webhooks/REST/
  GraphQL only.
- Structural rule: if code in one layer depends on code in another, the
  dependency must be in the same branch or a **lower** one.
- Non-stacked PRs are unaffected — their `stack` field is `null`.

### PR lifecycle for a finished change

1. Open as a **draft** once the work is pushed.
2. Push fix commits until every check is green, re-diagnosing each failure.
3. Mark **ready for review** only when CI passes clean.
4. Resolve every review-bot comment with a follow-up commit, or a reply saying
   why it doesn't apply. The PR is done only when no bot item is unaddressed.

**If the PR for your branch is already MERGED**, treat follow-up work as a fresh
change — never stack new commits on merged history:

```bash
git fetch origin main && git checkout -B <branch-name> origin/main
```

[about]: https://docs.github.com/en/pull-requests/get-started/about-stacked-prs
[rollout]: https://docs.github.com/en/pull-requests/tutorials/roll-out-stacked-prs
