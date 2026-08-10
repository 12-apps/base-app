import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "../pages/Home";

function renderHome() {
  // `retry: false` or a rejected query sits through three exponential backoffs
  // before the error branch renders, and the test times out instead of failing
  // on the assertion.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Home />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Home", () => {
  it("shows the subsystems the API reports, not this bundle's own flags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok", env: "test", features: ["rbac", "pwa"] }),
      }),
    );

    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/enabled: rbac, pwa/)).toBeInTheDocument();
    });
  });

  it("says so when the API answers with no subsystems enabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok", env: "test", features: [] }),
      }),
    );

    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/no subsystems enabled/)).toBeInTheDocument();
    });
  });

  it("tells you the API is down instead of rendering a blank state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));

    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/API is not answering/)).toBeInTheDocument();
    });
  });
});
