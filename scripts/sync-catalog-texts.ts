// Pushes the names/descriptions (4 languages) and photo alt texts of given
// SKUs from prisma/data/diamond-pro-catalog.json to an existing database, and
// their size grouping (plus any product whose group they join or leave).
// Never touches price, stock, category, images or flags.
//
//   npx tsx scripts/sync-catalog-texts.ts HM-230 TS-125-22 …           → dry run
//   npx tsx scripts/sync-catalog-texts.ts HM-230 TS-125-22 … --apply   → writes
//   npx tsx scripts/sync-catalog-texts.ts --file=skus.json [--apply]  → SKUs from a JSON array
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeProductGroups } from "../src/lib/product-grouping";
import { productTexts, readCatalog, readDictionary } from "./lib/catalog-product";

const apply = process.argv.includes("--apply");
// SKUs on the command line, or --file=<json array> for long lists / SKUs with spaces.
const fileArg = process.argv.find((a) => a.startsWith("--file="));
const skus: string[] = fileArg
  ? JSON.parse(readFileSync(fileArg.slice("--file=".length), "utf8"))
  : process.argv.slice(2).filter((a) => !a.startsWith("--"));
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });

async function main() {
  if (skus.length === 0) throw new Error("Give the SKUs to sync");
  const catalog = readCatalog();
  const dict = readDictionary();
  const groups = computeProductGroups(catalog);
  // Abrasive / silent Ø115–230 blades have their own groups (scripts/lib/discs-115-230.ts): leave them alone.
  const discRefs: { sku: string; type: string }[] = JSON.parse(readFileSync("prisma/data/discs-115-230.json", "utf8")).items;
  const splitDiscs = new Set(discRefs.filter((r) => r.type !== "standard").map((r) => r.sku.toLowerCase()));
  const brand = await db.brand.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });

  console.log(apply ? "APPLIQUÉ" : "SIMULATION (rien n'est écrit — relancer avec --apply)");

  // 1. Texts of the listed products.
  for (const sku of skus) {
    const item = catalog.find((c) => c.sku === sku);
    const product = await db.product.findUnique({ where: { sku }, select: { id: true, name: true, nameFr: true } });
    if (!item || !product) {
      console.log(`  ${sku}: ${item ? "absent de la base" : "absent du catalogue"}, ignoré`);
      continue;
    }
    const texts = productTexts(item, dict, brand?.name ?? "");
    console.log(`  ${sku}: ${product.nameFr ?? product.name}\n      → ${texts.nameFr ?? texts.name}`);
    if (apply) {
      await db.product.update({ where: { id: product.id }, data: texts });
      // Photo alt texts were filled with the name at creation.
      await db.productImage.updateMany({ where: { productId: product.id }, data: { alt: item.name } });
    }
  }

  // 2. Size groups: the listed products, and every product sharing a group
  //    key with them (before or after) — e.g. a size that gains siblings.
  const listed = new Set(skus);
  const before = await db.product.findMany({ where: { sku: { in: skus } }, select: { groupKey: true } });
  const keys = new Set([...before.map((p) => p.groupKey), ...skus.map((s) => groups.get(s)?.groupKey)].filter((k): k is string => Boolean(k)));
  const affected = new Set([...skus, ...catalog.filter((c) => keys.has(groups.get(c.sku)?.groupKey ?? "")).map((c) => c.sku)]);
  for (const p of await db.product.findMany({ where: { groupKey: { in: [...keys] } }, select: { sku: true } })) affected.add(p.sku);

  let regrouped = 0;
  for (const sku of affected) {
    if (splitDiscs.has(sku.toLowerCase())) continue;
    const product = await db.product.findUnique({ where: { sku }, select: { id: true, groupKey: true, sizeLabel: true, sizeOrder: true, sizeSpecs: true } });
    if (!product) continue;
    const g = groups.get(sku) ?? { groupKey: null, sizeLabel: null, sizeOrder: null, sizeSpecs: null };
    if (g.groupKey === product.groupKey && g.sizeLabel === product.sizeLabel && g.sizeOrder === product.sizeOrder && g.sizeSpecs === product.sizeSpecs) continue;
    regrouped++;
    console.log(`  groupe ${listed.has(sku) ? "" : "(voisin) "}${sku}: ${product.sizeLabel ?? "—"} → ${g.sizeLabel ?? "—"}`);
    if (apply) await db.product.update({ where: { id: product.id }, data: g });
  }
  console.log(`Regroupements mis à jour : ${regrouped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
