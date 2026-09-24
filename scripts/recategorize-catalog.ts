// Re-files the supplier catalogue into the shop's new category tree.
//
//   npx tsx scripts/recategorize-catalog.ts            → dry run (prints the split, writes nothing)
//   npx tsx scripts/recategorize-catalog.ts --apply    → rewrites prisma/data/*.json (so re-seeding
//                                                        matches) AND updates the database
//
// Database side is non-destructive: new categories are created, products /
// tutorials / coupons are re-pointed, and the old categories are only
// deactivated (never deleted), so nothing referencing them can break.
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { RETIRED_CATEGORY_REDIRECTS } from "../src/lib/category-redirects";

type Lang = { name: string; description: string };
type NewCategory = { slug: string; fr: Lang; de: Lang; en: Lang; it: Lang };

const NEW_CATEGORIES: NewCategory[] = [
  {
    slug: "disques-meuleuse-tronconneuse",
    fr: { name: "Disques meuleuse d'angle & tronçonneuse (Ø115 – Ø400 mm)", description: "Disques diamant de coupe pour meuleuses d'angle et tronçonneuses, du Ø115 au Ø400 mm." },
    de: { name: "Trennscheiben für Winkelschleifer & Trennschleifer (Ø115 – Ø400 mm)", description: "Diamant-Trennscheiben für Winkelschleifer und Trennschleifer, Ø115 bis Ø400 mm." },
    en: { name: "Angle grinder & cut-off saw blades (Ø115 – Ø400 mm)", description: "Diamond cutting blades for angle grinders and cut-off saws, Ø115 to Ø400 mm." },
    it: { name: "Dischi per smerigliatrice e troncatrice (Ø115 – Ø400 mm)", description: "Dischi diamantati da taglio per smerigliatrici angolari e troncatrici, da Ø115 a Ø400 mm." },
  },
  {
    slug: "disques-scie-table",
    fr: { name: "Disques scie sur table", description: "Disques diamant à jante continue pour scies sur table et scies à eau : carrelage, grès, pierre." },
    de: { name: "Trennscheiben für Tischsägen", description: "Diamant-Trennscheiben mit geschlossenem Rand für Tischsägen und Nasssägen: Fliesen, Feinsteinzeug, Naturstein." },
    en: { name: "Table saw blades", description: "Continuous-rim diamond blades for table saws and wet saws: tile, porcelain, natural stone." },
    it: { name: "Dischi per seghe da banco", description: "Dischi diamantati a bordo continuo per seghe da banco e taglio ad acqua: piastrelle, gres, pietra." },
  },
  {
    slug: "disques-scie-sol",
    fr: { name: "Disques scie à sol", description: "Disques diamant pour scies à sol : béton, béton armé et asphalte." },
    de: { name: "Trennscheiben für Bodensägen", description: "Diamant-Trennscheiben für Bodensägen: Beton, Stahlbeton und Asphalt." },
    en: { name: "Floor saw blades", description: "Diamond blades for floor saws: concrete, reinforced concrete and asphalt." },
    it: { name: "Dischi per seghe da pavimento", description: "Dischi diamantati per seghe da pavimento: calcestruzzo, cemento armato e asfalto." },
  },
  {
    slug: "couronnes-carottage-eau",
    fr: { name: "Couronnes de carottage à eau", description: "Couronnes et forets diamant pour le carottage à l'eau du béton, de la maçonnerie et de la pierre." },
    de: { name: "Bohrkronen für Nassbohren", description: "Diamant-Bohrkronen und -Bohrer für das Nassbohren von Beton, Mauerwerk und Stein." },
    en: { name: "Wet core drill bits", description: "Diamond core bits and drills for wet drilling of concrete, masonry and stone." },
    it: { name: "Corone per carotaggio ad acqua", description: "Corone e punte diamantate per il carotaggio ad acqua di calcestruzzo, muratura e pietra." },
  },
  {
    slug: "carottage-sec",
    fr: { name: "Outils et couronnes de carottage à sec", description: "Couronnes, forets, trépans de boîtiers et outils diamant pour le perçage à sec." },
    de: { name: "Werkzeuge und Bohrkronen für Trockenbohren", description: "Bohrkronen, Bohrer, Dosensenker und Diamantwerkzeuge für das Trockenbohren." },
    en: { name: "Dry core drilling tools and bits", description: "Core bits, drills, box cutters and diamond tools for dry drilling." },
    it: { name: "Utensili e corone per carotaggio a secco", description: "Corone, punte, fresa per scatole e utensili diamantati per la foratura a secco." },
  },
  {
    slug: "segments-bagues-carottage",
    fr: { name: "Segments et bagues de carottage", description: "Segments diamant et bagues de rechange pour couronnes de carottage." },
    de: { name: "Segmente und Ringe für Bohrkronen", description: "Diamantsegmente und Ersatzringe für Bohrkronen." },
    en: { name: "Core bit segments and rings", description: "Diamond segments and replacement rings for core bits." },
    it: { name: "Segmenti e anelli per corone da carotaggio", description: "Segmenti diamantati e anelli di ricambio per corone da carotaggio." },
  },
  {
    slug: "disques-scie-murale",
    fr: { name: "Disques scie murale", description: "Disques diamant à noyau sandwich pour scies murales et découpe de béton armé." },
    de: { name: "Trennscheiben für Wandsägen", description: "Diamant-Trennscheiben mit Sandwichkern für Wandsägen und das Schneiden von Stahlbeton." },
    en: { name: "Wall saw blades", description: "Sandwich-core diamond blades for wall saws and cutting reinforced concrete." },
    it: { name: "Dischi per seghe a parete", description: "Dischi diamantati con anima sandwich per seghe a parete e taglio di cemento armato." },
  },
  {
    slug: "fixation-machine",
    fr: { name: "Fixation machine", description: "Adaptateurs, raccords et fixations pour monter les outils diamant sur la machine." },
    de: { name: "Maschinenaufnahmen", description: "Adapter, Aufnahmen und Befestigungen zur Montage von Diamantwerkzeugen an der Maschine." },
    en: { name: "Machine fittings", description: "Adapters, connectors and fixings for mounting diamond tools onto the machine." },
    it: { name: "Attacchi macchina", description: "Adattatori, raccordi e fissaggi per montare gli utensili diamantati sulla macchina." },
  },
  {
    slug: "disques-poncage",
    fr: { name: "Disques de ponçage", description: "Assiettes, disques et fraises diamant pour poncer, meuler et rectifier béton, chape et pierre." },
    de: { name: "Schleifscheiben", description: "Diamant-Schleifteller, -scheiben und -fräser zum Schleifen von Beton, Estrich und Stein." },
    en: { name: "Grinding discs", description: "Diamond cup wheels, discs and groove cutters for grinding concrete, screed and stone." },
    it: { name: "Dischi abrasivi per levigatura", description: "Piatti, dischi e frese diamantate per levigare calcestruzzo, massetto e pietra." },
  },
  {
    slug: "disques-decoupeuse-couronne",
    fr: { name: "Disques découpeuse béton à couronne", description: "Disques et segments pour découpeuses à béton à couronne (scies à anneau)." },
    de: { name: "Trennscheiben für Ringsägen (Beton)", description: "Trennscheiben und Segmente für Betonringsägen." },
    en: { name: "Concrete ring saw blades", description: "Blades and segments for concrete ring saws." },
    it: { name: "Dischi per troncatrici ad anello (calcestruzzo)", description: "Dischi e segmenti per troncatrici ad anello per calcestruzzo." },
  },
  {
    slug: "blocs-poncage",
    fr: { name: "Blocs de ponçage", description: "Blocs et segments de ponçage diamant pour machines de surfaçage du sol." },
    de: { name: "Schleifblöcke", description: "Diamant-Schleifblöcke und -segmente für Bodenschleifmaschinen." },
    en: { name: "Grinding blocks", description: "Diamond grinding blocks and segments for floor grinding machines." },
    it: { name: "Blocchi abrasivi", description: "Blocchi e segmenti abrasivi diamantati per levigatrici da pavimento." },
  },
  {
    slug: "accessoires-diamant",
    fr: { name: "Accessoires", description: "Accessoires pour le perçage et la découpe : têtes de rinçage, valises, guides de centrage, refroidissement." },
    de: { name: "Zubehör", description: "Zubehör zum Bohren und Trennen: Spülköpfe, Koffer, Zentrierhilfen, Kühlung." },
    en: { name: "Accessories", description: "Accessories for drilling and cutting: flush heads, cases, centring aids, coolant." },
    it: { name: "Accessori", description: "Accessori per foratura e taglio: teste di lavaggio, valigette, guide di centraggio, refrigerante." },
  },
  {
    slug: "nettoyage",
    fr: { name: "Nettoyage", description: "Pierres et plaques d'affûtage pour nettoyer et raviver les outils diamant." },
    de: { name: "Reinigung", description: "Schärfsteine und -platten zum Reinigen und Schärfen von Diamantwerkzeugen." },
    en: { name: "Cleaning", description: "Dressing stones and plates to clean and re-sharpen diamond tools." },
    it: { name: "Pulizia", description: "Pietre e piastre di affilatura per pulire e riattivare gli utensili diamantati." },
  },
];

const S = {
  A: "disques-meuleuse-tronconneuse",
  B: "disques-scie-table",
  C: "disques-scie-sol",
  D: "couronnes-carottage-eau",
  E: "carottage-sec",
  F: "segments-bagues-carottage",
  G: "disques-scie-murale",
  H: "fixation-machine",
  I: "disques-poncage",
  J: "disques-decoupeuse-couronne",
  K: "blocs-poncage",
  L: "accessoires-diamant",
  N: "nettoyage",
};

// Old category → new category, for tutorials and category-targeted coupons.
const OLD_TO_NEW: Record<string, string> = { ...RETIRED_CATEGORY_REDIRECTS, "accessoires-diamant": S.L };

type Item = {
  sku: string;
  name: string;
  descriptionDe: string;
  categorySlug: string;
  categoryName: string;
  specs: string[];
  specLabels: string[] | null;
};

const NUMERIC = /^\d+(?:[.,]\d+)?$/;
const SUFFIX = /Ø\s*(\d+(?:[.,]\d+)?)\s*(?:mm)?\s*$/i;

function diameter(item: Item): number | null {
  const first = item.specs[0]?.trim();
  if (first && NUMERIC.test(first)) {
    const v = Number(first.replace(",", "."));
    if (v >= 40 && v <= 2000) return v;
  }
  if (item.specs.length === 0) {
    const m = item.name.match(SUFFIX);
    if (m) return Number(m[1].replace(",", "."));
  }
  return null;
}

function categoryFor(item: Item): string {
  const desc = (item.descriptionDe || item.name).toLowerCase();
  const sku = item.sku;
  const old = item.categorySlug;
  const d = diameter(item);

  // Concrete ring saws (Partner / Husqvarna "PR-…" references).
  if (/^PR-/i.test(sku)) return S.J;

  if (old === "interflex") return S.A;
  if (old === "disques-diamant-asphalte") return S.C;
  if (old === "disques-diamant-pierre-naturelle") return S.B;

  if (old === "accessoires-diamant") {
    if (/schärf/.test(desc) || /^Schärf/i.test(sku)) return S.N;
    if (/adapter|aufnahme|6-kant|sds|spannmutter|flansch|zapfen|winkelschleifer/.test(desc) || /^(VL-|AD-|PH-)/i.test(sku) || /^100 /.test(desc)) return S.H;
    return S.L;
  }

  if (old === "meules-diamant") {
    if (/schleifblock|blastrac|contec|segment aufnahme/.test(desc) || /^(Schleifblock|PKD-SP|HC-PCD)/i.test(sku) || desc === "pkd") return S.K;
    return S.I;
  }

  if (old === "forets-diamant") {
    if (
      /bohrkronen-segment|^segment$|segmenthöhe|ø segment aufnahme/.test(desc) ||
      /^(Z10F|G10F|G3DF|HP-S10F|SBTB-|Ring-|3D-Set-112)/i.test(sku)
    )
      return S.F;
    if (
      /trocken|dry drilling|dosensenker|vakuum-verfahren|fräser|wolframcarbid|^6 m 14|ø aufnahme|länge 70|^68$|6-kant\/hex/.test(desc) ||
      /^(GVV-|DST-|DSBT-|LSAB-|SBTM|3D-SET|Koffer|FK-TR)/i.test(sku)
    )
      return S.E;
    return S.D;
  }

  // Cutting discs (old 115-230, 250-1000, autres).
  if (/wolframcarbid|hartmetall/.test(desc)) return S.A;
  const closedRim = /geschlossen(em|er) rand|warmgepresst/.test(desc);
  if (closedRim && d != null && d >= 200) return S.B;
  if (/sandwichkern/.test(desc) && d != null && d > 400) return S.G;
  if (d != null) return d <= 400 ? S.A : S.C;
  return old === "disques-diamant-250-1000" ? S.C : S.A;
}

const catalogPath = "prisma/data/diamond-pro-catalog.json";
const catalog: Item[] = JSON.parse(readFileSync(catalogPath, "utf8"));
// One-shot migration: the rules below read the ORIGINAL supplier categories.
// Once the JSON has been rewritten those are gone, and re-running would
// silently mis-file everything.
if (!catalog.some((item) => item.categorySlug in RETIRED_CATEGORY_REDIRECTS)) {
  console.log("Catalogue déjà recatégorisé — rien à faire (script à usage unique).");
  process.exit(0);
}

const assignment = new Map(catalog.map((item) => [item.sku, categoryFor(item)]));

const counts = new Map<string, number>();
for (const slug of assignment.values()) counts.set(slug, (counts.get(slug) ?? 0) + 1);

console.log("Répartition prévue :");
for (const c of NEW_CATEGORIES) console.log(`  ${String(counts.get(c.slug) ?? 0).padStart(4)}  ${c.fr.name}`);
console.log(`  total ${[...counts.values()].reduce((a, b) => a + b, 0)} / ${catalog.length}`);

if (!process.argv.includes("--apply")) {
  const bySlug = new Map<string, Item[]>();
  for (const item of catalog) bySlug.set(assignment.get(item.sku)!, [...(bySlug.get(assignment.get(item.sku)!) ?? []), item]);
  for (const c of NEW_CATEGORIES) {
    const items = bySlug.get(c.slug) ?? [];
    const distinct = [...new Set(items.map((i) => (i.descriptionDe || i.name).slice(0, 70)))];
    console.log(`\n## ${c.fr.name}`);
    for (const t of distinct.slice(0, 9)) console.log("   ·", t);
    if (distinct.length > 9) console.log(`   … +${distinct.length - 9} autres libellés`);
  }
  console.log("\n(essai à blanc — rien n'a été écrit)");
  process.exit(0);
}

async function apply() {
  // 1. Data files, so `prisma db seed` reproduces the same structure.
  const nameOf = new Map(NEW_CATEGORIES.map((c) => [c.slug, c.fr.name]));
  for (const item of catalog) {
    item.categorySlug = assignment.get(item.sku)!;
    item.categoryName = nameOf.get(item.categorySlug)!;
  }
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
  writeFileSync(
    "prisma/data/diamond-pro-categories.json",
    JSON.stringify(NEW_CATEGORIES.map((c) => ({ slug: c.slug, name: c.fr.name })), null, 2) + "\n"
  );
  const translations = JSON.parse(readFileSync("prisma/data/category-translations.json", "utf8"));
  const next: Record<string, unknown> = { "outils-diamant": translations["outils-diamant"] };
  for (const c of NEW_CATEGORIES) next[c.slug] = { de: c.de, en: c.en, it: c.it };
  writeFileSync("prisma/data/category-translations.json", JSON.stringify(next, null, 2) + "\n");

  // 2. Database.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });
  try {
    const root = await db.category.findUniqueOrThrow({ where: { slug: "outils-diamant" } });
    const ids = new Map<string, string>();

    for (const [i, c] of NEW_CATEGORIES.entries()) {
      const data = {
        name: c.fr.name,
        description: c.fr.description,
        nameDe: c.de.name,
        nameEn: c.en.name,
        nameIt: c.it.name,
        descriptionDe: c.de.description,
        descriptionEn: c.en.description,
        descriptionIt: c.it.description,
        parentId: root.id,
        order: i,
        isActive: true,
      };
      const existing = await db.category.findUnique({ where: { slug: c.slug } });
      const row = existing
        ? await db.category.update({ where: { slug: c.slug }, data })
        : await db.category.create({
            data: { ...data, slug: c.slug, imageUrl: `https://picsum.photos/seed/atelia-cat-${c.slug}/1000/1000` },
          });
      ids.set(c.slug, row.id);
    }

    // Products, one bulk update per target category.
    const bySlug = new Map<string, string[]>();
    for (const [sku, slug] of assignment) bySlug.set(slug, [...(bySlug.get(slug) ?? []), sku]);
    for (const [slug, skus] of bySlug) {
      const res = await db.product.updateMany({ where: { sku: { in: skus } }, data: { categoryId: ids.get(slug)! } });
      console.log(`  ${String(res.count).padStart(4)} produits → ${slug}`);
    }

    // Tutorials and category-targeted coupons follow their old category.
    for (const [oldSlug, newSlug] of Object.entries(OLD_TO_NEW)) {
      const old = await db.category.findUnique({ where: { slug: oldSlug } });
      if (!old || old.id === ids.get(newSlug)) continue;
      const t = await db.tutorial.updateMany({ where: { categoryId: old.id }, data: { categoryId: ids.get(newSlug)! } });
      const c = await db.coupon.updateMany({ where: { categoryId: old.id }, data: { categoryId: ids.get(newSlug)! } });
      if (t.count + c.count > 0) console.log(`  ${oldSlug} → ${newSlug}: ${t.count} tutoriel(s), ${c.count} coupon(s)`);
    }

    // Old categories are hidden, never deleted.
    const retired = Object.keys(OLD_TO_NEW).filter((s) => !ids.has(s));
    const off = await db.category.updateMany({ where: { slug: { in: retired } }, data: { isActive: false } });
    console.log(`  ${off.count} anciennes catégories désactivées`);
  } finally {
    await db.$disconnect();
  }
}

apply().catch((err) => {
  console.error(err);
  process.exit(1);
});
