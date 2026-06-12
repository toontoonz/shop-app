import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/helpers/setup-integration.ts"],
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
