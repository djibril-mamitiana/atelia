// Fixes the Ø115–Ø230 blade sizes and files them into "Disques Ø115 – Ø230 mm"
// (standard / silencieux / matériaux abrasifs) — see scripts/lib/discs-115-230.ts.
//
//   npx tsx scripts/fix-discs-115-230.ts           → dry run, writes nothing
//   npx tsx scripts/fix-discs-115-230.ts --apply   → updates the database
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applyDiscs115230 } from "./lib/discs-115-230";

const apply = process.argv.includes("--apply");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });

async function main() {
  const r = await applyDiscs115230(db, { apply });
  console.log(apply ? "APPLIQUÉ" : "SIMULATION (rien n'est écrit — relancer avec --apply)");
  console.log(`\nNoms corrigés (${r.renamed.length}):\n  ${r.renamed.join("\n  ")}`);
  console.log(`\nTailles / regroupements (${r.regrouped.length}):\n  ${r.regrouped.join("\n  ")}`);
  console.log(`\nCatégories créées: ${r.categoriesCreated.join(", ") || "aucune"}`);
  console.log(`Produits déplacés:`, r.moved);
  if (r.missing.length) console.log(`\nRéférences du catalogue absentes de la base (${r.missing.length}): ${r.missing.join(", ")}`);

  const left = await db.product.groupBy({ by: ["isActive"], where: { category: { slug: "disques-meuleuse-tronconneuse" } }, _count: { _all: true } });
  console.log("\nRestent dans « disques-meuleuse-tronconneuse » :", left.map((l) => `${l._count._all} ${l.isActive ? "actifs" : "inactifs"}`).join(", "));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
