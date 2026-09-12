// Fills the per-locale name/description/shortDescription columns added by
// the add_product_translations migration, for every product already in the
// database — matched by SKU against prisma/data/diamond-pro-catalog.json,
// using the translated-phrase dictionary in
// prisma/data/description-translations.json (see the schema comment on
// Product for why this is a lookup table, not per-product hand translation:
// ~93% of names are just "{descriptionDe}{size suffix}", and only 179
// distinct descriptions exist across 1417 products).
//
// Purely additive — never touches name/description/shortDescription
// (the German source columns) or any other table. Safe to re-run.
//
// Run with: node scripts/backfill-product-translations.mjs
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const catalog = JSON.parse(readFileSync("prisma/data/diamond-pro-catalog.json", "utf8"));
const dict = JSON.parse(readFileSync("prisma/data/description-translations.json", "utf8"));

const LOCALES = ["fr", "en", "it"];

// The long `description` column isn't just descriptionDe — seed.ts appends
// a specs line ("Caractéristiques : mm: 115, ...") and a type line. Mirror
// that per locale so translated pages don't lose the technical specs.
const FEATURES_LABEL = { fr: "Caractéristiques", en: "Features", it: "Caratteristiche" };
const TYPE_LABEL = { fr: "Type", en: "Type", it: "Tipo" };

function specLines(item) {
  if (item.specLabels && item.specLabels.length === item.specs.length) {
    return item.specLabels.map((label, i) => `${label}: ${item.specs[i]}`).join(", ");
  }
  return item.specs.join(", ");
}

function buildTranslations(item) {
  const entry = dict[item.descriptionDe];
  if (!entry) return null; // shouldn't happen — every unique descriptionDe is in the dictionary

  // ~93% of names are exactly "{descriptionDe}{suffix}" (usually " Ø115mm");
  // reuse that same suffix so e.g. "Ø115mm" isn't itself translated.
  const suffix = item.name.startsWith(item.descriptionDe) ? item.name.slice(item.descriptionDe.length) : null;
  const lines = specLines(item);

  const result = {};
  for (const locale of LOCALES) {
    const translatedDescription = entry[locale];
    const parts = [translatedDescription];
    if (lines) parts.push(`${FEATURES_LABEL[locale]} : ${lines}`);
    if (item.typeModel) parts.push(`${TYPE_LABEL[locale]} : ${item.typeModel}`);
    result[`description${cap(locale)}`] = parts.join("\n");
    // Only override the name when we can safely reconstruct it (suffix
    // known); otherwise leave the per-locale name column null so the
    // storefront falls back to the existing (already French-ish, for the
    // ~7% of lowConfidence items) `name` column.
    if (suffix !== null) {
      result[`name${cap(locale)}`] = `${translatedDescription}${suffix}`;
    }
    // shortDescription in seed.ts is just descriptionDe (or En) truncated
    // to 200 chars — mirror that with the translated (short) description.
    result[`shortDescription${cap(locale)}`] = translatedDescription.slice(0, 200);
  }
  return result;
}

function cap(s) {
  return s[0].toUpperCase() + s.slice(1);
}

async function main() {
  let updated = 0;
  let skippedNoDict = 0;
  let notFoundInDb = 0;

  const BATCH_SIZE = 25;
  for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
    const batch = catalog.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (item) => {
        const data = buildTranslations(item);
        if (!data) {
          skippedNoDict++;
          return;
        }
        try {
          await db.product.update({ where: { sku: item.sku }, data });
          updated++;
        } catch (err) {
          if (err.code === "P2025") {
            notFoundInDb++; // product with this SKU doesn't exist (shouldn't happen post-seed)
          } else {
            throw err;
          }
        }
      })
    );
    console.log(`  … ${Math.min(i + BATCH_SIZE, catalog.length)}/${catalog.length}`);
  }

  console.log(`\nDone. Updated: ${updated}, no dictionary entry: ${skippedNoDict}, not found in DB: ${notFoundInDb}`);
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
