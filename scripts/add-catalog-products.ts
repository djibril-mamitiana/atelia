// Creates catalogue products (prisma/data/diamond-pro-catalog.json) that are
// missing from an existing database, built exactly like prisma/seed.ts does,
// then files Ø115–230 blades via scripts/lib/discs-115-230.ts.
// Only the SKUs passed on the command line — never "everything missing", since
// a product absent from the database may have been removed on purpose.
//
//   npx tsx scripts/add-catalog-products.ts 2920450 2920452 …           → dry run
//   npx tsx scripts/add-catalog-products.ts 2920450 2920452 … --apply   → writes
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import slugify from "slugify";
import { computeProductGroups } from "../src/lib/product-grouping";
import { computePublicSkus } from "../src/lib/public-sku";
import { applyDiscs115230 } from "./lib/discs-115-230";
import { productTexts, readCatalog, readDictionary } from "./lib/catalog-product";

// No stock figure in the supplier catalogue: start with a small quantity so
// the products are orderable; adjust in /admin/inventory.
const INITIAL_STOCK = 20;

const apply = process.argv.includes("--apply");
const skus = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });
async function main() {
  if (skus.length === 0) throw new Error("Give the SKUs to add, e.g. npx tsx scripts/add-catalog-products.ts 2920450 2920452");
  const catalog = readCatalog();
  const dict = readDictionary();
  const photos: Record<string, string[]> = JSON.parse(readFileSync("prisma/data/product-photos.json", "utf8"));
  const groups = computeProductGroups(catalog);
  const publicSkus = computePublicSkus(catalog);

  const brand = await db.brand.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  if (!brand) throw new Error("No brand in the database");
  const usedSlugs = new Set((await db.product.findMany({ select: { slug: true } })).map((p) => p.slug));
  const lastPublic = await db.product.findFirst({ where: { publicSku: { startsWith: "CTP-" } }, orderBy: { publicSku: "desc" }, select: { publicSku: true } });
  let nextPublic = lastPublic?.publicSku ? Number(lastPublic.publicSku.slice(4)) + 1 : 1;
  const usedPublic = new Set<string>();
  // The seed's reference for this row if still free, else the next unused one.
  const freePublicSku = async (preferred: string) => {
    const taken = async (ref: string) => usedPublic.has(ref) || Boolean(await db.product.findUnique({ where: { publicSku: ref } }));
    let ref = preferred;
    while (await taken(ref)) ref = `CTP-${String(nextPublic++).padStart(5, "0")}`;
    usedPublic.add(ref);
    return ref;
  };

  console.log(apply ? "APPLIQUÉ" : "SIMULATION (rien n'est écrit — relancer avec --apply)");
  const created: string[] = [];
  for (const sku of skus) {
    const item = catalog.find((c) => c.sku === sku);
    if (!item) {
      console.log(`  ${sku}: absent du catalogue, ignoré`);
      continue;
    }
    if (await db.product.findUnique({ where: { sku } })) {
      console.log(`  ${sku}: existe déjà, ignoré`);
      continue;
    }
    const category = await db.category.findUnique({ where: { slug: item.categorySlug } });
    if (!category) throw new Error(`Category ${item.categorySlug} not found`);

    // Same derivations as prisma/seed.ts → seedProducts().
    const base = slugify(item.name, { lower: true, strict: true, locale: "fr" });
    let slug = base;
    for (let i = 2; usedSlugs.has(slug); i++) slug = `${base}-${i}`;
    usedSlugs.add(slug);

    const publicSku = await freePublicSku(publicSkus.get(sku)!);

    const images = photos[sku] ?? [];

    created.push(`${sku} → ${item.name} (${publicSku}, ${item.price} €, ${images.length ? "actif" : "inactif: pas de photo"})`);
    if (!apply) continue;
    await db.product.create({
      data: {
        ...productTexts(item, dict, brand.name),
        slug,
        sku,
        publicSku,
        price: item.price,
        taxRate: 20,
        stock: INITIAL_STOCK,
        lowStockThreshold: 5,
        categoryId: category.id,
        brandId: brand.id,
        isActive: images.length > 0,
        isNew: true,
        ...groups.get(sku),
        images: { create: images.map((url, i) => ({ url, alt: item.name, position: i })) },
      },
    });
  }
  console.log(`\nProduits créés (${created.length}):\n  ${created.join("\n  ")}`);

  // Ø115–230 blades: right sub-category and size group (only these SKUs).
  const discs = await applyDiscs115230(db, { apply, onlySkus: skus });
  console.log("Classement Ø115–230 :", discs.moved, `— regroupements mis à jour : ${discs.regrouped.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
