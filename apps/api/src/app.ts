import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { resolveFeatures, enabledFeatures, type Features } from "@base/features";

import { createAuth } from "./auth";
import type { Env } from "./env";

/** Flags for this process. Server-side, so `FEATURE_*` with no public prefix. */
export const processFeatures = resolveFeatures(process.env, "FEATURE_");

/**
 * The API surface.
 *
 * Everything a subsystem adds arrives as ONE mount below, guarded by its flag.
 * That is the shape the porting contract asks for — the host declares which
 * subsystems it runs and who is calling; the package owns the endpoints, the
 * parsing, the status codes and the response envelope.
 *
 * The commented blocks are not aspiration. They are the exact call each port
 * will land, kept here next to the flag so adopting one is installing the
 * package and uncommenting a block. Each names the ticket that ships it.
 *
 * `features` is a parameter rather than the module constant so a test can build
 * an app with a subsystem on. Reading `process.env` at module scope would make
 * the flags fixed for the lifetime of the module, which is right for the
 * process and useless for a suite that has to cover both states.
 */
export function createApp(env: Env, features: Features = processFeatures): Hono {
  const app = new Hono();

  // The SPA is served from its own origin in dev (Vite on :4001) and proxied in
  // production, so CORS is only ever needed for the dev pair.
  app.use("/api/*", cors({ origin: env.spaOrigin, credentials: true }));

  /**
   * What every deploy, preview script and container healthcheck waits on.
   *
   * It reports the enabled subsystems too: "which flags is this box actually
   * running" is the first question of any incident, and answering it from the
   * process beats inferring it from the deploy config.
   *
   * Registered at BOTH paths, because two different callers need it and they
   * cannot use the same one. Infrastructure hits `/health` at the process, with
   * no proxy in the way. The browser can only reach what the front proxy (and
   * Vite's dev proxy) forwards, which is `/api/*` — routing everything else to
   * the SPA is what makes deep links work.
   */
  const health = (c: Context) =>
    c.json({
      status: "ok",
      env: env.nodeEnv,
      features: enabledFeatures(features),
    });

  app.get("/health", health);
  app.get("/api/health", health);

  // ── Authentication (@12-apps/auth) — 12-12 ─────────────────────────────────
  // The first port to land for real. `createAuth` is called HERE rather than at
  // module scope so a clone with the flag off never reads an auth variable.
  //
  // One `app.all` rather than a `route()`: the package answers the whole
  // `/api/auth/**` tree — sign-in, callback, session, CSRF, sign-out, provider
  // list — from a single `(Request) => Promise<Response>`, so there is nothing
  // to enumerate here and no way for the host's route table to drift from the
  // package's. `c.req.raw` is the untouched Request; handing it over whole is
  // what keeps the OAuth callback's form POST and the cookies intact.
  if (features.auth) {
    const auth = createAuth();
    app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
  }

  // ── RBAC (@12-apps/rbac) — 12-13 ───────────────────────────────────────────
  // if (features.rbac) {
  //   app.route("/api/rbac", createApiRbac({ db, resolveActor, permissions }).routes);
  // }

  // ── Action audit (@12-apps/audit) — 12-14 ──────────────────────────────────
  // Mounts the actor-context middleware as well as the endpoint: the Prisma
  // extension reads the actor from async context, so the middleware has to wrap
  // every request, not just the audit routes.
  //
  // if (features.audit) {
  //   const audit = createApiAudit({ db, resolveActor, trackedModels, retention });
  //   app.use("*", audit.actorContext);
  //   app.route("/api/audit", audit.routes);
  // }

  // ── Notifications (@12-apps/notifications) — 12-15 ─────────────────────────
  // if (features.notifications) {
  //   app.route("/api/notifications", createApiNotifications({ db, transports }).routes);
  // }

  // ── Events (@12-apps/realtime) — 12-16 ─────────────────────────────────────
  // The API publishes; `apps/events` relays. This mount is the publisher seam
  // and the connection-ticket endpoint, NOT the socket.
  //
  // if (features.events) {
  //   app.route("/api/events", createApiEvents({ db, driver, authorizeTopic }).routes);
  // }

  // ── Entity history (@12-apps/entity-lifecycle) — 12-17 ─────────────────────
  // if (features.entityHistory) {
  //   app.route("/api", createApiEntityLifecycle({ db, entities, resolveActor }).routes);
  // }

  // ── Reports (@12-apps/report-builder) — complete package, needs a database ──
  // if (features.reports) {
  //   app.route("/api/reports", createApiReportBuilder({ db, catalog, policy }).routes);
  // }

  // ── Entitlements (@12-apps/entitlements) — 12-19 ───────────────────────────
  // if (features.entitlements) {
  //   app.route("/api/entitlements", createApiEntitlements({ db, plans, features }).routes);
  // }

  // ── Storage (@12-apps/storage) — 12-20 ─────────────────────────────────────
  // if (features.storage) {
  //   app.route("/api/uploads", createApiStorage({ driver, maxBytes }).routes);
  // }

  // ── Background jobs (@12-apps/jobs) — 12-22 ────────────────────────────────
  // if (features.jobs) {
  //   app.route("/api/jobs", createApiJobs({ driver, jobs, redisUrl }).routes);
  // }

  app.notFound((c) => c.json({ error: { code: "not_found" } }, 404));

  return app;
}
