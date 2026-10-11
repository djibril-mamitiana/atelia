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

type Item = { sku: string; name: string; descriptionDe: string; descriptionEn: string; typeModel: string; price: number; categorySlug: string; specs: string[]; specLabels: string[] | null };
type Lang = "fr" | "en" | "it";

// No stock figure in the supplier catalogue: start with a small quantity so
// the products are orderable; adjust in /admin/inventory.
const INITIAL_STOCK = 20;

const apply = process.argv.includes("--apply");
const skus = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });
const read = <T>(file: string): T => JSON.parse(readFileSync(`prisma/data/${file}`, "utf8"));

async function main() {
  if (skus.length === 0) throw new Error("Give the SKUs to add, e.g. npx tsx scripts/add-catalog-products.ts 2920450 2920452");
  const catalog = read<Item[]>("diamond-pro-catalog.json");
  const dict = read<Record<string, Record<Lang, string>>>("description-translations.json");
  const photos = read<Record<string, string[]>>("product-photos.json");
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

    const specLines = item.specLabels && item.specLabels.length === item.specs.length ? item.specLabels.map((l, i) => `${l}: ${item.specs[i]}`).join(", ") : item.specs.join(", ");
    const description = [item.descriptionDe, item.descriptionEn, specLines && `Caractéristiques : ${specLines}`].filter(Boolean).join("\n");
    const tr = dict[item.descriptionDe];
    const suffix = tr && item.name.startsWith(item.descriptionDe) ? item.name.slice(item.descriptionDe.length) : null;
    const FEATURES: Record<Lang, string> = { fr: "Caractéristiques", en: "Features", it: "Caratteristiche" };
    const loc = (l: Lang) => (tr ? [tr[l], specLines && `${FEATURES[l]} : ${specLines}`].filter(Boolean).join("\n") : undefined);
    const images = photos[sku] ?? [];

    created.push(`${sku} → ${item.name} (${publicSku}, ${item.price} €, ${images.length ? "actif" : "inactif: pas de photo"})`);
    if (!apply) continue;
    await db.product.create({
      data: {
        name: item.name,
        slug,
        sku,
        publicSku,
        description,
        shortDescription: item.descriptionDe.slice(0, 200),
        nameFr: tr && suffix !== null ? `${tr.fr}${suffix}` : undefined,
        nameEn: tr && suffix !== null ? `${tr.en}${suffix}` : undefined,
        nameIt: tr && suffix !== null ? `${tr.it}${suffix}` : undefined,
        descriptionFr: loc("fr"),
        descriptionEn: loc("en"),
        descriptionIt: loc("it"),
        shortDescriptionFr: tr?.fr.slice(0, 200),
        shortDescriptionEn: tr?.en.slice(0, 200),
        shortDescriptionIt: tr?.it.slice(0, 200),
        price: item.price,
        taxRate: 20,
        stock: INITIAL_STOCK,
        lowStockThreshold: 5,
        categoryId: category.id,
        brandId: brand.id,
        isActive: images.length > 0,
        isNew: true,
        ...groups.get(sku),
        seoTitle: `${item.name} | ${brand.name}`,
        seoDescription: description.slice(0, 150),
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
