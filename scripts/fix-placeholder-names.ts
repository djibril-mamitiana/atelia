// Some supplier rows lost their real title in the catalogue import: they carry
// a table-column header ("Ø Aufnahme", "Segment Aufnahme", "68"…) or a stale
// "<old category> — <SKU>" name. Neither identifies a product, so they are
// renamed "<current category> — <SKU>" in all four languages. Nothing is
// invented: the reference is what the supplier actually lists.
//
//   npx tsx scripts/fix-placeholder-names.ts            → dry run
//   npx tsx scripts/fix-placeholder-names.ts --apply    → rewrite the catalogue JSON + database
//
// Only name / nameFr / nameEn / nameIt are touched. Safe to re-run.
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type Item = { sku: string; name: string; categorySlug: string; names?: { fr: string; en: string; it: string } };

const OLD_CATEGORY_PREFIXES = [
  "Disques diamant Ø115 – Ø230 mm",
  "Disques diamant Ø250 – Ø1000 mm",
  "Disques diamant pour asphalte",
  "Disques diamant pour pierre naturelle",
  "Forets et trépans diamant",
  "Meules et outils de meulage diamant",
  "Autres disques diamant",
  "Accessoires",
  "Interflex",
];

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^[\d\s.,#Ø/"'x+&()-]*(?:mm|stück|pcs)?[\d\s.,#Ø/"'x+&()-]*$/i, // "68", "115", "10 mm"
  /^[#\d]/, // real titles never start with a dimension or grit ("10 mm Segmenthöhe…", "# 50 125 Klett…")
  /^(?:⍟+|Ø(?:\s|$)|Segment(?:\s|$)|Typ\s|Aufnahme\b|Körnung\b|Länge\b|Leistung\b|Bajonett|Kleine Version|Große Version|Material$|Grau\/|Winkelschleifer$|Zubehör für Bohrungen$|6-Kant\/hex$|PKD$|Block-Segment$)/i,
];

function stripSize(name: string) {
  return name.replace(/\s*Ø\s*\d+(?:[.,]\d+)?\s*(?:mm)?\s*$/i, "").trim();
}

function isBroken(name: string): boolean {
  const base = stripSize(name);
  if (base.length <= 3) return true;
  if (OLD_CATEGORY_PREFIXES.some((p) => name.startsWith(`${p} — `))) return true;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(base));
}

const catalogPath = "prisma/data/diamond-pro-catalog.json";
const catalog: Item[] = JSON.parse(readFileSync(catalogPath, "utf8"));
const frNames: Record<string, string> = Object.fromEntries(
  (JSON.parse(readFileSync("prisma/data/diamond-pro-categories.json", "utf8")) as { slug: string; name: string }[]).map((c) => [c.slug, c.name])
);
const tr: Record<string, Record<"de" | "en" | "it", { name: string }>> = JSON.parse(readFileSync("prisma/data/category-translations.json", "utf8"));

const changes = catalog
  .filter((p) => isBroken(p.name))
  .map((p) => {
    const t = tr[p.categorySlug];
    // "Disques meuleuse d'angle … (Ø115 – Ø400 mm)" → drop the size range, it reads badly in front of a reference.
    const short = (label: string) => label.replace(/\s*\(Ø[^)]*\)\s*$/, "");
    return {
      sku: p.sku,
      before: p.name,
      name: `${short(t.de.name)} — ${p.sku}`,
      names: { fr: `${short(frNames[p.categorySlug])} — ${p.sku}`, en: `${short(t.en.name)} — ${p.sku}`, it: `${short(t.it.name)} — ${p.sku}` },
    };
  });

console.log(`${changes.length} of ${catalog.length} rows have a placeholder name`);
for (const c of changes.filter((_, i) => i % 18 === 0)) console.log(`  ${c.sku}: "${c.before}" → "${c.names.fr}"`);

if (!process.argv.includes("--apply")) {
  console.log("(dry run — nothing written)");
  process.exit(0);
}

async function apply() {
  const bySku = new Map(changes.map((c) => [c.sku, c]));
  for (const item of catalog) {
    const c = bySku.get(item.sku);
    if (c) {
      item.name = c.name;
      item.names = c.names;
    }
  }
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! }) });
  try {
    let n = 0;
    for (const c of changes) {
      const res = await db.product.updateMany({
        where: { sku: c.sku },
        data: { name: c.name, nameFr: c.names.fr, nameEn: c.names.en, nameIt: c.names.it },
      });
      n += res.count;
    }
    console.log(`updated ${n} products`);
  } finally {
    await db.$disconnect();
  }
}
apply().catch((e) => {
  console.error(e);
  process.exit(1);
});
