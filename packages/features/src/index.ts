/**
 * Which subsystems this app has switched on.
 *
 * A base repo has to boot green with nothing configured, so **every flag
 * defaults to off**.
 *
 * The names and the parser live here, in one place, because the three hosts
 * read their values from three different sources and would otherwise drift:
 *
 * | host | source | when |
 * |---|---|---|
 * | `apps/api` | `process.env.FEATURE_*` | runtime |
 * | `apps/events` | `process.env.FEATURE_*` | runtime |
 * | `apps/spa` | `import.meta.env.VITE_FEATURE_*` | build time (Vite inlines) |
 *
 * So this module never reads an environment itself — each host passes its own
 * source to {@link resolveFeatures}. That keeps the package free of
 * `process`/`import.meta` and makes the drift impossible rather than unlikely.
 *
 * **The server's answer is the authoritative one.** A subsystem with two halves
 * needs both flags on, but the browser flag only decides whether the UI is
 * mounted — it is inlined into the bundle and a reader can flip it. Anything
 * that must not be reachable stays behind the API's own authorization checks
 * whether its flag is on or off.
 */

/** Every subsystem this scaffold knows how to mount. */
export const FEATURE_NAMES = [
  /** Auth.js sign-in, session and the admin allowlist. */
  "auth",
  /** Role-based access control: permission set, `<Can>`, guards. */
  "rbac",
  /** Action audit: who changed what, under which authority. */
  "audit",
  /** Notification inbox, preferences and transports. */
  "notifications",
  /** The event system: topics, publishers, transports, outbox. */
  "events",
  /** Entity history: versions, restore, drafts, recycle bin. */
  "entityHistory",
  /** The report builder surface. */
  "reports",
  /** Plan/feature entitlements and quotas. */
  "entitlements",
  /** Background jobs, schedules and the sweep lease. */
  "jobs",
  /** Uploads and object storage. */
  "storage",
  /** Error reporting, server and browser. */
  "observability",
  /** Installable-app invite and the service worker. */
  "pwa",
  /** Guided onboarding progress. */
  "onboarding",
  /** The MCP tool surface and its OAuth authorization server. */
  "mcp",
  /** Platform "act as" / preview-as-member. */
  "impersonation",
] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];

/** Resolved flags. */
export type Features = Readonly<Record<FeatureName, boolean>>;

/** A host's environment: whatever `process.env` / `import.meta.env` looks like. */
export type EnvSource = Readonly<Record<string, string | undefined>>;

/**
 * `auth` → `AUTH`, `entityHistory` → `ENTITY_HISTORY`.
 *
 * The env var is the SCREAMING_SNAKE form of the flag name, so the two cannot
 * be edited apart — there is no second list mapping one to the other.
 */
export function envSuffix(name: FeatureName): string {
  return name.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
}

/** `1` and `true` mean on. Anything else — including unset — means off. */
function isOn(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

/**
 * Resolve every flag from a host's environment.
 *
 * `prefix` is what that host's tooling requires: `FEATURE_` for a Node process,
 * `VITE_FEATURE_` for the SPA, because Vite only exposes `VITE_`-prefixed vars
 * to client code.
 */
export function resolveFeatures(env: EnvSource, prefix: string): Features {
  const entries = FEATURE_NAMES.map((name) => [
    name,
    isOn(env[`${prefix}${envSuffix(name)}`]),
  ]);
  return Object.freeze(Object.fromEntries(entries)) as Features;
}

/** Every subsystem currently on — for a boot log or a health payload. */
export function enabledFeatures(features: Features): FeatureName[] {
  return FEATURE_NAMES.filter((name) => features[name]);
}
