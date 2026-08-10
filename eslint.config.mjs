/**
 * The org's shared Next.js ESLint config, unmodified.
 *
 * `next lint` was removed in Next 16, so the `lint` script runs ESLint directly
 * against this flat config. Beyond the usual TypeScript/React/Next rules it
 * enforces the one convention a consumer of `@12-apps/ui` has to keep: MUI
 * primitives are imported from `@12-apps/ui/mui/*`, never from `@mui/material`
 * — which is what lets the shared components and the app share one theme.
 */
import { nextJsConfig } from "@12-apps/eslint-config/next-js";

export default [
  ...nextJsConfig,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts"],
  },
];
