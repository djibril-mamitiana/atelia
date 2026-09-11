import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 7 requires an explicit driver adapter at runtime (no bundled Rust
// query engine). We use node-postgres against Neon's pooled connection
// string — standard Postgres wire protocol, works from any Node runtime.
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill in your Neon connection string."
    );
  }

  // Neon (free tier especially) suspends its compute and/or its pooler
  // drops idle sockets after a short period of inactivity. node-postgres
  // doesn't proactively recycle those, so the *next* query after a quiet
  // spell would otherwise fail with "Server has closed the connection" or
  // "Connection terminated unexpectedly". Closing idle clients ourselves,
  // well before Neon does, means every query starts from a fresh
  // connection instead of a stale one — and the `error` listener stops a
  // socket dying *while* idle from crashing the whole Node process (an
  // unhandled `error` event on Pool is fatal by default).
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", (err) => {
    console.error("[db] idle Postgres connection error (recovered):", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Reuse a single PrismaClient instance across hot-reloads in development
// (Next.js dev server re-evaluates modules on every change) and across
// serverless invocations that share a container.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Lazily instantiated — merely importing this module (e.g. transitively,
 * from a route that may or may not touch the database) must not throw
 * before DATABASE_URL is configured. The client is only constructed, and
 * can only throw, on first actual use (db.product.findMany(), etc).
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop, receiver);
  },
});
