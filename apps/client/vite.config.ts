import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4001,
    // One origin for the browser: the SPA calls `/api/...` and never learns
    // where the API process lives. In production the front proxy does the same
    // thing, so the client code is identical in both.
    proxy: {
      "/api": {
        target: process.env.API_ORIGIN ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
