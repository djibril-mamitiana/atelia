import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // "server-only" is a Next.js build-time guard (throws outside its
      // webpack/turbopack alias) — a no-op here is exactly correct since
      // tests run in a plain Node context.
      "server-only": path.resolve(__dirname, "./tests/setup/server-only-noop.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
