// One-off audit: re-derive the correct chapter (=> category) for every SKU
// directly from the source PDF export ("Katalog 2026_Optimized.html"),
// independently of whatever heuristic the original extraction used, then
// diff against prisma/data/diamond-pro-catalog.json to find (a) products
// whose stored categorySlug doesn't match their real chapter and (b) SKUs
// that exist in the source but are entirely missing from the catalog JSON.
//
// Row layout (column count/order) varies across product families and even
// across sub-groups within one family (e.g. a "7 mm segment height" block
// sometimes drops the leading Ø column) — so instead of trusting a header
// row's column positions, every row is scanned independently: whichever
// cell matches a price ("12,34 €") is the price, and the SKU is the cell
// right before it (real SKUs always start with a letter; every dimension/
// spec value in this catalogue starts with a digit).
//
// Run with: node scripts/audit-catalog.mjs
import { readFileSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";

const HTML_PATH = "Katalog 2026_Optimized.html";
const CATALOG_PATH = "prisma/data/diamond-pro-catalog.json";

// Confirmed by inspecting the real chapter headings in the source (see
// conversation) — chapters are numbered 1-8 in document order, then a 9th,
// differently-styled "INTERFLEX" section.
const CHAPTER_ORDER = [
  "disques-diamant-115-230", // 1. Diamanttrennscheiben Ø115-Ø230mm
  "disques-diamant-250-1000", // 2. Diamanttrennscheiben Ø250-Ø1000mm
  "disques-diamant-asphalte", // 3. Diamanttrennscheiben für Asphalt
  "forets-diamant", // 4. Diamant-Bohrwerkzeuge
  "meules-diamant", // 5. Diamant-Schleifwerkzeuge
  "disques-diamant-pierre-naturelle", // 6. Diamanttrennscheiben für Naturstein
  "autres-disques-diamant", // 7. Sonstige Trennscheiben
  "accessoires-diamant", // 8. Zubehör
];
const INTERFLEX_SLUG = "interflex";

const PRICE_RE = /^([\d.,]+)\s*€$/;
// A dimension/spec value ("115", "22,2", "38x2,0x7") is purely numeric,
// optionally with "x"-separated groups — never contains a letter. Real SKUs
// in this catalogue always contain at least one letter, so "has a letter
// and isn't a bare dimension" is a robust, column-position-independent test.
const DIMENSION_RE = /^\d+([.,]\d+)?(\s?[xX]\s?\d+([.,]\d+)?){0,3}$/;
function looksLikeSku(candidate) {
  if (!candidate || candidate.length > 40) return false;
  if (DIMENSION_RE.test(candidate)) return false;
  return /[A-Za-z]/.test(candidate);
}

function cellText($, el) {
  return $(el).text().replace(/\s+/g, " ").trim();
}

function main() {
  const html = readFileSync(HTML_PATH, "utf8");
  const $ = cheerio.load(html);
  const tables = $("table").toArray();

  let currentCategory = null;
  let interflexSeen = false;

  /** @type {Map<string, {category: string, price: string}>} */
  const skuInfo = new Map();

  for (const table of tables) {
    const rows = $(table)
      .find("tr")
      .toArray()
      .map((tr) => $(tr).find("td").toArray().map((td) => cellText($, td)));
    if (rows.length === 0) continue;

    // Real section heading: a cell starting with "N." followed by a title
    // that does NOT contain "/" (the table-of-contents repeats the same
    // "N.  German title" text but combined with the English title via a
    // "/" separator on one line — that's how we tell the two apart).
    const firstCell = rows[0][0] ?? "";
    const chapterMatch = firstCell.match(/^\s*(\d+)\.\s*(.*)$/s);
    if (chapterMatch && rows[0].length <= 2 && !chapterMatch[2].includes("/")) {
      const n = Number(chapterMatch[1]);
      if (n >= 1 && n <= CHAPTER_ORDER.length) {
        currentCategory = CHAPTER_ORDER[n - 1];
        continue;
      }
    }

    // The INTERFLEX chapter has no numbered heading in this export — it's
    // one standalone all-caps heading div, matched once.
    if (!interflexSeen && rows.some((r) => r.length === 1 && r[0].trim() === "INTERFLEX")) {
      currentCategory = INTERFLEX_SLUG;
      interflexSeen = true;
      continue;
    }

    if (!currentCategory) continue;

    for (const row of rows) {
      const priceIdx = row.findIndex((c) => PRICE_RE.test(c));
      if (priceIdx <= 0) continue;
      const candidate = row[priceIdx - 1];
      if (!looksLikeSku(candidate)) continue;
      const sku = candidate.trim();
      if (!skuInfo.has(sku)) skuInfo.set(sku, { category: currentCategory, price: row[priceIdx] });
    }
  }

  console.log(`SKUs found in source HTML: ${skuInfo.size}`);

  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const catalogBySku = new Map(catalog.map((p) => [p.sku, p]));
  console.log(`Products currently in catalog JSON: ${catalog.length}`);

  const mismatches = [];
  for (const p of catalog) {
    const real = skuInfo.get(p.sku);
    if (real && real.category !== p.categorySlug) {
      mismatches.push({ sku: p.sku, name: p.name, from: p.categorySlug, to: real.category });
    }
  }
  console.log(`Miscategorized products found: ${mismatches.length}`);

  const missingSkus = [...skuInfo.keys()].filter((sku) => !catalogBySku.has(sku));
  console.log(`SKUs in source HTML but missing from catalog JSON: ${missingSkus.length}`);

  const notInHtml = catalog.filter((p) => !skuInfo.has(p.sku));
  console.log(`Catalog SKUs not found by this HTML scan (kept as-is): ${notInHtml.length}`);
  const notFoundByCat = {};
  for (const p of notInHtml) notFoundByCat[p.categorySlug] = (notFoundByCat[p.categorySlug] || 0) + 1;
  console.log("Not-found breakdown by category:", notFoundByCat);

  writeFileSync(
    "scripts/audit-report.json",
    JSON.stringify(
      {
        totalSkusInHtml: skuInfo.size,
        totalInCatalog: catalog.length,
        mismatches,
        missingSkus: missingSkus.map((sku) => ({ sku, ...skuInfo.get(sku) })),
        notFoundSkus: notInHtml.map((p) => p.sku),
      },
      null,
      2
    )
  );
  console.log("Full report written to scripts/audit-report.json");
}

main();
