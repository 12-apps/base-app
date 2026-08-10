import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `features` resolves at import time, so flipping a flag needs a fresh module —
 * and `RbacProvider` has to come from the SAME reset registry as the page, or
 * its context is a different object than the page's `<Can>` reads from.
 */
async function load(rbac: boolean) {
  vi.resetModules();
  vi.stubEnv("VITE_FEATURE_RBAC", rbac ? "1" : "");
  const [{ default: Platform }, { RbacProvider }] = await Promise.all([
    import("../pages/Platform"),
    import("@12-apps/rbac/react"),
  ]);
  return { Platform, RbacProvider };
}

function renderWith(
  Platform: () => ReactNode,
  RbacProvider: (props: { permissions: string[]; children: ReactNode }) => ReactNode,
  permissions: string[],
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RbacProvider permissions={permissions}>
        <Platform />
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

describe("Platform", () => {
  it("denies the tenant list when the actor holds no permissions", async () => {
    const { Platform, RbacProvider } = await load(true);

    renderWith(Platform, RbacProvider, []);

    await waitFor(() => {
      expect(screen.getByText(/platform\.tenants\.read/)).toBeInTheDocument();
    });
    expect(screen.queryByText("The tenant list would render here.")).toBeNull();
  });

  it("gates on a PLATFORM permission, not the tenant one admin uses", async () => {
    const { Platform, RbacProvider } = await load(true);

    // The permission that opens the admin console must not open this one.
    renderWith(Platform, RbacProvider, ["tenant.settings.read"]);

    await waitFor(() => {
      expect(screen.getByText(/platform\.tenants\.read/)).toBeInTheDocument();
    });
    expect(screen.queryByText("The tenant list would render here.")).toBeNull();
  });

  it("renders the tenant list once the platform permission is granted", async () => {
    const { Platform, RbacProvider } = await load(true);

    renderWith(Platform, RbacProvider, ["platform.tenants.read"]);

    await waitFor(() => {
      expect(screen.getByText("The tenant list would render here.")).toBeInTheDocument();
    });
  });
});
