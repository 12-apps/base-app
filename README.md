# base-app

A scaffold Next.js application that consumes the shared **`@12-apps/*`**
packages (published from
[`12-apps/shared-packages`](https://github.com/12-apps/shared-packages) to
GitHub Packages). It exists to prove the packages install and work from a
standalone downstream repo.

## What it demonstrates

- Installing `@12-apps/ui` (and its MUI/Emotion peer stack) from the GitHub
  Packages registry via `.npmrc`.
- Driving the app theme through `@12-apps/ui/mui/styles` (`ThemeProvider` +
  `createTheme`).
- Rendering shared components (`Heading`, `Text`) and primitives (`Box`,
  `Stack`) on a page.

## Prerequisites

The `@12-apps` scope resolves to GitHub Packages (see `.npmrc`). Authentication
uses a token with `read:packages` on the `12-apps` org, provided via the
`NODE_AUTH_TOKEN` environment variable:

```bash
export NODE_AUTH_TOKEN=<a GitHub token with read:packages>
pnpm install
```

In CI the workflow sets `NODE_AUTH_TOKEN` from the job's `GITHUB_TOKEN`.

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm check-types
```

> Note: `@12-apps/*` dependencies are pinned to the `latest` dist-tag, so this
> app tracks the most recently published version of each package.
