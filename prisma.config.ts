import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7: this file drives the CLI only (generate, migrate, db seed,
// studio). The running app connects separately via a driver adapter — see
// src/lib/db.ts. Migrations use the *unpooled* Neon connection string
// because DDL and Prisma's shadow database don't play well with a
// transaction pooler (pgbouncer).
//
// Read via `process.env` (not the strict `env()` helper) so commands that
// don't touch the database — `generate`, `validate`, `format` — keep
// working before .env is filled in with real Neon credentials.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  },
});
