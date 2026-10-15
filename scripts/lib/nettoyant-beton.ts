// October 2026 additions, asked by the client:
//  - "Nettoyant béton" family with the ABAX Décap Béton cleaner (5 L, 20 L
//    cans, photos sent by the client) and its YouTube video;
//  - the coring video (Short) on the coring families and as a guide;
//  - home page "Parcourir par usage" order: coring tools first.
// Idempotent: run again, it only fills what is missing. The cans are created
// hidden at 0 € (price unknown) — the admin sets the price, then shows them.
import type { PrismaClient } from "@prisma/client";
import { CLEANER_CATEGORY_SLUG } from "../../src/lib/constants";
import { youtubeId, youtubeThumbnail } from "../../src/lib/video";

export const CLEANER_VIDEO = "https://youtu.be/jK_s_YOa1ro";
export const CORING_VIDEO = "https://youtube.com/shorts/BZpXmItpFCs";

const CORING_FAMILIES = ["couronnes-carottage-eau", "carottage-sec"];

/** "Parcourir par usage" / menus: coring tools first, then the cleaner, then the blades. */
const FAMILY_ORDER = [
  "couronnes-carottage-eau",
  "carottage-sec",
  CLEANER_CATEGORY_SLUG,
  "segments-bagues-carottage",
  "fixation-machine",
  "disques-115-230",
  "disques-meuleuse-tronconneuse",
  "disques-scie-sol",
  "disques-scie-murale",
  "disques-decoupeuse-couronne",
  "disques-scie-table",
  "disques-poncage",
  "blocs-poncage",
  "accessoires-diamant",
  "nettoyage",
];

const BRAND = { slug: "abax", name: "ABAX Bâtiment", description: "Produits de préparation, de nettoyage et de protection pour le bâtiment." };

const CATEGORY = {
  name: "Nettoyant béton",
  nameDe: "Betonreiniger",
  nameEn: "Concrete cleaner",
  nameIt: "Detergente per calcestruzzo",
  description: "Nettoyants pour bétonnières, centrales à béton, toupies et étais : ils éliminent le ciment et le béton séchés. Biodégradables.",
  descriptionDe: "Reiniger für Betonmischer, Mischanlagen, Fahrmischer und Stützen: entfernen angetrockneten Zement und Beton. Biologisch abbaubar.",
  descriptionEn: "Cleaners for concrete mixers, batching plants, truck mixers and props: they remove dried cement and concrete. Biodegradable.",
  descriptionIt: "Detergenti per betoniere, centrali di betonaggio, autobetoniere e puntelli: eliminano cemento e calcestruzzo induriti. Biodegradabili.",
};

// Product names: German is the products' source language (see the schema).
const NAMES = {
  name: "Betonmischer-Reiniger Décap Béton, angetrockneter Zement und Beton",
  nameFr: "Nettoyant bétonnière Décap Béton, ciment et béton séchés",
  nameEn: "Concrete mixer cleaner Décap Béton, dried cement and concrete",
  nameIt: "Detergente per betoniere Décap Béton, cemento e calcestruzzo induriti",
};

const SHORT = {
  shortDescription: "Entfernt angetrockneten Zement und Beton von Betonmischern, Fahrmischern und Stützen. Biologisch abbaubar, nicht rauchend, wirkt ab 30 Min.",
  shortDescriptionFr: "Élimine ciment et béton séchés sur bétonnières, toupies et étais. Biodégradable, non fumant, agit dès 30 min.",
  shortDescriptionEn: "Removes dried cement and concrete from mixers, truck mixers and props. Biodegradable, non-fuming, works from 30 min.",
  shortDescriptionIt: "Elimina cemento e calcestruzzo induriti da betoniere, autobetoniere e puntelli. Biodegradabile, non fumante, agisce in 30 min.",
};

const DESCRIPTIONS = {
  description: [
    "Reiniger für Betonmischer, Betonmischanlagen, Fahrmischer und Stützen: entfernt angetrockneten Zement und Beton.",
    "",
    "• Leicht gelierte Flüssigkeit, wirkt ab 30 Minuten.",
    "• Für Baumaschinen und Baugeräte geeignet, schnell und wirksam.",
    "• Nicht rauchend, biologisch abbaubar.",
    "• Ergiebigkeit: 1 L für 6 bis 8 m² (5 L ≈ 30–40 m², 20 L ≈ 120–160 m²).",
    "• Werkzeuge mit Wasser reinigen.",
    "",
    "Im Video sehen Sie das Produkt im Einsatz.",
  ].join("\n"),
  descriptionFr: [
    "Nettoyant pour bétonnières, centrales à béton, toupies et étais : il élimine le ciment et le béton séchés.",
    "",
    "• Liquide légèrement gélifié, agit dès 30 minutes.",
    "• Adapté aux matériels du BTP, rapide et efficace.",
    "• Non fumant, biodégradable.",
    "• Rendement : 1 L pour 6 à 8 m² (5 L ≈ 30 à 40 m², 20 L ≈ 120 à 160 m²).",
    "• Nettoyage des outils à l'eau.",
    "",
    "Regardez la vidéo pour voir le produit en action.",
  ].join("\n"),
  descriptionEn: [
    "Cleaner for concrete mixers, batching plants, truck mixers and props: removes dried cement and concrete.",
    "",
    "• Slightly gelled liquid, works from 30 minutes.",
    "• Suited to construction equipment, fast and effective.",
    "• Non-fuming, biodegradable.",
    "• Coverage: 1 L for 6 to 8 m² (5 L ≈ 30–40 m², 20 L ≈ 120–160 m²).",
    "• Clean tools with water.",
    "",
    "Watch the video to see the product at work.",
  ].join("\n"),
  descriptionIt: [
    "Detergente per betoniere, centrali di betonaggio, autobetoniere e puntelli: elimina cemento e calcestruzzo induriti.",
    "",
    "• Liquido leggermente gelificato, agisce in 30 minuti.",
    "• Adatto alle attrezzature edili, rapido ed efficace.",
    "• Non fumante, biodegradabile.",
    "• Resa: 1 L per 6–8 m² (5 L ≈ 30–40 m², 20 L ≈ 120–160 m²).",
    "• Pulizia degli attrezzi con acqua.",
    "",
    "Guarda il video per vedere il prodotto all'opera.",
  ].join("\n"),
};

const CANS = [
  { sku: "ABAX-DECAP-5L", slug: "nettoyant-betonniere-decap-beton-5-l", sizeLabel: "5 L", sizeOrder: 5, sizeSpecs: "Bidon 5 L · 30–40 m²", photo: "/products/abax/decap-beton-5l.webp" },
  { sku: "ABAX-DECAP-20L", slug: "nettoyant-betonniere-decap-beton-20-l", sizeLabel: "20 L", sizeOrder: 20, sizeSpecs: "Bidon 20 L · 120–160 m²", photo: "/products/abax/decap-beton-20l.webp" },
];

const TUTORIAL = {
  slug: "aide-au-carottage-materiaux-speciaux",
  title: "Aide au carottage : matériaux spéciaux",
  titleDe: "Kernbohrhilfe: Spezialmaterialien",
  titleEn: "Core drilling help: special materials",
  titleIt: "Aiuto al carotaggio: materiali speciali",
  description: "Un carottage sur bâti en vidéo, et nos conseils pour percer les matériaux spéciaux : béton armé, pierre dure, matériaux abrasifs.",
  descriptionDe: "Kernbohren mit Bohrständer im Video, dazu unsere Tipps für Spezialmaterialien: Stahlbeton, Hartgestein, abrasive Materialien.",
  descriptionEn: "Rig-mounted core drilling on video, with our tips for special materials: reinforced concrete, hard stone, abrasive materials.",
  descriptionIt: "Un carotaggio su supporto in video e i nostri consigli per i materiali speciali: cemento armato, pietra dura, materiali abrasivi.",
  content: [
    "Certains matériaux demandent plus de soin au carottage : béton fortement armé, pierre dure, matériaux abrasifs ou de faible épaisseur. La vidéo montre un carottage sur bâti ; voici les points à surveiller.",
    "",
    "1. Fixez solidement le bâti (cheville ou ventouse) et vérifiez son aplomb avant de percer.",
    "2. Choisissez la couronne selon le matériau : liant tendre pour les matériaux durs, liant dur pour les matériaux abrasifs.",
    "3. Amorcez doucement, puis gardez une avance régulière, sans forcer sur la couronne.",
    "4. Au carottage à eau, gardez un débit d'eau constant pour refroidir la couronne et évacuer les boues.",
    "5. Si la couronne n'avance plus, ses segments sont peut-être glacés : ravivez-les sur une pierre d'affûtage.",
    "",
    "Un doute sur le matériau ou la couronne à utiliser ? Appelez-nous, nous vous aidons à choisir.",
  ].join("\n"),
  contentDe: [
    "Manche Materialien verlangen beim Kernbohren mehr Sorgfalt: stark bewehrter Beton, Hartgestein, abrasive oder dünne Materialien. Das Video zeigt eine Kernbohrung mit Bohrständer; darauf sollten Sie achten:",
    "",
    "1. Bohrständer fest verankern (Dübel oder Vakuum) und vor dem Bohren ausrichten.",
    "2. Bohrkrone passend zum Material wählen: weiche Bindung für harte Materialien, harte Bindung für abrasive Materialien.",
    "3. Sanft anbohren, dann gleichmäßig vorschieben, ohne die Krone zu überlasten.",
    "4. Beim Nassbohren für einen konstanten Wasserfluss sorgen, um die Krone zu kühlen und den Bohrschlamm abzuführen.",
    "5. Kommt die Krone nicht mehr voran, sind die Segmente vielleicht verglast: auf einem Schärfstein nachschärfen.",
    "",
    "Unsicher bei Material oder Bohrkrone? Rufen Sie uns an, wir helfen Ihnen bei der Auswahl.",
  ].join("\n"),
  contentEn: [
    "Some materials need extra care when core drilling: heavily reinforced concrete, hard stone, abrasive or thin materials. The video shows rig-mounted core drilling; here is what to watch for.",
    "",
    "1. Anchor the rig firmly (anchor bolt or vacuum base) and check it is plumb before drilling.",
    "2. Pick the core bit for the material: soft bond for hard materials, hard bond for abrasive materials.",
    "3. Start gently, then keep a steady feed without forcing the bit.",
    "4. When wet drilling, keep a constant water flow to cool the bit and flush out the slurry.",
    "5. If the bit stops cutting, its segments may be glazed: dress them on a sharpening stone.",
    "",
    "Not sure about the material or the bit? Call us, we will help you choose.",
  ].join("\n"),
  contentIt: [
    "Alcuni materiali richiedono più attenzione nel carotaggio: calcestruzzo fortemente armato, pietra dura, materiali abrasivi o sottili. Il video mostra un carotaggio su supporto; ecco a cosa fare attenzione.",
    "",
    "1. Fissate bene il supporto (tassello o ventosa) e verificatene la verticalità prima di forare.",
    "2. Scegliete la corona in base al materiale: legante morbido per i materiali duri, legante duro per i materiali abrasivi.",
    "3. Iniziate piano, poi mantenete un avanzamento regolare senza forzare la corona.",
    "4. Nel carotaggio ad acqua, mantenete un flusso d'acqua costante per raffreddare la corona ed evacuare i fanghi.",
    "5. Se la corona non avanza più, i segmenti potrebbero essere vetrificati: ravvivateli su una pietra per affilare.",
    "",
    "Dubbi sul materiale o sulla corona? Chiamateci, vi aiutiamo a scegliere.",
  ].join("\n"),
};

export type CleanerReport = { lines: string[] };

export async function applyCleanerAndVideos(db: PrismaClient, { apply }: { apply: boolean }): Promise<CleanerReport> {
  const lines: string[] = [];
  const log = (l: string) => lines.push(l);

  // Families hang under the same root as the coring families.
  const coring = await db.category.findMany({ where: { slug: { in: CORING_FAMILIES } }, select: { id: true, slug: true, parentId: true, videoUrl: true } });
  const rootId = coring[0]?.parentId ?? null;

  // 1. Brand.
  let brand = await db.brand.findUnique({ where: { slug: BRAND.slug } });
  if (!brand) {
    log(`marque créée : ${BRAND.name}`);
    if (apply) brand = await db.brand.create({ data: { ...BRAND, isActive: true } });
  }

  // 2. Cleaner family (with its video, featured in the home page hero).
  let category = await db.category.findUnique({ where: { slug: CLEANER_CATEGORY_SLUG } });
  if (!category) {
    log(`catégorie créée : ${CATEGORY.name} (vidéo ${CLEANER_VIDEO})`);
    if (apply) category = await db.category.create({ data: { ...CATEGORY, slug: CLEANER_CATEGORY_SLUG, parentId: rootId, videoUrl: CLEANER_VIDEO, isActive: true } });
  } else if (!category.videoUrl) {
    log(`vidéo ajoutée à la catégorie ${category.name}`);
    if (apply) category = await db.category.update({ where: { id: category.id }, data: { videoUrl: CLEANER_VIDEO } });
  }

  // 3. The two cans: one product, two sizes. Price/stock/visibility are left
  //    alone once created — they belong to the admin.
  let nextPublic = Number(
    (await db.product.findFirst({ where: { publicSku: { startsWith: "CTP-" } }, orderBy: { publicSku: "desc" }, select: { publicSku: true } }))?.publicSku?.slice(4) ?? 0
  ) + 1;
  for (const can of CANS) {
    const other = CANS.find((c) => c !== can)!;
    const shared = {
      name: `${NAMES.name} ${can.sizeLabel}`,
      nameFr: `${NAMES.nameFr} ${can.sizeLabel}`,
      nameEn: `${NAMES.nameEn} ${can.sizeLabel}`,
      nameIt: `${NAMES.nameIt} ${can.sizeLabel}`,
      ...SHORT,
      ...DESCRIPTIONS,
      groupKey: "abax-decap-beton",
      sizeLabel: can.sizeLabel,
      sizeOrder: can.sizeOrder,
      sizeSpecs: can.sizeSpecs,
    };
    const images = [can.photo, other.photo].map((url, position) => ({ url, alt: shared.nameFr, position }));
    const videos = [{ url: CLEANER_VIDEO, title: "Décap Béton en vidéo", position: 0 }];
    const existing = await db.product.findUnique({ where: { sku: can.sku }, select: { id: true } });
    if (existing) {
      log(`produit mis à jour : ${can.sku} (textes, photos, vidéo)`);
      if (apply) {
        await db.product.update({ where: { id: existing.id }, data: shared });
        await db.productImage.deleteMany({ where: { productId: existing.id } });
        await db.productImage.createMany({ data: images.map((i) => ({ ...i, productId: existing.id })) });
        await db.productVideo.deleteMany({ where: { productId: existing.id } });
        await db.productVideo.createMany({ data: videos.map((v) => ({ ...v, productId: existing.id })) });
      }
      continue;
    }
    const publicSku = `CTP-${String(nextPublic++).padStart(5, "0")}`;
    log(`produit créé (masqué, prix à saisir) : ${can.sku} → ${shared.nameFr} (${publicSku})`);
    if (apply && brand && category) {
      await db.product.create({
        data: {
          ...shared,
          slug: can.slug,
          sku: can.sku,
          publicSku,
          price: 0,
          taxRate: 20,
          stock: 0,
          isActive: false,
          isNew: true,
          categoryId: category.id,
          brandId: brand.id,
          images: { create: images },
          videos: { create: videos },
        },
      });
    }
  }

  // 4. Coring video on the coring families (unless one was set in the admin).
  for (const c of coring) {
    if (c.videoUrl) continue;
    log(`vidéo de carottage ajoutée à la catégorie ${c.slug}`);
    if (apply) await db.category.update({ where: { id: c.id }, data: { videoUrl: CORING_VIDEO } });
  }

  // 5. Family order: coring first.
  const families = await db.category.findMany({ where: { slug: { in: FAMILY_ORDER } }, select: { id: true, slug: true, order: true } });
  for (const f of families) {
    const order = FAMILY_ORDER.indexOf(f.slug) + 1;
    if (f.order === order) continue;
    log(`ordre ${f.slug} : ${f.order} → ${order}`);
    if (apply) await db.category.update({ where: { id: f.id }, data: { order } });
  }

  // 6. The coring video as a guide, with a few coring products.
  if (!(await db.tutorial.findUnique({ where: { slug: TUTORIAL.slug } }))) {
    const coringIds = coring.map((c) => c.id);
    const candidates = await db.product.findMany({
      where: { isActive: true, OR: [{ categoryId: { in: coringIds } }, { category: { parentId: { in: coringIds } } }] },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
      select: { id: true, groupKey: true },
    });
    const seen = new Set<string>();
    const products = candidates.filter((p) => !seen.has(p.groupKey ?? p.id) && seen.add(p.groupKey ?? p.id)).slice(0, 4);
    log(`guide créé : ${TUTORIAL.title} (${products.length} produits associés)`);
    if (apply) {
      await db.tutorial.create({
        data: {
          ...TUTORIAL,
          videoUrl: CORING_VIDEO,
          thumbnailUrl: youtubeThumbnail(youtubeId(CORING_VIDEO)!),
          durationMinutes: 1,
          level: "INTERMEDIATE",
          categoryId: coring.find((c) => c.slug === CORING_FAMILIES[0])?.id ?? null,
          tags: ["carottage", "vidéo"],
          isPublished: true,
          products: { create: products.map((p, position) => ({ productId: p.id, position })) },
        },
      });
    }
  }

  if (lines.length === 0) log("rien à faire, tout est déjà en place");
  return { lines };
}
