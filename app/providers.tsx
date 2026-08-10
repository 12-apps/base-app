"use client";

import type { ReactNode, JSX } from "react";
import { ThemeProvider, createTheme } from "@12-apps/ui/mui/styles";
import { CssBaseline } from "@12-apps/ui/mui/CssBaseline";
import { RbacProvider } from "@12-apps/rbac/react";
import { InstallInvite } from "@12-apps/pwa/react";

import { features } from "../lib/features";

// A downstream consumer owns its theme; the shared components render against it.
const theme = createTheme();

export interface ProvidersProps {
  children: ReactNode;
  /**
   * The permissions the current actor holds, ALREADY RESOLVED on the server.
   *
   * `@12-apps/rbac` deliberately never resolves them itself — it narrows against
   * what the host passes in. The host half that computes this set (session →
   * membership → roles → permissions) is the port tracked by 12-12 and 12-13;
   * until it lands the scaffold passes an empty set, so `<Can>` denies
   * everything, which is the correct default for a base repo.
   */
  permissions?: readonly string[];
}

/**
 * Every provider this app mounts, each behind its flag in `lib/features.ts`.
 *
 * Flags are off by default, so a fresh clone renders the page with nothing but
 * the theme. What is COMMENTED below is not aspiration — it is the exact mount
 * each subsystem will take, kept next to its flag so adopting one is a matter
 * of installing the package and uncommenting the block. Each carries the ticket
 * that ships the package it needs.
 */
export function Providers({
  children,
  permissions = [],
}: ProvidersProps): JSX.Element {
  let tree = children;

  // ── RBAC (@12-apps/rbac) ───────────────────────────────────────────────────
  // Fully available today. The provider is a pure context over a resolved
  // permission set, so it mounts with no backend; what is still missing is the
  // server half that fills the set (12-13).
  if (features.rbac) {
    tree = <RbacProvider permissions={permissions}>{tree}</RbacProvider>;
  }

  // ── Entitlements (@12-apps/entitlements) ───────────────────────────────────
  // The package is published, but `EntitlementsProvider` takes a server-resolved
  // snapshot (`engine.toSnapshot(tenantId)`) and there is no API half to produce
  // one — that mount is 12-19.
  //
  // if (features.entitlements) {
  //   tree = (
  //     <EntitlementsProvider snapshot={snapshot} onUpsell={openUpgradeDialog}>
  //       {tree}
  //     </EntitlementsProvider>
  //   );
  // }

  // ── Onboarding (@12-apps/onboarding) ───────────────────────────────────────
  // Published, but `OnboardingProvider` needs a persistence `store` and the
  // `OnboardingState` model, neither of which the package owns yet — 12-23.
  //
  // if (features.onboarding) {
  //   tree = (
  //     <OnboardingProvider featureKey="setup" store={store} initialState={null}>
  //       {tree}
  //     </OnboardingProvider>
  //   );
  // }

  // ── Notifications (no package yet) ─────────────────────────────────────────
  // The inbox, the bell and the preference screen live in future-pay's private
  // `@repo/spa-shared` + `@repo/notifications`. Extraction is 12-15.
  //
  // if (features.notifications) {
  //   tree = <NotificationsProvider apiBase="/api">{tree}</NotificationsProvider>;
  // }

  // ── Events (@12-apps/realtime) ─────────────────────────────────────────────
  // The bus is published; the browser client, reconnect policy and hooks are
  // still in `@repo/spa-shared/realtime` — 12-16.
  //
  // if (features.events) {
  //   tree = <EventsProvider apiBase="/api">{tree}</EventsProvider>;
  // }

  // ── Observability (@12-apps/observability-frontend) ────────────────────────
  // NOT mountable here yet, and not for want of a flag: the package peers on
  // `react-router-dom` and `vite`, so a Next.js host cannot install it. Making
  // the browser half router-agnostic is part of 12-21.
  //
  // if (features.observability) {
  //   tree = <RouteErrorBoundary>{tree}</RouteErrorBoundary>;
  // }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {tree}
      {/* The install invite renders nothing until the browser offers one. */}
      {features.pwa ? <InstallInvite what="base-app" enabled /> : null}
    </ThemeProvider>
  );
}
