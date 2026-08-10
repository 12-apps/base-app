/**
 * The host's share of `@12-apps/auth` (12-12).
 *
 * The package owns the whole sign-in flow: the providers, the callbacks, the
 * JWT shape, the cookie, the CSRF check, the reverse-proxy origin rewrite and
 * the secret redaction. What it deliberately does NOT own is the one question
 * only an application can answer — **who is allowed in** — so that is all this
 * module is.
 *
 * ## It owns no database table
 *
 * Worth stating because the obvious assumption is the opposite. The session
 * strategy is JWT with no adapter, so there are no `User` / `Account` /
 * `Session` rows and no Prisma partial to adopt. That is why this mount lands
 * in a base repo that has no database yet: auth is the one subsystem here that
 * does not need one.
 */
import { createApiAuth, type ApiAuth } from "@12-apps/auth";

/**
 * Emails allowed to sign in, from `AUTH_ALLOWED_EMAILS` (comma-separated).
 *
 * **Empty by default, and that means nobody signs in.** A scaffold must not
 * ship open registration: leaving this unset while the flag is on is the safe
 * failure, not a broken one.
 *
 * This is the seam a real application replaces. An allowlist in an environment
 * variable does not survive contact with a product — the gate becomes a lookup
 * against your own user table, an invitation record, a tenant membership. The
 * signature is the same either way, and it may return a promise, so swapping
 * the body below is the whole change.
 */
function parseAllowedEmails(raw: string | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0),
  );
}

/**
 * Build the backend auth surface for this process.
 *
 * Constructed lazily by the caller — inside its `features.auth` check — so a
 * clone with the flag off never reads an auth variable and never asks for an
 * `AUTH_SECRET` it has no use for.
 */
export function createAuth(env: NodeJS.ProcessEnv = process.env): ApiAuth {
  const allowed = parseAllowedEmails(env.AUTH_ALLOWED_EMAILS);

  return createApiAuth({
    /**
     * Returning `false` refuses the sign-in *after* the provider authenticated
     * the person but *before* any session exists, which is the point: the
     * provider proves who they are, this decides whether that is someone your
     * app knows.
     */
    signInGate: ({ email }) => allowed.has(email.toLowerCase()),
    /**
     * Left to the package, which answers it from `ADMIN_EMAILS`. Pass a
     * resolver here as soon as superadmin status comes from anywhere else — it
     * must be the SAME one the server-side gate uses, or the `isSuperadmin`
     * session claim drifts from the gate enforcing it.
     */
  });
}
