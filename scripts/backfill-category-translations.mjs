// Fills the per-locale name/description columns added by the
// add_category_translations migration — matched by slug against
// prisma/data/category-translations.json (10 categories, hand-translated).
// Purely additive; never touches name/description (the French source
// columns). Safe to re-run.
//
// Run with: node scripts/backfill-category-translations.mjs
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const translations = JSON.parse(readFileSync("prisma/data/category-translations.json", "utf8"));

async function main() {
  let updated = 0;
  let skipped = 0;

  for (const [slug, entry] of Object.entries(translations)) {
    try {
      await db.category.update({
        where: { slug },
        data: {
          nameDe: entry.de.name,
          nameEn: entry.en.name,
          nameIt: entry.it.name,
          descriptionDe: entry.de.description,
          descriptionEn: entry.en.description,
          descriptionIt: entry.it.description,
        },
      });
      updated++;
    } catch (err) {
      if (err.code === "P2025") {
        console.log(`  no category found for slug: ${slug}`);
        skipped++;
      } else {
        throw err;
      }
    }
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}`);
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
