/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every `@12-apps/*` package this app imports has to be listed, and it is NOT
  // an optimization: they publish raw TypeScript source. Their `exports` maps
  // point at `./src/*.ts` — even `@12-apps/ui`, which also ships a `dist` its
  // own exports never reach — so Turbopack meets a `.ts` file inside
  // node_modules and fails with "Unknown module type" unless the package is
  // transpiled alongside the app.
  //
  // Vite hosts never hit this (esbuild transforms deps on demand), which is why
  // future-pay's SPAs need no equivalent list. A Next.js consumer does, and the
  // list has to grow with every package it imports. Publishing built output
  // would remove the need for it entirely — 12-29.
  transpilePackages: ["@12-apps/ui", "@12-apps/rbac", "@12-apps/pwa"],
};

export default nextConfig;
