// Sets up the "Produits spéciaux" families shown in the home band: "Aide au
// carottage", "Débouchage de tubes", "Nettoyant béton" — see
// scripts/lib/special-categories.ts.
//
//   npx tsx scripts/add-special-categories.ts           → dry run, writes nothing
//   npx tsx scripts/add-special-categories.ts --apply   → updates the database
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applySpecialCategories } from "./lib/special-categories";

const apply = process.argv.includes("--apply");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });

async function main() {
  const { lines } = await applySpecialCategories(db, { apply });
  console.log(apply ? "APPLIQUÉ" : "SIMULATION (rien n'est écrit — relancer avec --apply)");
  for (const line of lines) console.log(`  ${line}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
