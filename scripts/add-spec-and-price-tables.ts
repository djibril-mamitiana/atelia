// Catalogue-style size tables (Product.specs) and the client's price grids
// on "Couronnes de carottage à eau" — see scripts/lib/spec-and-price-tables.ts.
//
//   npx tsx scripts/add-spec-and-price-tables.ts           → dry run, writes nothing
//   npx tsx scripts/add-spec-and-price-tables.ts --apply   → updates the database
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applyCoringPriceTables, applySpecTables } from "./lib/spec-and-price-tables";

const apply = process.argv.includes("--apply");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });

async function main() {
  const specs = await applySpecTables(db, { apply });
  const tables = await applyCoringPriceTables(db, { apply });
  console.log(apply ? "APPLIQUÉ" : "SIMULATION (rien n'est écrit — relancer avec --apply)");
  console.log(`  colonnes de tailles : ${specs.filled} produits remplis, ${specs.unchanged} déjà à jour, ${specs.kept} gardent le texte modifié dans l'admin, ${specs.noColumns} sans colonnes reconnues`);
  console.log(`  ${tables}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
