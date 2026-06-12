/**
 * Integration test setup:
 * - Loads .env for DATABASE_URL
 * - Runs Prisma migrations against test DB before the suite starts
 */
import { execSync } from "node:child_process";

// Load environment variables for Prisma.
// In CI, DATABASE_URL is injected as env var; locally it reads from .env
if (!process.env.DATABASE_URL) {
  const dotenv = await import("dotenv");
  dotenv.config({ path: ".env" });
}

// Run migrations before test suite
execSync("pnpm db:migrate:deploy", { stdio: "inherit" });
