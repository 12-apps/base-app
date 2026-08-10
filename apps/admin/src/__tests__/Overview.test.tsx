import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `features` is resolved when `@base/spa-shell` is first imported, so flipping a
 * flag means resetting the module registry and importing again — stubbing after
 * the import would change nothing.
 *
 * `RbacProvider` has to come from the SAME reset registry as the page. React
 * context identity is per module instance: a provider from the stale registry
 * writes to a different context object than the page's `<Can>` reads from, and
 * the hook throws "must be used within an <RbacProvider>" while a provider is
 * plainly wrapping it.
 */
async function load(rbac: boolean) {
  vi.resetModules();
  vi.stubEnv("VITE_FEATURE_RBAC", rbac ? "1" : "");
  const [{ default: Overview }, { RbacProvider }] = await Promise.all([
    import("../pages/Overview"),
    import("@12-apps/rbac/react"),
  ]);
  return { Overview, RbacProvider };
}

function renderWith(
  Overview: () => ReactNode,
  RbacProvider: (props: { permissions: string[]; children: ReactNode }) => ReactNode,
  permissions: string[],
) {
  // `retry: false` or a rejected query sits through three exponential backoffs
  // before the error branch renders, and the test times out instead of failing
  // on the assertion.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RbacProvider permissions={permissions}>
        <Overview />
      </RbacProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", env: "test", features: ["rbac"] }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Overview", () => {
  it("denies the gated section when the actor holds no permissions", async () => {
    const { Overview, RbacProvider } = await load(true);

    renderWith(Overview, RbacProvider, []);

    await waitFor(() => {
      expect(screen.getByText(/tenant\.settings\.read/)).toBeInTheDocument();
    });
    expect(screen.queryByText("Tenant settings would render here.")).toBeNull();
  });

  it("renders the gated section once the permission is granted", async () => {
    const { Overview, RbacProvider } = await load(true);

    renderWith(Overview, RbacProvider, ["tenant.settings.read"]);

    await waitFor(() => {
      expect(screen.getByText("Tenant settings would render here.")).toBeInTheDocument();
    });
  });

  it("does not render the gate at all with RBAC off, since <Can> needs a provider", async () => {
    const { Overview, RbacProvider } = await load(false);

    renderWith(Overview, RbacProvider, []);

    await waitFor(() => {
      expect(screen.getByText(/RBAC is off/)).toBeInTheDocument();
    });
  });
});
