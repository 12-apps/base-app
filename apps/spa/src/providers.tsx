import type { ReactNode, JSX } from "react";
import { ThemeProvider, createTheme } from "@12-apps/ui/mui/styles";
import { CssBaseline } from "@12-apps/ui/mui/CssBaseline";
import { RbacProvider } from "@12-apps/rbac/react";
import { InstallInvite } from "@12-apps/pwa/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { features } from "./features";

// A downstream consumer owns its theme; the shared components render against it.
const theme = createTheme();

const queryClient = new QueryClient();

export interface ProvidersProps {
  children: ReactNode;
  /**
   * The permissions the current actor holds, ALREADY RESOLVED by the API.
   *
   * `@12-apps/rbac` deliberately never resolves them itself — it narrows against
   * what the host passes in. The server half that computes this set (session →
   * membership → roles → permissions) is 12-12 and 12-13; until it lands the
   * scaffold passes an empty set, so `<Can>` denies everything, which is the
   * correct default for a base repo.
   */
  permissions?: readonly string[];
}

/**
 * Every provider this app mounts, each behind its flag in `@base/features`.
 *
 * Flags are off by default, so a fresh clone renders with nothing but the theme
 * and the query client. What is COMMENTED below is the exact mount each
 * subsystem will take, kept next to its flag so adopting one is installing the
 * package and uncommenting a block. Each names the ticket that ships it.
 */
export function Providers({
  children,
  permissions = [],
}: ProvidersProps): JSX.Element {
  let tree = children;

  // ── RBAC (@12-apps/rbac) — mountable today ─────────────────────────────────
  // A pure context over a resolved permission set, so it needs no backend; what
  // is missing is the server half that fills the set (12-13).
  if (features.rbac) {
    tree = <RbacProvider permissions={permissions}>{tree}</RbacProvider>;
  }

  // ── Observability (@12-apps/observability-frontend) — 12-21 ────────────────
  // Now installable: the package peers on `react-router-dom` and `vite`, which
  // a Next host could not satisfy and this one does. Wiring it needs the served
  // DSN endpoint on the API side, which is the rest of 12-21 — the DSN is
  // SERVED rather than baked into the bundle on purpose.
  //
  // if (features.observability) {
  //   const RouteErrorBoundary = createRouteErrorBoundary({ fallback: RouteCrash });
  //   tree = <RouteErrorBoundary>{tree}</RouteErrorBoundary>;
  // }

  // ── Entitlements (@12-apps/entitlements) — 12-19 ───────────────────────────
  // Published, but `EntitlementsProvider` takes a server-resolved snapshot
  // (`engine.toSnapshot(tenantId)`) and there is no API half to produce one.
  //
  // if (features.entitlements) {
  //   tree = (
  //     <EntitlementsProvider snapshot={snapshot} onUpsell={openUpgradeDialog}>
  //       {tree}
  //     </EntitlementsProvider>
  //   );
  // }

  // ── Onboarding (@12-apps/onboarding) — 12-23 ───────────────────────────────
  // Needs a persistence `store` and the `OnboardingState` model, neither of
  // which the package owns yet.
  //
  // if (features.onboarding) {
  //   tree = (
  //     <OnboardingProvider featureKey="setup" store={store} initialState={null}>
  //       {tree}
  //     </OnboardingProvider>
  //   );
  // }

  // ── Notifications (@12-apps/notifications) — 12-15 ─────────────────────────
  // The inbox, the bell and the preference screen are in future-pay's private
  // `@repo/spa-shared` + `@repo/notifications`.
  //
  // if (features.notifications) {
  //   tree = <NotificationsProvider>{tree}</NotificationsProvider>;
  // }

  // ── Events (@12-apps/realtime) — 12-16 ─────────────────────────────────────
  // Opens the socket to `apps/events`. The browser client, reconnect policy and
  // hooks are still in `@repo/spa-shared/realtime`.
  //
  // if (features.events) {
  //   tree = <EventsProvider url={eventsUrl}>{tree}</EventsProvider>;
  // }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {tree}
        {/* Renders nothing until the browser offers an install prompt. */}
        {features.pwa ? <InstallInvite what="base-app" enabled /> : null}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
