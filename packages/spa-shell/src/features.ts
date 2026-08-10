import { resolveFeatures } from "@base/features";

/**
 * The browser's view of the flags.
 *
 * `VITE_` prefix because Vite only exposes variables with it to client code,
 * and it inlines them at build time — so this is a build-time switch and **not
 * a security boundary**. The values ship inside the bundle and a reader can
 * flip them. The API's own `FEATURE_*` answer is the authoritative one, and
 * anything that must not be reachable stays behind its authorization checks
 * whether either flag is on or off.
 */
export const features = resolveFeatures(
  import.meta.env as unknown as Record<string, string | undefined>,
  "VITE_FEATURE_",
);
