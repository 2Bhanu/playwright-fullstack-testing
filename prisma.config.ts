import "dotenv/config";
import { defineConfig } from "prisma/config";


/*
 * ================================================================
 * Prisma 7 configuration
 * ================================================================
 *
 * The connection URL is configured here, NOT in `prisma/schema.prisma`.
 * The framework's env loader (`src/config/env.ts`) reads the same
 * DATABASE_URL at test runtime, so both stay in lockstep.
 *
 * `url` is read via `process.env` rather than the `env()` helper so
 * that `prisma generate` works without DATABASE_URL set (the URL is
 * only required at migrate / db push / studio time). Migration
 * commands that need the URL will fail fast on their own.
 */

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
