/** @type {import('next').NextConfig} */
const nextConfig = {
  // @12-apps/ui ships ESM + MUI/Emotion; transpile it so Next optimizes it
  // alongside the app rather than treating it as an opaque node_module.
  transpilePackages: ["@12-apps/ui"],
};

export default nextConfig;
