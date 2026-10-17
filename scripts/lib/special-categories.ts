// October 2026, asked by the client — "Produits spéciaux" families, shown in
// the band under the home hero:
//  - "Aide au carottage": the 37 workshop photos (public/categories/aide-au-carottage/)
//    and the coring Short. Replaces the two photo sub-categories of
//    "Accessoires" created the day before (old links redirect, see
//    src/lib/category-redirects.ts); photos uploaded to them since are kept.
//  - "Débouchage de tubes": hydraulic core ejectors and core catchers, from
//    the supplier's leaflet and order form (H250067_Betonkerntreiber_2/3/4.pdf):
//    their photos (public/categories/debouchage-tubes/), a description in 4
//    languages, the client's Short. The PDFs themselves are not published —
//    they show the supplier's name, contact details and purchase prices.
//  - "Nettoyant béton" joins the band with its two cans.
// Idempotent: creates what is missing, never overwrites photos or videos set
// in the admin.
import type { PrismaClient } from "@prisma/client";
import { CLEANER_CATEGORY_SLUG } from "../../src/lib/constants";
import { CORING_VIDEO } from "./nettoyant-beton";

const photos = (folder: string, count: number) =>
  Array.from({ length: count }, (_, i) => `/categories/${folder}/${String(i + 1).padStart(2, "0")}.webp`);

/** Family order (Catégories → Ordre): coring first. */
const FAMILY_ORDER = [
  "couronnes-carottage-eau",
  "carottage-sec",
  "aide-au-carottage",
  "debouchage-tubes",
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

const AIDE = {
  slug: "aide-au-carottage",
  images: photos("aide-au-carottage", 37),
  videoUrl: CORING_VIDEO,
  name: "Aide au carottage",
  nameDe: "Kernbohrhilfen",
  nameEn: "Core drilling aids",
  nameIt: "Ausili per il carotaggio",
  description:
    "Accessoires pour bâtis de carottage : têtes inclinables graduées, rallonges et raccords de colonne, bras d'écartement, platines, et platine à galets pour scie murale sur rail. En vidéo : un carottage de matériaux spéciaux.",
  descriptionDe:
    "Zubehör für Kernbohrständer: Winkelverstellungen mit Skala, Säulenverlängerungen und -verbinder, Abstandsarme, Platten sowie Rollenplatte für Wandsägen auf Schiene. Im Video: Kernbohren in Spezialmaterialien.",
  descriptionEn:
    "Accessories for core drill rigs: graduated tilting heads, column extensions and joiners, offset arms, plates, and a roller plate for rail-mounted wall saws. On video: core drilling in special materials.",
  descriptionIt:
    "Accessori per supporti di carotaggio: teste inclinabili graduate, prolunghe e giunti per colonna, bracci distanziali, piastre e piastra a rulli per seghe da parete su binario. Nel video: carotaggio di materiali speciali.",
};

const DEBOUCHAGE = {
  slug: "debouchage-tubes",
  images: photos("debouchage-tubes", 10),
  videoUrl: "https://youtube.com/shorts/EYF_7YYjyRM",
  name: "Débouchage de tubes",
  nameDe: "Bohrkronen entkernen",
  nameEn: "Core bit unblocking",
  nameIt: "Sblocco delle corone",
  description: [
    "Une carotte coincée dans la couronne ? Le chasse-carotte hydraulique la pousse hors du tube en quelques minutes, sans effort, sur chantier comme en atelier.",
    "",
    "• Chasse-carotte hydraulique 5 t : pour le chantier et l'atelier, avec 5 poussoirs Ø16 mm et 3 poussoirs Ø10 mm de longueurs différentes, en coffret.",
    "• Chasse-carotte hydraulique 20 t : pour les carottes très serrées, par exemple les gros diamètres, avec 5 poussoirs Ø18 mm de longueurs différentes, en coffret.",
    "• Support pivotant à raccords 1/2\" et 1¼\" : on l'écarte pour choisir le poussoir de la bonne longueur.",
    "• En atelier, l'appareil se serre dans un étau : quelques coups de pompe suffisent (environ 2 min).",
    "• Les petites couronnes en 1/2\", souvent jetées faute de pouvoir les vider, redeviennent utilisables.",
    "",
    "Récupérateurs de carotte pour couronnes 1¼\", Gölz, Duss (bride 6 trous) et bride 3 trous : ils retiennent la carotte lors des carottages de dalles et de canalisations. Il suffit d'un trou pilote d'environ 18 mm au centre, fermé par une rondelle en mousse pour que l'eau de carottage ne s'écoule pas. Les tiges sont repérées par couleur selon la longueur de la couronne : blanc 175 mm, jaune 300 mm, bleu 400 mm, rouge 450 mm. Tête de 15 mm jusqu'à Ø250 mm, 18 mm au-delà.",
    "",
    "Obturateur de trou pilote avec 2 boulons de fermeture.",
  ].join("\n"),
  descriptionDe: [
    "Bohrkern steckt in der Bohrkrone fest? Der hydraulische Bohrkerntreiber drückt ihn in wenigen Minuten ohne Kraftaufwand heraus – auf der Baustelle wie in der Werkstatt.",
    "",
    "• Hydraulischer Bohrkerntreiber 5 t: für Baustelle und Werkstatt, mit 5 Druckstempeln Ø16 mm und 3 Druckstempeln Ø10 mm in verschiedenen Längen, im Sortimentskoffer.",
    "• Hydraulischer Bohrkerntreiber 20 t: für besonders festsitzende Bohrkerne, z. B. Großbohrungen, mit 5 Druckstempeln Ø18 mm in verschiedenen Längen, im Sortimentskoffer.",
    "• Wegschwenkbares Aufnahmeteil mit 1/2\"- und 1¼\"-Gewindeanschluss: so wählt man den Druckstempel in der passenden Länge.",
    "• In der Werkstatt wird er in einen Schraubstock gespannt: wenige Hübe genügen (ca. 2 Min.).",
    "• Kleine Bohrkronen mit 1/2\"-Aufnahme, die sonst oft entsorgt werden, sind wieder einsatzfähig.",
    "",
    "Bohrkernfänger für Bohrkronen mit 1¼\", Gölz, Duss (6-Loch-Flansch) und 3-Loch-Flansch: halten den Bohrkern bei Bohrungen in Decken und Kanalrohren. Nötig ist nur eine Pilotbohrung von ca. 18 mm in der Mitte, abgedichtet mit einer Schaumdichtscheibe, damit das Bohrwasser nicht abläuft. Die Haltegestänge sind je nach Bohrkronenlänge farbig gekennzeichnet: weiß 175 mm, gelb 300 mm, blau 400 mm, rot 450 mm. Fängerkopf 15 mm bis Ø250 mm, darüber 18 mm.",
    "",
    "Pilotlochschließer mit 2 Verschlussbolzen.",
  ].join("\n"),
  descriptionEn: [
    "Core stuck in the core bit? The hydraulic core ejector pushes it out of the barrel in a few minutes, effortlessly, on site or in the workshop.",
    "",
    "• Hydraulic core ejector 5 t: for site and workshop, with 5 push rods Ø16 mm and 3 push rods Ø10 mm of different lengths, in a case.",
    "• Hydraulic core ejector 20 t: for very tight cores, e.g. large diameters, with 5 push rods Ø18 mm of different lengths, in a case.",
    "• Swivelling holder with 1/2\" and 1¼\" threads: swing it aside to pick the push rod of the right length.",
    "• In the workshop, clamp it in a vice: a few pump strokes are enough (about 2 min).",
    "• Small 1/2\" core bits, often thrown away because their core can't be removed, become usable again.",
    "",
    "Core catchers for 1¼\", Gölz, Duss (6-hole flange) and 3-hole flange core bits: they hold the core when drilling through slabs and sewer pipes. All it takes is a pilot hole of about 18 mm in the centre, sealed with a foam washer so the drilling water doesn't run off. The rods are colour-coded by core bit length: white 175 mm, yellow 300 mm, blue 400 mm, red 450 mm. 15 mm head up to Ø250 mm, 18 mm above.",
    "",
    "Pilot hole plug with 2 sealing bolts.",
  ].join("\n"),
  descriptionIt: [
    "Carota bloccata nella corona? L'estrattore idraulico la spinge fuori dal tubo in pochi minuti, senza fatica, in cantiere come in officina.",
    "",
    "• Estrattore idraulico 5 t: per cantiere e officina, con 5 punzoni Ø16 mm e 3 punzoni Ø10 mm di lunghezze diverse, in valigetta.",
    "• Estrattore idraulico 20 t: per carote molto bloccate, ad esempio grandi diametri, con 5 punzoni Ø18 mm di lunghezze diverse, in valigetta.",
    "• Supporto orientabile con attacchi 1/2\" e 1¼\": si sposta per scegliere il punzone della lunghezza giusta.",
    "• In officina si fissa in una morsa: bastano pochi colpi di pompa (circa 2 min).",
    "• Le piccole corone con attacco 1/2\", spesso buttate perché non si riesce a svuotarle, tornano utilizzabili.",
    "",
    "Ferma-carote per corone 1¼\", Gölz, Duss (flangia a 6 fori) e flangia a 3 fori: trattengono la carota nelle forature di solai e tubazioni. Basta un foro pilota di circa 18 mm al centro, chiuso con una guarnizione in schiuma perché l'acqua di perforazione non defluisca. Le aste sono colorate secondo la lunghezza della corona: bianco 175 mm, giallo 300 mm, blu 400 mm, rosso 450 mm. Testa da 15 mm fino a Ø250 mm, 18 mm oltre.",
    "",
    "Tappo per foro pilota con 2 bulloni di chiusura.",
  ].join("\n"),
};

const CLEANER_PHOTOS = ["/products/abax/decap-beton-5l.webp", "/products/abax/decap-beton-20l.webp"];

export async function applySpecialCategories(db: PrismaClient, { apply }: { apply: boolean }): Promise<{ lines: string[] }> {
  const lines: string[] = [];
  const log = (l: string) => lines.push(l);
  const rootId = (await db.category.findUnique({ where: { slug: FAMILY_ORDER[0] }, select: { parentId: true } }))?.parentId ?? null;

  // 1. "Aide au carottage", taking over "Accessoires carottage" / "Accessoires sciage".
  const oldCoring = await db.category.findUnique({ where: { slug: "accessoires-carottage" }, select: { id: true, images: true, _count: { select: { products: true } } } });
  const oldSawing = await db.category.findUnique({ where: { slug: "accessoires-sciage" }, select: { id: true, images: true, _count: { select: { products: true } } } });
  // Photos uploaded in the admin to the old sub-categories since (not the ones of the first import).
  const kept = [...(oldCoring?.images ?? []), ...(oldSawing?.images ?? [])].filter((url) => !url.startsWith("/categories/accessoires-"));
  const { slug: aideSlug, ...aide } = AIDE;
  const existingAide = await db.category.findUnique({ where: { slug: aideSlug }, select: { id: true, images: true, videoUrl: true, featuredOnHome: true } });
  if (existingAide) {
    const update = {
      ...(existingAide.images.length === 0 ? { images: [...aide.images, ...kept] } : {}),
      ...(!existingAide.videoUrl ? { videoUrl: aide.videoUrl } : {}),
      ...(!existingAide.featuredOnHome ? { featuredOnHome: true } : {}),
    };
    if (Object.keys(update).length > 0) {
      log(`« ${aide.name} » complétée : ${Object.keys(update).join(", ")}`);
      if (apply) await db.category.update({ where: { id: existingAide.id }, data: update });
    }
  } else if (oldCoring) {
    log(`« Accessoires carottage » devient « ${aide.name} » (famille, ${aide.images.length + kept.length} photos, vidéo, produits spéciaux)`);
    if (apply) {
      await db.category.update({
        where: { id: oldCoring.id },
        data: { ...aide, slug: aideSlug, images: [...aide.images, ...kept], parentId: rootId, featuredOnHome: true, isActive: true },
      });
    }
  } else {
    log(`catégorie créée : ${aide.name} (${aide.images.length} photos, vidéo, produits spéciaux)`);
    if (apply) await db.category.create({ data: { ...aide, slug: aideSlug, parentId: rootId, featuredOnHome: true, isActive: true } });
  }
  if (oldSawing) {
    if (oldSawing._count.products > 0) {
      log(`« Accessoires sciage » garde ${oldSawing._count.products} produit(s) : laissée telle quelle`);
    } else {
      log(`« Accessoires sciage » supprimée (ses 2 photos sont dans « ${aide.name} »)`);
      if (apply) await db.category.delete({ where: { id: oldSawing.id } });
    }
  }

  // 2. "Débouchage de tubes".
  const { slug: debSlug, ...deb } = DEBOUCHAGE;
  const existingDeb = await db.category.findUnique({ where: { slug: debSlug }, select: { id: true, images: true, videoUrl: true } });
  if (!existingDeb) {
    log(`catégorie créée : ${deb.name} (${deb.images.length} photos, vidéo, produits spéciaux)`);
    if (apply) await db.category.create({ data: { ...deb, slug: debSlug, parentId: rootId, featuredOnHome: true, isActive: true } });
  } else if (existingDeb.images.length === 0 || !existingDeb.videoUrl) {
    log(`« ${deb.name} » complétée (photos / vidéo)`);
    if (apply) {
      await db.category.update({
        where: { id: existingDeb.id },
        data: { ...(existingDeb.images.length === 0 ? { images: deb.images } : {}), ...(!existingDeb.videoUrl ? { videoUrl: deb.videoUrl } : {}) },
      });
    }
  }

  // 3. The cleaner joins the band, with its two cans.
  const cleaner = await db.category.findUnique({ where: { slug: CLEANER_CATEGORY_SLUG }, select: { id: true, images: true, featuredOnHome: true } });
  if (cleaner && (!cleaner.featuredOnHome || cleaner.images.length === 0)) {
    log(`« Nettoyant béton » dans les produits spéciaux${cleaner.images.length === 0 ? ", avec la photo des 2 bidons" : ""}`);
    if (apply) {
      await db.category.update({
        where: { id: cleaner.id },
        data: { featuredOnHome: true, ...(cleaner.images.length === 0 ? { images: CLEANER_PHOTOS } : {}) },
      });
    }
  }

  // 4. Family order.
  const families = await db.category.findMany({ where: { slug: { in: FAMILY_ORDER } }, select: { id: true, slug: true, order: true } });
  for (const f of families) {
    const order = FAMILY_ORDER.indexOf(f.slug) + 1;
    if (f.order === order) continue;
    log(`ordre ${f.slug} : ${f.order} → ${order}`);
    if (apply) await db.category.update({ where: { id: f.id }, data: { order } });
  }

  if (lines.length === 0) log("rien à faire, tout est déjà en place");
  return { lines };
}
