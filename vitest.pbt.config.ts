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
    include: ["tests/pbt/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    testTimeout: 60_000, // PBT can be slow with many runs
    fileParallelism: false,
  },
});
