// Adds the "Nettoyant béton" family (ABAX Décap Béton 5 L / 20 L, created
// hidden at 0 € until the admin sets the price), the cleaner and coring
// videos, the coring guide, and puts the coring families first — see
// scripts/lib/nettoyant-beton.ts.
//
//   npx tsx scripts/add-nettoyant-beton.ts           → dry run, writes nothing
//   npx tsx scripts/add-nettoyant-beton.ts --apply   → updates the database
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applyCleanerAndVideos } from "./lib/nettoyant-beton";

const apply = process.argv.includes("--apply");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });

async function main() {
  const { lines } = await applyCleanerAndVideos(db, { apply });
  console.log(apply ? "APPLIQUÉ" : "SIMULATION (rien n'est écrit — relancer avec --apply)");
  for (const line of lines) console.log(`  ${line}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
