// October 2026, asked by the client: tables "like the catalogue" — clearer
// for customers than the one-line specs.
//  - Product.specs: each product's supplier specs filed under named columns
//    (Ø | Segment | Alésage | Segments… — src/lib/spec-table.ts), from
//    prisma/data/diamond-pro-catalog.json. A size whose specs text was
//    rewritten in the admin keeps its text.
//  - The client's own price grids on "Couronnes de carottage à eau"
//    (photos of their Excel sheets): new / re-brazed core bits, mining tubes.
// Idempotent: never overwrites price tables set in the admin.
import type { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { computeProductGroups } from "../../src/lib/product-grouping";
import { specCells, type SpecCell } from "../../src/lib/spec-table";
import type { PriceTable } from "../../src/lib/price-tables";

type CatalogItem = { sku: string; specs: string[]; specLabels: string[] | null; categorySlug: string } & Record<string, unknown>;

const DIAMETER_FROM_LABEL = /^Ø\s*(\d+(?:[.,]\d+)?)/;
const hasDiameterColumn = (slug: string) => slug.startsWith("disques-") || slug === "couronnes-carottage-eau" || slug === "carottage-sec";

export async function applySpecTables(db: PrismaClient, { apply }: { apply: boolean }) {
  const catalog: CatalogItem[] = JSON.parse(readFileSync(path.join(process.cwd(), "prisma/data/diamond-pro-catalog.json"), "utf8"));
  const bySku = new Map(catalog.map((c) => [c.sku, c]));
  const groups = computeProductGroups(catalog as unknown as Parameters<typeof computeProductGroups>[0]);
  const products = await db.product.findMany({ select: { id: true, sku: true, sizeLabel: true, sizeSpecs: true, specs: true } });

  let filled = 0, unchanged = 0, kept = 0, noColumns = 0;
  for (const p of products) {
    const item = bySku.get(p.sku);
    if (!item) continue; // added in the admin: no catalogue columns
    // Specs text rewritten in the admin since the import: leave it in charge.
    // (No text at all — a standalone product, or an ungrouped Ø115–230 blade — is fine.)
    const expected = groups.get(p.sku)?.sizeSpecs ?? null;
    if (p.sizeSpecs != null && p.sizeSpecs !== expected) {
      kept++;
      continue;
    }
    let cells: SpecCell[] | null = specCells(item);
    if (!cells) {
      noColumns++;
      continue;
    }
    // A row without its Ø (the catalogue prints it once above the table): from the size.
    const d = p.sizeLabel?.match(DIAMETER_FROM_LABEL)?.[1];
    if (d && hasDiameterColumn(item.categorySlug) && !cells.some(([k]) => k === "diameter")) cells = [["diameter", d], ...cells];
    if (JSON.stringify(p.specs) === JSON.stringify(cells)) {
      unchanged++;
      continue;
    }
    filled++;
    if (apply) await db.product.update({ where: { id: p.id }, data: { specs: cells } });
  }
  return { filled, unchanged, kept, noColumns };
}

const table = (titles: [string, string, string, string], headers: Record<"fr" | "de" | "en" | "it", string[]>, rows: string[][]): PriceTable => ({
  title: { fr: titles[0], de: titles[1], en: titles[2], it: titles[3] },
  headers,
  rows,
});

/** From the client's Excel sheets (photos sent on 17/10/2026). The new / re-brazing sheet was photographed down to Ø127. */
export const CORING_PRICE_TABLES: PriceTable[] = [
  table(
    ["Couronnes à eau : neuves et rebrasage", "Nassbohrkronen: neu und Neubestückung", "Wet core bits: new and re-tipping", "Corone ad acqua: nuove e risaldatura"],
    {
      fr: ["Diamètre (mm)", "Couronne neuve", "Rebrasage"],
      de: ["Durchmesser (mm)", "Neue Bohrkrone", "Neubestückung"],
      en: ["Diameter (mm)", "New core bit", "Re-tipping"],
      it: ["Diametro (mm)", "Corona nuova", "Risaldatura"],
    },
    [
      ["25", "24,00 €", "16,00 €"],
      ["32", "28,00 €", "20,00 €"],
      ["35", "30,00 €", "21,00 €"],
      ["42", "34,00 €", "22,50 €"],
      ["52", "38,00 €", "33,70 €"],
      ["62", "43,00 €", "39,30 €"],
      ["72", "48,00 €", "39,30 €"],
      ["82", "52,00 €", "50,50 €"],
      ["92", "59,00 €", "50,50 €"],
      ["102", "60,00 €", "50,50 €"],
      ["107", "65,00 €", "50,50 €"],
      ["112", "69,00 €", "50,50 €"],
      ["122", "73,00 €", "56,10 €"],
      ["127", "94,00 €", "56,10 €"],
    ]
  ),
  table(
    ["Tubes miniers", "Bergbau-Kernrohre", "Mining core barrels", "Tubi carotieri da miniera"],
    {
      fr: ["Diamètre (mm)", "Longueur 500", "Longueur 1000", "Bague de récupération", "Tête 1 1/4", "Tête de forage", "Tête de forage insert bague", "Clé de desserrage"],
      de: ["Durchmesser (mm)", "Länge 500", "Länge 1000", "Kernfangring", "Kopf 1 1/4", "Bohrkopf", "Bohrkopf mit Ringeinsatz", "Löseschlüssel"],
      en: ["Diameter (mm)", "Length 500", "Length 1000", "Core lifter ring", "1 1/4 head", "Drill head", "Drill head, ring insert", "Release wrench"],
      it: ["Diametro (mm)", "Lunghezza 500", "Lunghezza 1000", "Anello di recupero", "Testa 1 1/4", "Testa di perforazione", "Testa di perforazione con anello", "Chiave di sbloccaggio"],
    },
    [
      ["20", "146,50", "186,30", "", "161,80", "195,00", "", ""],
      ["26", "146,50", "186,30", "", "166,90", "195,00", "", ""],
      ["30", "146,50", "186,30", "", "172,00", "195,00", "", ""],
      ["36", "155,60", "192,50", "", "176,10", "195,00", "", ""],
      ["40", "155,60", "192,50", "106,50", "180,20", "204,00", "", ""],
      ["46", "165,90", "192,50", "106,50", "189,40", "220,00", "251,80", "310,60"],
      ["56", "135,20", "175,10", "106,50", "198,60", "240,00", "266,80", "313,30"],
      ["66", "138,20", "193,50", "106,50", "222,20", "244,00", "267,80", "323,60"],
      ["76", "138,20", "195,50", "106,50", "235,50", "250,00", "271,00", "334,80"],
      ["86", "165,90", "233,50", "106,50", "247,80", "255,20", "282,80", "344,10"],
      ["101", "183,30", "248,80", "174,00", "260,10", "289,00", "306,40", "358,40"],
      ["116", "220,20", "316,40", "174,00", "290,10", "340,50", "360,90", "373,80"],
      ["131", "238,60", "347,10", "174,00", "302,10", "410,00", "431,50", "397,10"],
      ["146", "247,60", "370,70", "174,00", "360,50", "434,50", "461,20", "435,20"],
      ["163", "310,30", "485,40", "192,50", "394,20", "498,90", "510,00", "482,30"],
      ["171", "325,60", "500,70", "247,80", "420,90", "666,60", "666,60", "577,50"],
      ["181", "339,90", "525,30", "266,20", "448,50", "703,00", "703,00", "612,30"],
      ["206", "496,60", "607,20", "302,00", "541,70", "784,50", "784,50", "698,40"],
      ["222", "616,40", "735,20", "323,60", "628,70", "824,40", "824,40", "751,60"],
      ["248", "679,90", "812,00", "361,40", "721,90", "911,00", "911,00", "836,60"],
      ["276", "738,30", "888,80", "406,50", "810,00", "984,80", "984,80", "932,90"],
      ["302", "803,80", "975,80", "448,50", "888,80", "1126,40", "1126,40", "1029,10"],
    ]
  ),
];

export async function applyCoringPriceTables(db: PrismaClient, { apply }: { apply: boolean }) {
  const category = await db.category.findUnique({ where: { slug: "couronnes-carottage-eau" }, select: { id: true, priceTables: true } });
  if (!category) return "catégorie « couronnes-carottage-eau » introuvable";
  if (Array.isArray(category.priceTables) && category.priceTables.length > 0) return "tableaux de prix déjà présents, inchangés";
  if (apply) await db.category.update({ where: { id: category.id }, data: { priceTables: CORING_PRICE_TABLES } });
  return `${CORING_PRICE_TABLES.length} tableaux de prix ajoutés (couronnes neuves / rebrasage, tubes miniers)`;
}
