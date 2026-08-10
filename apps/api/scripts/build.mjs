/**
 * Production build for the API server.
 *
 * esbuild bundles `src/index.ts` into one ESM file, and the bundling is not an
 * optimization — it is what makes the `@12-apps/*` packages runnable here.
 * They publish raw TypeScript (their `exports` maps point at `./src/*.ts`), so
 * a plain `tsc` build would emit imports Node cannot load. A browser host gets
 * this for free from Vite; a Node host has to do it itself.
 *
 * `packages: "bundle"` is therefore deliberate. When this app grows a database,
 * the Prisma client, its engines and any native addon have to move to
 * `external` instead: they are pre-minified, WASM-loading or natively-linked
 * code that a second bundling pass breaks, and they must be loaded from
 * `node_modules` so they find their generated client and engine binaries.
 */
import { build } from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");

await build({
  entryPoints: [resolve(appRoot, "src/index.ts")],
  outfile: resolve(appRoot, "dist/server.mjs"),
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
