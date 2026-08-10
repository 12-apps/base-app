import { describe, expect, it } from "vitest";

import { createApp } from "../app";
import { EnvError, readEnv } from "../env";

const env = { port: 3000, spaOrigin: "http://localhost:4001", nodeEnv: "test" };

describe("health", () => {
  it("answers at the process path infrastructure uses", async () => {
    const res = await createApp(env).request("/health");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ status: "ok", env: "test" });
  });

  it("answers at the /api path the browser can reach through the proxy", async () => {
    const res = await createApp(env).request("/api/health");

    expect(res.status).toBe(200);
  });

  it("reports no enabled subsystems when nothing is configured", async () => {
    const res = await createApp(env).request("/health");

    await expect(res.json()).resolves.toMatchObject({ features: [] });
  });
});

describe("unknown routes", () => {
  it("returns the error envelope rather than Hono's default text", async () => {
    const res = await createApp(env).request("/api/nope");

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: { code: "not_found" } });
  });
});

describe("readEnv", () => {
  it("defaults every variable so a fresh clone boots with none set", () => {
    expect(readEnv({})).toEqual({
      port: 3000,
      spaOrigin: "http://localhost:4001",
      nodeEnv: "development",
    });
  });

  it("fails at boot naming the variable, rather than at first use", () => {
    expect(() => readEnv({ PORT: "not-a-port" })).toThrow(EnvError);
    expect(() => readEnv({ PORT: "70000" })).toThrow(/PORT/);
  });
});
