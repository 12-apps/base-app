---
name: prisma-partials-are-copied-never-symlinked
description: A symlinked Prisma migration is SILENTLY SKIPPED — Prisma lstats the folder, so a green deploy changes no schema
events: UserPromptSubmit,PreToolUse
trigger_prompt: \b(symlink|ln -s|prisma:sync|sync-.*-schema|schema partial|migrations? folder|adopt (a|the) partial)\b
trigger_pretool: Bash:ln\s+-s,Write:"file_path":"[^"]*prisma/(schema|migrations)/,Edit:"file_path":"[^"]*prisma/(schema|migrations)/
trigger_session: false
inject: full
---

### A package owns its models; this repo gets a COPY

Packages in `12-apps/shared-packages` that own persisted models keep the model
file **and its migrations** in their own folder:

```
packages/<pkg>/prisma/<pkg>.prisma        # the model partial
packages/<pkg>/prisma/migrations/         # the package's own migrations
```

A host adopts them by running that package's sync script, which copies both into
the host's multi-file schema folder. **Hosts never hand-copy models, and never
hand-edit a synced copy** — the next sync reverts it, and the `prisma:sync:check`
variant goes red in CI.

`packages/db` is where they land here (12-33). Its own `schema.prisma` is
**datasource + generator only** — this repo owns no domain models on purpose,
and `prisma generate` with zero adopted partials must succeed. That is the
acceptance test for "a base repo, not a fork of somebody's product".

### The symlink trap — this one is silent

It is tempting to symlink the partial and its migrations rather than copy them:
one source of truth, no drift. Do not.

**Prisma enumerates the migrations folder with `lstat`.** A symlinked migration
therefore reports `isDirectory() === false` and is **silently skipped** — no
error, no warning. The deploy goes green having applied no schema change, and
the failure surfaces later as a missing column in production.

The model partial has the same problem in a different tool: `turbo prune` copies
only what the dependency graph reaches, so if the owning package is not a
**declared dependency** of the package holding the schema, it is dropped from
the build context, the committed symlink dangles, and `prisma generate` fails.

Both rules are gated by a test in `shared-packages`. They exist because both
happened.

### A package that owns no tables should not ship a partial

Check before assuming. `@12-apps/auth` looks like it should own `User` /
`Account` / `Session` — it does not: the strategy is `jwt` with **no adapter**,
so it has no tables at all and there is nothing to sync. Your user record is
yours, created by whatever your sign-in gate does.

Shipping a partial for tables nothing writes is worse than shipping none,
because every host then adopts migrations it does not need.
