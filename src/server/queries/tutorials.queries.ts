import "server-only";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";

// `title`/`description`/`content` are French (the source language for
// tutorials) — see the schema comment on Tutorial. `locale` picks the
// matching nullable override column, falling back to French for "fr" or
// when a translation is missing.
type Locale = "fr" | "de" | "en" | "it";

function localizedField<T extends Record<string, unknown>>(
  p: T,
  base: string,
  locale: Locale
): string {
  if (locale === "fr") return p[base] as string;
  const override = p[`${base}${locale[0].toUpperCase()}${locale.slice(1)}`] as string | null | undefined;
  return override ?? (p[base] as string);
}

// Tags are a small closed set of French words (see seed.ts) stored
// directly as strings, not localized rows — translated here at display
// time instead of adding yet another column.
const TAG_TRANSLATIONS: Record<string, Record<Exclude<Locale, "fr">, string>> = {
  bricolage: { de: "Heimwerken", en: "DIY", it: "Fai da te" },
  diy: { de: "DIY", en: "DIY", it: "Fai da te" },
  guide: { de: "Anleitung", en: "Guide", it: "Guida" },
  débutant: { de: "Anfänger", en: "Beginner", it: "Principiante" },
  extérieur: { de: "Außen", en: "Outdoor", it: "Esterno" },
  intérieur: { de: "Innen", en: "Indoor", it: "Interno" },
  sécurité: { de: "Sicherheit", en: "Safety", it: "Sicurezza" },
};

function localizedTag(tag: string, locale: Locale): string {
  if (locale === "fr") return tag;
  return TAG_TRANSLATIONS[tag]?.[locale] ?? tag;
}

const TUTORIAL_LIST_SELECT = {
  id: true,
  title: true,
  titleDe: true,
  titleEn: true,
  titleIt: true,
  slug: true,
  description: true,
  descriptionDe: true,
  descriptionEn: true,
  descriptionIt: true,
  thumbnailUrl: true,
  durationMinutes: true,
  level: true,
  tags: true,
} as const;

export async function getPublishedTutorials(limit?: number) {
  const locale = (await getLocale()) as Locale;
  const tutorials = await db.tutorial.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: TUTORIAL_LIST_SELECT,
  });
  return tutorials.map((t) => ({
    ...t,
    title: localizedField(t, "title", locale),
    description: localizedField(t, "description", locale),
  }));
}

const TUTORIAL_PRODUCT_SELECT = {
  id: true,
  name: true,
  nameFr: true,
  nameEn: true,
  nameIt: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  images: { take: 1, orderBy: { position: "asc" as const } },
  brand: { select: { name: true } },
} as const;

export async function getTutorialBySlug(slug: string) {
  const locale = (await getLocale()) as Locale;
  const tutorial = await db.tutorial.findUnique({
    where: { slug },
    include: {
      category: true,
      products: {
        orderBy: { position: "asc" },
        include: { product: { select: TUTORIAL_PRODUCT_SELECT } },
      },
    },
  });
  if (!tutorial) return null;

  // Products model uses "de" as its source language (see catalog.queries.ts)
  // — different from Tutorial's "fr" — so the same helper needs the product
  // locale semantics here, not the tutorial's.
  const productLocale = locale;
  return {
    ...tutorial,
    title: localizedField(tutorial, "title", locale),
    description: localizedField(tutorial, "description", locale),
    content: localizedField(tutorial, "content", locale),
    tags: tutorial.tags.map((tag) => localizedTag(tag, locale)),
    products: tutorial.products.map((tp) => ({
      ...tp,
      product: {
        ...tp.product,
        name: productLocale === "de" ? tp.product.name : (tp.product[`name${productLocale[0].toUpperCase()}${productLocale.slice(1)}` as "nameFr" | "nameEn" | "nameIt"] ?? tp.product.name),
        price: Number(tp.product.price),
        compareAtPrice: tp.product.compareAtPrice != null ? Number(tp.product.compareAtPrice) : null,
      },
    })),
  };
}

export async function getTutorialsForProduct(productId: string) {
  return db.tutorialProduct.findMany({
    where: { productId },
    include: { tutorial: true },
    orderBy: { position: "asc" },
  });
}
