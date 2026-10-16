// "Accessoires carottage" / "Accessoires sciage": sub-categories of
// "Accessoires" holding the client's workshop photos (October 2026, 35 + 2
// photos in public/categories/) — accessories shown, not yet sold online.
// Idempotent: creates what is missing, never overwrites photos edited in the admin.
import type { PrismaClient } from "@prisma/client";

const PARENT_SLUG = "accessoires-diamant";

const photos = (folder: string, count: number) =>
  Array.from({ length: count }, (_, i) => `/categories/${folder}/${String(i + 1).padStart(2, "0")}.webp`);

const SUB_CATEGORIES = [
  {
    slug: "accessoires-carottage",
    order: 1,
    images: photos("accessoires-carottage", 35),
    name: "Accessoires carottage",
    nameDe: "Kernbohr-Zubehör",
    nameEn: "Core drilling accessories",
    nameIt: "Accessori per carotaggio",
    description: "Accessoires pour bâtis de carottage : têtes inclinables graduées, rallonges et raccords de colonne, bras d'écartement, platines.",
    descriptionDe: "Zubehör für Kernbohrständer: Winkelverstellungen mit Skala, Säulenverlängerungen und -verbinder, Abstandsarme, Platten.",
    descriptionEn: "Accessories for core drill rigs: graduated tilting heads, column extensions and joiners, offset arms, plates.",
    descriptionIt: "Accessori per supporti di carotaggio: teste inclinabili graduate, prolunghe e giunti per colonna, bracci distanziali, piastre.",
  },
  {
    slug: "accessoires-sciage",
    order: 2,
    images: photos("accessoires-sciage", 2),
    name: "Accessoires sciage",
    nameDe: "Säge-Zubehör",
    nameEn: "Sawing accessories",
    nameIt: "Accessori per taglio",
    description: "Accessoires pour scies murales sur rail.",
    descriptionDe: "Zubehör für Wandsägen auf Schiene.",
    descriptionEn: "Accessories for rail-mounted wall saws.",
    descriptionIt: "Accessori per seghe da parete su binario.",
  },
];

export async function applyAccessoryPhotos(db: PrismaClient, { apply }: { apply: boolean }): Promise<{ lines: string[] }> {
  const lines: string[] = [];
  const parent = await db.category.findUnique({ where: { slug: PARENT_SLUG }, select: { id: true } });
  if (!parent) return { lines: [`catégorie « ${PARENT_SLUG} » introuvable, rien n'est fait`] };

  for (const { slug, ...data } of SUB_CATEGORIES) {
    const existing = await db.category.findUnique({ where: { slug }, select: { id: true, images: true } });
    if (!existing) {
      lines.push(`catégorie créée : ${data.name} (sous « Accessoires », ${data.images.length} photos)`);
      if (apply) await db.category.create({ data: { ...data, slug, parentId: parent.id, isActive: true } });
    } else if (existing.images.length === 0) {
      lines.push(`photos ajoutées à ${data.name} : ${data.images.length}`);
      if (apply) await db.category.update({ where: { id: existing.id }, data: { images: data.images } });
    }
  }
  if (lines.length === 0) lines.push("rien à faire, tout est déjà en place");
  return { lines };
}
