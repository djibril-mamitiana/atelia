// Dry run: prints what the size grouping would produce, writes nothing.
// Run with: npx tsx scripts/product-groups-dry-run.ts
import { readFileSync } from "node:fs";
import { computeProductGroups, stripSizeSuffix } from "../src/lib/product-grouping";

const catalog = JSON.parse(readFileSync("prisma/data/diamond-pro-catalog.json", "utf8"));
const groups = computeProductGroups(catalog);

const byKey = new Map<string, { name: string; labels: string[] }>();
for (const item of catalog) {
  const info = groups.get(item.sku);
  if (!info) continue;
  const g = byKey.get(info.groupKey) ?? { name: stripSizeSuffix(item.name), labels: [] };
  g.labels.push(info.sizeLabel);
  byKey.set(info.groupKey, g);
}

const grouped = groups.size;
const ungrouped = catalog.length - grouped;
console.log(`catalogue rows: ${catalog.length}`);
console.log(`rows folded into a size group: ${grouped} → ${byKey.size} products`);
console.log(`standalone rows (unchanged): ${ungrouped}`);
console.log(`listing entries after grouping: ${byKey.size + ungrouped}`);

const sample = [...byKey.values()].sort((a, b) => b.labels.length - a.labels.length);
console.log("\nlargest groups:");
for (const g of sample.slice(0, 5)) console.log(` ${g.labels.length}× ${g.name}\n    ${g.labels.slice(0, 8).join(", ")}`);
console.log("\nsample specs:");
for (const item of catalog.filter((i: { sku: string }) => groups.has(i.sku)).slice(0, 4)) {
  const g = groups.get(item.sku)!;
  console.log(` ${item.sku}: ${g.sizeLabel} | ${g.sizeSpecs}`);
}
