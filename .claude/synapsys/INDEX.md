# Synapsys memories — base-app (local)

One memory per file. Frontmatter declares triggers + lifecycle events.

```
---
name: example
description: one-line summary
events: UserPromptSubmit,PreToolUse
trigger_prompt: \b(jira|ticket)\b
trigger_pretool: Bash:git push,Bash:rm -rf
trigger_session: false
inject: summary
---

Body of the memory…
```

These are seeded from `12-apps/future-pay`, which learned them the expensive
way. A memory here is kept only when it is true of THIS repo — where the two
repos differ (PR stacking is the live example), the difference is the point of
the memory rather than a detail in it.
