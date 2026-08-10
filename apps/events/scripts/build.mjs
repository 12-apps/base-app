/**
 * Production build for the events gateway — same reasoning as `apps/api`:
 * the `@12-apps/*` packages publish raw TypeScript, so a Node host has to
 * bundle them itself rather than emit imports Node cannot load.
 */
import { build } from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");

await build({
  entryPoints: [resolve(appRoot, "src/index.ts")],
  outfile: resolve(appRoot, "dist/events.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "bundle",
  sourcemap: true,
  logLevel: "info",
  // ESM has no `require`, but bundled CommonJS dependencies still call one —
  // `ws` reaches for `require("events")` and esbuild's shim throws
  // `Dynamic require of "events" is not supported` at startup. The shim checks
  // for a `require` in scope first, so defining one here makes those calls work
  // instead of having to externalize every CJS dependency.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
});
