import { describe, expect, it, vi } from "vitest";

import { createApp } from "../app";
import { createAuth } from "../auth";
import { resolveFeatures, type Features } from "@base/features";

const env = { port: 3000, spaOrigin: "http://localhost:4001", nodeEnv: "test" };

/** Flags with only the named subsystems on. */
function featuresWith(...on: string[]): Features {
  return resolveFeatures(
    Object.fromEntries(on.map((name) => [`FEATURE_${name.toUpperCase()}`, "1"])),
    "FEATURE_",
  );
}

const OFF = resolveFeatures({}, "FEATURE_");

describe("the auth mount", () => {
  it("is absent when the flag is off, which is a fresh clone's default", async () => {
    const res = await createApp(env, OFF).request("/api/auth/session");

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: { code: "not_found" } });
  });

  it("serves the whole /api/auth tree from one handler when the flag is on", async () => {
    vi.stubEnv("AUTH_SECRET", "test-secret-at-least-32-characters-long");
    vi.stubEnv("AUTH_TRUST_HOST", "true");

    const app = createApp(env, featuresWith("auth"));

    // Three different endpoints under the tree, none of them enumerated by the
    // host: if the mount were a route table rather than a catch-all, adding a
    // package endpoint would silently 404 here.
    //
    // Asserting 200 rather than merely "not 404" is the point — a 500 from a
    // misconfigured handler satisfies "not 404" and would let this pass while
    // proving nothing.
    for (const path of ["/api/auth/session", "/api/auth/csrf", "/api/auth/providers"]) {
      const res = await app.request(path);
      expect(res.status, path).toBe(200);
    }

    // And the response is the real thing, not an empty 200: a CSRF token the
    // sign-in form can actually be posted with.
    const csrf = await app.request("/api/auth/csrf");
    await expect(csrf.json()).resolves.toMatchObject({ csrfToken: expect.any(String) });

    vi.unstubAllEnvs();
  });

  it("reports itself in the health payload so a box can be asked what it runs", async () => {
    const res = await createApp(env, featuresWith("auth")).request("/health");

    await expect(res.json()).resolves.toMatchObject({ features: ["auth"] });
  });
});

describe("the sign-in gate", () => {
  /**
   * The gate is the host's whole share of the port, so it is worth testing
   * directly rather than only through a full OAuth round trip.
   */
  function gateOf(auth: ReturnType<typeof createAuth>) {
    const callbacks = auth.config.callbacks;
    if (!callbacks?.signIn) throw new Error("expected a signIn callback");
    return (email: string) =>
      callbacks.signIn!({
        user: { id: "u1", email },
        account: null,
      } as Parameters<NonNullable<typeof callbacks.signIn>>[0]);
  }

  it("refuses everyone when AUTH_ALLOWED_EMAILS is unset", async () => {
    const gate = gateOf(createAuth({}));

    await expect(gate("anyone@example.com")).resolves.toBe(false);
  });

  it("admits a listed email and refuses an unlisted one", async () => {
    const gate = gateOf(createAuth({ AUTH_ALLOWED_EMAILS: "owner@example.com" }));

    await expect(gate("owner@example.com")).resolves.toBe(true);
    await expect(gate("someone@example.com")).resolves.toBe(false);
  });

  it("ignores case and the spaces around a comma-separated list", async () => {
    const gate = gateOf(
      createAuth({ AUTH_ALLOWED_EMAILS: " Owner@Example.com , second@example.com " }),
    );

    await expect(gate("owner@example.com")).resolves.toBe(true);
    await expect(gate("SECOND@example.com")).resolves.toBe(true);
  });

  it("does not admit the empty string from a trailing comma", async () => {
    const gate = gateOf(createAuth({ AUTH_ALLOWED_EMAILS: "owner@example.com," }));

    await expect(gate("")).resolves.toBe(false);
  });
});

describe("what this package owns", () => {
  it("adopts no database adapter, so a host inherits no tables", () => {
    // The premise 12-12 was written on — that auth ships a Prisma partial — is
    // wrong, and this is what pins it. A future adapter has to be deliberate.
    expect(createAuth({}).config.adapter).toBeUndefined();
  });
});
