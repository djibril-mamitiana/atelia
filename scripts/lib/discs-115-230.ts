// Ø115–Ø230 diamond blades (chapter 1 of the supplier's Katalog 2026):
//  1. sizes — ~27 rows had been imported with another column taken as the
//     diameter ("Ø12mm", "Ø50mm"…). prisma/data/diamond-pro-catalog.json is
//     now fixed; this pushes the corrected names (4 languages) and size
//     grouping to the database.
//  2. categories — new family "Disques Ø115 – Ø230 mm" with three
//     sub-categories (standard / silencieux / matériaux abrasifs), from the
//     catalogue's "Silent" and "Abrasiv ✓" icons (prisma/data/discs-115-230.json).
//
// Idempotent: only writes what differs, safe to re-run. Shared by
// scripts/fix-discs-115-230.ts (existing database) and prisma/seed.ts.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { computeProductGroups } from "../../src/lib/product-grouping";

type CatalogItem = { sku: string; name: string; descriptionDe: string; specs: string[]; specLabels: string[] | null; categorySlug: string };
type DiscRef = { sku: string; diameter: number; bore: string; type: "standard" | "silent" | "abrasive" };
type Lang = { name: string; description: string };

// Scripts and the seed both run from the repo root (package.json scripts).
const DATA = path.join(process.cwd(), "prisma/data");
const read = <T>(file: string): T => JSON.parse(readFileSync(path.join(DATA, file), "utf8"));

/** Products are only moved out of this category (tile blades etc. elsewhere stay put). */
const SOURCE_CATEGORY = "disques-meuleuse-tronconneuse";
const ROOT_CATEGORY = "outils-diamant";
const PARENT = {
  slug: "disques-115-230",
  name: "Disques Ø115 – Ø230 mm",
  description: "Disques diamant pour meuleuse d'angle, du Ø115 au Ø230 mm, pour la coupe à sec : standard, silencieux et pour matériaux abrasifs.",
};
const CHILDREN: Record<DiscRef["type"], { slug: string; name: string; description: string; order: number }> = {
  standard: { slug: "disques-115-230-standard", name: "Disques", description: "Disques diamant Ø115 – Ø230 mm pour béton, granit, brique et matériaux de construction.", order: 1 },
  silent: { slug: "disques-115-230-silencieux", name: "Disques silencieux", description: "Disques diamant à âme sandwich : nettement moins bruyants à la coupe.", order: 2 },
  abrasive: { slug: "disques-115-230-abrasifs", name: "Disques pour matériaux abrasifs", description: "Disques diamant pour maçonnerie, brique silico-calcaire, grès et autres matériaux abrasifs.", order: 3 },
};

const LOCALES = ["fr", "en", "it"] as const;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export type DiscsReport = { renamed: string[]; regrouped: string[]; moved: Record<string, number>; categoriesCreated: string[]; missing: string[] };

export async function applyDiscs115230(db: PrismaClient, { apply }: { apply: boolean }): Promise<DiscsReport> {
  const refs = read<{ items: DiscRef[] }>("discs-115-230.json").items;
  const catalog = read<CatalogItem[]>("diamond-pro-catalog.json");
  const dict = read<Record<string, Record<string, string>>>("description-translations.json");
  const translations = read<Record<string, Record<"de" | "en" | "it", Lang>>>("category-translations.json");

  const bySku = new Map(catalog.map((c) => [c.sku.toLowerCase(), c]));
  const groups = computeProductGroups(catalog);

  // Size groups are keyed on the bare name, so e.g. abrasive AB101 and
  // standard Uni105 ("Diamanttrennscheibe, gesintert, segmentiert") would be
  // one product page. Silent / abrasive blades get their own groups so each
  // sub-category only shows what belongs there; a blade left alone is shown
  // as a standalone product.
  const NO_GROUP = { groupKey: null, sizeLabel: null, sizeOrder: null, sizeSpecs: null };
  const splitKey = (ref: DiscRef) => {
    const base = groups.get(bySku.get(ref.sku.toLowerCase())?.sku ?? "");
    return base ? (ref.type === "standard" ? base.groupKey : `${base.groupKey}:${ref.type}`) : null;
  };
  const splitCount = new Map<string, number>();
  for (const ref of refs) {
    const key = splitKey(ref);
    if (key && ref.type !== "standard") splitCount.set(key, (splitCount.get(key) ?? 0) + 1);
  }
  const groupFor = (ref: DiscRef, sku: string) => {
    const base = groups.get(sku);
    if (!base) return NO_GROUP;
    if (ref.type === "standard") return base;
    const key = splitKey(ref)!;
    return (splitCount.get(key) ?? 0) >= 2 ? { ...base, groupKey: key } : NO_GROUP;
  };
  const report: DiscsReport = { renamed: [], regrouped: [], moved: {}, categoriesCreated: [], missing: [] };

  const products = await db.product.findMany({
    where: { sku: { in: refs.map((r) => r.sku), mode: "insensitive" } },
    select: { id: true, sku: true, name: true, nameFr: true, nameEn: true, nameIt: true, groupKey: true, sizeLabel: true, sizeOrder: true, sizeSpecs: true, category: { select: { slug: true } } },
  });
  const productBySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));
  report.missing = refs.filter((r) => !productBySku.has(r.sku.toLowerCase())).map((r) => r.sku);

  // 1. Names (German source + translations derived the same way as
  //    scripts/backfill-product-translations.mjs) and size grouping.
  for (const ref of refs) {
    const product = productBySku.get(ref.sku.toLowerCase());
    const item = bySku.get(ref.sku.toLowerCase());
    if (!product || !item) continue;

    const suffix = item.name.startsWith(item.descriptionDe) ? item.name.slice(item.descriptionDe.length) : "";
    const names: Record<string, string> = { name: item.name };
    for (const l of LOCALES) {
      const tr = dict[item.descriptionDe]?.[l];
      if (tr) names[`name${cap(l)}`] = `${tr}${suffix}`;
    }
    const nameChanges = Object.fromEntries(Object.entries(names).filter(([k, v]) => product[k as keyof typeof product] !== v));
    if (Object.keys(nameChanges).length > 0) {
      report.renamed.push(`${product.sku}: ${product.name} → ${item.name}`);
      if (apply) await db.product.update({ where: { id: product.id }, data: nameChanges });
    }

    const g = groupFor(ref, item.sku);
    if (g.groupKey !== product.groupKey || g.sizeLabel !== product.sizeLabel || g.sizeOrder !== product.sizeOrder || g.sizeSpecs !== product.sizeSpecs) {
      report.regrouped.push(`${product.sku}: ${product.sizeLabel ?? "—"} → ${g.sizeLabel ?? "—"}`);
      if (apply) await db.product.update({ where: { id: product.id }, data: g });
    }
  }

  // 2. Category tree: root → "Disques Ø115 – Ø230 mm" → 3 sub-categories.
  const root = await db.category.findUnique({ where: { slug: ROOT_CATEGORY } });
  const source = await db.category.findUnique({ where: { slug: SOURCE_CATEGORY } });
  const ensure = async (slug: string, fr: { name: string; description: string }, parentId: string | null, order: number) => {
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) return existing.id;
    report.categoriesCreated.push(slug);
    if (!apply) return `(new:${slug})`;
    const t = translations[slug];
    const created = await db.category.create({
      data: {
        slug,
        name: fr.name,
        description: fr.description,
        nameDe: t?.de.name, nameEn: t?.en.name, nameIt: t?.it.name,
        descriptionDe: t?.de.description, descriptionEn: t?.en.description, descriptionIt: t?.it.description,
        parentId,
        order,
      },
    });
    return created.id;
  };
  // Shown right before the old Ø115–Ø400 family in the menus.
  const parentId = await ensure(PARENT.slug, PARENT, root?.id ?? null, Math.max(0, (source?.order ?? 1) - 1));
  const childIds = {} as Record<DiscRef["type"], string>;
  for (const [type, child] of Object.entries(CHILDREN) as [DiscRef["type"], (typeof CHILDREN)[DiscRef["type"]]][]) {
    childIds[type] = await ensure(child.slug, child, parentId, child.order);
  }

  // 3. Move the Ø115–230 blades that are still in the old family.
  for (const ref of refs) {
    const product = productBySku.get(ref.sku.toLowerCase());
    if (!product || product.category.slug !== SOURCE_CATEGORY) continue;
    const target = CHILDREN[ref.type].slug;
    report.moved[target] = (report.moved[target] ?? 0) + 1;
    if (apply) await db.product.update({ where: { id: product.id }, data: { categoryId: childIds[ref.type] } });
  }

  return report;
}
