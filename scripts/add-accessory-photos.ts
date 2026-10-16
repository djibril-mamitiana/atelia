// Creates "Accessoires carottage" / "Accessoires sciage" under "Accessoires",
// with the client's workshop photos — see scripts/lib/accessory-photos.ts.
//
//   npx tsx scripts/add-accessory-photos.ts           → dry run, writes nothing
//   npx tsx scripts/add-accessory-photos.ts --apply   → updates the database
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applyAccessoryPhotos } from "./lib/accessory-photos";

const apply = process.argv.includes("--apply");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });

async function main() {
  const { lines } = await applyAccessoryPhotos(db, { apply });
  console.log(apply ? "APPLIQUÉ" : "SIMULATION (rien n'est écrit — relancer avec --apply)");
  for (const line of lines) console.log(`  ${line}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
