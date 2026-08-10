/**
 * The typed API client the SPAs share.
 *
 * Every call is `/api`-relative and never learns where the API process lives:
 * Vite's dev proxy forwards it in development and the front proxy does in
 * production, so the same code runs in both.
 *
 * This is a placeholder for `@12-apps/app-shell` (12-18), which owns the real
 * one — including the response envelope and the error mapping that every
 * package's wire schemas assume. Keep it small enough to delete.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** GET a JSON resource, throwing {@link ApiError} on a non-2xx. */
export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!res.ok) throw new ApiError(res.status, `GET /api${path} responded ${res.status}`);
  return (await res.json()) as T;
}

/** What `/api/health` answers — the one endpoint that exists before any port. */
export interface Health {
  status: string;
  env: string;
  features: string[];
}

export const healthQuery = {
  queryKey: ["health"] as const,
  queryFn: () => apiGet<Health>("/health"),
};
