// Fixes the Ø115–Ø230 blade sizes and files them into "Disques Ø115 – Ø230 mm"
// (standard / silencieux / matériaux abrasifs) — see scripts/lib/discs-115-230.ts.
//
//   npx tsx scripts/fix-discs-115-230.ts           → dry run, writes nothing
//   npx tsx scripts/fix-discs-115-230.ts --apply   → updates the database
import "dotenv/config";
import { readFileSync } from "node:fs";
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

  // What the old family will still hold once the Ø115–230 blades have moved out.
  const refs: { sku: string }[] = JSON.parse(readFileSync("prisma/data/discs-115-230.json", "utf8")).items;
  const moving = new Set(refs.map((i) => i.sku.toLowerCase()));
  const remaining = (
    await db.product.findMany({
      where: { isActive: true, category: { slug: "disques-meuleuse-tronconneuse" } },
      select: { sku: true, name: true, sizeLabel: true },
      orderBy: { sizeOrder: "asc" },
    })
  ).filter((p) => !moving.has(p.sku.toLowerCase()));
  const byName = new Map<string, string[]>();
  for (const p of remaining) {
    const base = p.name.replace(/\s*Ø\s*\d+\s*mm\s*$/i, "");
    byName.set(base, [...(byName.get(base) ?? []), (p.sizeLabel ?? p.sku).replace(" mm", "")]);
  }
  console.log(`Actifs qui y resteront (${remaining.length}) :`);
  for (const [name, sizes] of byName) console.log(`  ${name} : ${sizes.join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
