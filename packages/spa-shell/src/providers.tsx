import type { ReactNode, JSX } from "react";
import { ThemeProvider, createTheme } from "@12-apps/ui/mui/styles";
import { CssBaseline } from "@12-apps/ui/mui/CssBaseline";
import { RbacProvider } from "@12-apps/rbac/react";
import { InstallInvite } from "@12-apps/pwa/react";
import { createWebAuth } from "@12-apps/auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { features } from "./features";

// One theme for all three SPAs. A real app overrides it per surface if the
// backoffice should not look like the storefront; the default is that it should.
const theme = createTheme();

const queryClient = new QueryClient();

/**
 * The browser half of `@12-apps/auth` (12-12).
 *
 * Built at module scope on purpose: `SessionProvider` and `useSession` are a
 * matched pair sharing one React context, so building them per render would
 * hand every render a new context and make `useSession` throw inside its own
 * provider. `basePath` must match the API's mount — `/api/auth` is the default
 * on both sides, and the SPA reaches it through the same proxy as every other
 * `/api` call, so the session cookie is first-party.
 */
const { SessionProvider, useSession } = createWebAuth();

export { useSession };

export interface ProvidersProps {
  children: ReactNode;
  /** Shown by the install invite. Each SPA passes its own. */
  appName: string;
  /**
   * The permissions the current actor holds, ALREADY RESOLVED by the API.
   *
   * `@12-apps/rbac` deliberately never resolves them itself — it narrows against
   * what the host passes in. The server half that computes this set (session →
   * membership → roles → permissions) is 12-12 and 12-13; until it lands every
   * SPA passes an empty set, so `<Can>` denies everything. That is the correct
   * default for a base repo: a backoffice that showed its screens before anyone
   * wired up authorization would be teaching the wrong lesson.
   */
  permissions?: readonly string[];
}

/**
 * Every provider the SPAs mount, each behind its flag in `@base/features`.
 *
 * Flags are off by default, so a fresh clone renders with nothing but the theme
 * and the query client. What is COMMENTED below is the exact mount each
 * subsystem will take, kept next to its flag so adopting one is installing the
 * package and uncommenting a block. Each names the ticket that ships it.
 *
 * This whole module is a placeholder for `@12-apps/app-shell` (12-18). Adding a
 * second private shell is the thing that ticket exists to stop, so anything
 * bigger than a mount belongs there instead of here.
 */
export function Providers({
  children,
  appName,
  permissions = [],
}: ProvidersProps): JSX.Element {
  let tree = children;

  // ── Authentication (@12-apps/auth) — 12-12 ─────────────────────────────────
  // Mounted OUTERMOST of the flagged providers (it is applied first, so it ends
  // up wrapping the rest): everything above reads who is signed in, and nothing
  // auth needs comes from them. RBAC in particular is downstream — the
  // permission set it narrows against is resolved for the session's actor.
  //
  // The provider only fetches `/api/auth/session`; with the API's own flag off
  // that 404s and the session resolves to `null`, which is the same answer as a
  // signed-out visitor. So a half-configured clone degrades to "nobody is
  // signed in" rather than to a crash.
  if (features.auth) {
    tree = <SessionProvider>{tree}</SessionProvider>;
  }

  // ── RBAC (@12-apps/rbac) — mountable today ─────────────────────────────────
  // A pure context over a resolved permission set, so it needs no backend; what
  // is missing is the server half that fills the set (12-13).
  if (features.rbac) {
    tree = <RbacProvider permissions={permissions}>{tree}</RbacProvider>;
  }

  // ── Observability (@12-apps/observability-frontend) — 12-21 ────────────────
  // Installable now that these are Vite SPAs: the package peers on
  // `react-router-dom` and `vite`, which a Next host could not satisfy. Wiring
  // it needs the served-DSN endpoint on the API side — the DSN is SERVED rather
  // than baked into the bundle on purpose.
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

  // ── Impersonation (no package) — 12-24 ─────────────────────────────────────
  // The banner and exit control belong in super-admin and admin. The write
  // guard is the load-bearing half and lives on the API side.
  //
  // if (features.impersonation) {
  //   tree = <ImpersonationBanner>{tree}</ImpersonationBanner>;
  // }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {tree}
        {/* Renders nothing until the browser offers an install prompt. */}
        {features.pwa ? <InstallInvite what={appName} enabled /> : null}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
