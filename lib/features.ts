/**
 * Which subsystems this app has switched on.
 *
 * A base repo has to boot green with nothing configured, so **every flag
 * defaults to off**. Turning one on is a build-time decision: the values are
 * `NEXT_PUBLIC_*` so the same answer is available to the server and to the
 * browser bundle, and Next.js inlines them at build time — which is why each is
 * read by LITERAL member access below. `process.env[name]` with a computed key
 * is not inlined and reads `undefined` in the browser.
 *
 * These are a build-time switch, **not a security boundary**: the values ship
 * inside the client bundle. Anything that must not be reachable stays behind
 * the server's own authorization checks whether its flag is on or off.
 *
 * A flag whose package does not exist yet is listed anyway, with its mount
 * written and commented at the call site. That is deliberate — adopting the
 * subsystem should be uncommenting a block, not reading a migration guide. See
 * `docs/BASE-REPO-READINESS.md` for the package behind each one.
 */

const RAW = {
  /** Auth.js sign-in, session and the admin allowlist. */
  auth: process.env.NEXT_PUBLIC_FEATURE_AUTH,
  /** Role-based access control: permission set, `<Can>`, guards. */
  rbac: process.env.NEXT_PUBLIC_FEATURE_RBAC,
  /** Action audit: who changed what, under which authority. */
  audit: process.env.NEXT_PUBLIC_FEATURE_AUDIT,
  /** Notification inbox, preferences and transports. */
  notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS,
  /** The event system: topics, publishers, transports, outbox. */
  events: process.env.NEXT_PUBLIC_FEATURE_EVENTS,
  /** Entity history: versions, restore, drafts, recycle bin. */
  entityHistory: process.env.NEXT_PUBLIC_FEATURE_ENTITY_HISTORY,
  /** The report builder surface. */
  reports: process.env.NEXT_PUBLIC_FEATURE_REPORTS,
  /** Plan/feature entitlements and quotas. */
  entitlements: process.env.NEXT_PUBLIC_FEATURE_ENTITLEMENTS,
  /** Background jobs, schedules and the sweep lease. */
  jobs: process.env.NEXT_PUBLIC_FEATURE_JOBS,
  /** Uploads and object storage. */
  storage: process.env.NEXT_PUBLIC_FEATURE_STORAGE,
  /** Error reporting, server and browser. */
  observability: process.env.NEXT_PUBLIC_FEATURE_OBSERVABILITY,
  /** Installable-app invite and the service worker. */
  pwa: process.env.NEXT_PUBLIC_FEATURE_PWA,
  /** Guided onboarding progress. */
  onboarding: process.env.NEXT_PUBLIC_FEATURE_ONBOARDING,
  /** The MCP tool surface and its OAuth authorization server. */
  mcp: process.env.NEXT_PUBLIC_FEATURE_MCP,
  /** Platform "act as" / preview-as-member. */
  impersonation: process.env.NEXT_PUBLIC_FEATURE_IMPERSONATION,
} as const satisfies Record<string, string | undefined>;

/** The name of every subsystem this scaffold knows how to mount. */
export type FeatureName = keyof typeof RAW;

/** `1` and `true` mean on. Anything else — including unset — means off. */
function isOn(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

/** Resolved flags, frozen so a caller cannot flip one at runtime. */
export const features: Readonly<Record<FeatureName, boolean>> = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW).map(([name, value]) => [name, isOn(value)]),
  ) as Record<FeatureName, boolean>,
);

/** Is this subsystem switched on? */
export function isEnabled(name: FeatureName): boolean {
  return features[name];
}

/** Every subsystem currently on — handy for a boot log or a health endpoint. */
export function enabledFeatures(): FeatureName[] {
  return (Object.keys(features) as FeatureName[]).filter((n) => features[n]);
}
