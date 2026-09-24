// Fills groupKey / sizeLabel / sizeOrder / sizeSpecs on Product so same-name,
// different-size rows are shown as one product with a size selector.
// Purely additive: never touches name, price, stock or any existing column,
// and safe to re-run (it recomputes and overwrites only these four columns).
//
// Run with: npx tsx scripts/backfill-product-groups.ts
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeProductGroups } from "../src/lib/product-grouping";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const catalog = JSON.parse(readFileSync("prisma/data/diamond-pro-catalog.json", "utf8"));
  const groups = computeProductGroups(catalog);

  // Reset first so a re-run after rule changes can't leave stale groups behind.
  await db.product.updateMany({ data: { groupKey: null, sizeLabel: null, sizeOrder: null, sizeSpecs: null } });

  let updated = 0;
  let missing = 0;
  for (const [sku, info] of groups) {
    const result = await db.product.updateMany({ where: { sku }, data: info });
    if (result.count === 0) missing++;
    else updated += result.count;
  }

  const distinct = new Set([...groups.values()].map((g) => g.groupKey)).size;
  console.log(`grouped ${updated} products into ${distinct} size groups (${missing} catalogue SKUs not in the database)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
