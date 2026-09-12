import "server-only";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { PAGE_SIZE_CATALOG } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export type SortOption = "pertinence" | "prix-asc" | "prix-desc" | "nouveaute" | "note";

export type CatalogFilters = {
  q?: string;
  categorySlug?: string;
  brandSlugs?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: SortOption;
  page?: number;
};

// `name`/`description`/`shortDescription` are the source-catalogue language
// (German) — see the schema comment on Product. `locale` picks the matching
// nullable override column, falling back to German when it's not set
// (~7% of rows, the lowConfidence extractions) or when the locale is "de".
type Locale = "fr" | "de" | "en" | "it";

function localizedField<T extends Record<string, unknown>>(
  p: T,
  base: string,
  locale: Locale
): string {
  if (locale === "de") return p[base] as string;
  const override = p[`${base}${locale[0].toUpperCase()}${locale.slice(1)}`] as string | null | undefined;
  return override ?? (p[base] as string);
}

// Category and Tutorial use French as their source language (unlike
// Product's German) — see the schema comments on those models.
function localizedFrBasedField<T extends Record<string, unknown>>(
  p: T,
  base: string,
  locale: Locale
): string {
  if (locale === "fr") return p[base] as string;
  const override = p[`${base}${locale[0].toUpperCase()}${locale.slice(1)}`] as string | null | undefined;
  return override ?? (p[base] as string);
}

const CATEGORY_FILTER_SELECT = {
  id: true,
  name: true,
  nameDe: true,
  nameEn: true,
  nameIt: true,
  slug: true,
  _count: { select: { products: true } },
} as const;

function localizeCategory<T extends { name: string }>(c: T, locale: Locale) {
  return { ...c, name: localizedFrBasedField(c, "name", locale) };
}

function buildWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { nameFr: { contains: filters.q, mode: "insensitive" } },
      { nameEn: { contains: filters.q, mode: "insensitive" } },
      { nameIt: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { sku: { contains: filters.q, mode: "insensitive" } },
      { brand: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }
  if (filters.brandSlugs && filters.brandSlugs.length > 0) {
    where.brand = { slug: { in: filters.brandSlugs } };
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }
  if (filters.inStockOnly) {
    where.stock = { gt: 0 };
  }
  if (filters.onSaleOnly) {
    where.compareAtPrice = { not: null };
  }
  return where;
}

function buildOrderBy(sort?: SortOption): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "prix-asc":
      return { price: "asc" };
    case "prix-desc":
      return { price: "desc" };
    case "nouveaute":
      return { createdAt: "desc" };
    case "note":
      return { avgRating: "desc" };
    default:
      return { isBestSeller: "desc" };
  }
}

const PRODUCT_CARD_SELECT = {
  id: true,
  name: true,
  nameFr: true,
  nameEn: true,
  nameIt: true,
  slug: true,
  sku: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  isNew: true,
  isBestSeller: true,
  avgRating: true,
  reviewCount: true,
  brand: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { position: "asc" as const }, take: 1 },
} as const;

type RawProductCard = Prisma.ProductGetPayload<{ select: typeof PRODUCT_CARD_SELECT }>;

// Server Components may pass this straight into a "use client" component
// (ProductCard) — React's Flight serialization can't cross that boundary
// with Prisma's Decimal instances, so every product-card query converts
// them to plain numbers before returning. Also resolves the localized name
// and drops the raw nameFr/nameEn/nameIt columns from the payload.
function serializeProductCard(p: RawProductCard, locale: Locale) {
  const { nameFr, nameEn, nameIt, ...rest } = p;
  void nameFr;
  void nameEn;
  void nameIt;
  return {
    ...rest,
    name: localizedField(p, "name", locale),
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    avgRating: Number(p.avgRating),
  };
}

export async function getCatalogPage(filters: CatalogFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildWhere(filters);
  const locale = (await getLocale()) as Locale;

  const [products, total, categories, brands, priceBounds] = await Promise.all([
    db.product.findMany({
      where,
      select: PRODUCT_CARD_SELECT,
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * PAGE_SIZE_CATALOG,
      take: PAGE_SIZE_CATALOG,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { isActive: true },
      select: CATEGORY_FILTER_SELECT,
      orderBy: { order: "asc" },
    }),
    db.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    db.product.aggregate({ where: { isActive: true }, _min: { price: true }, _max: { price: true } }),
  ]);

  return {
    products: products.map((p) => serializeProductCard(p, locale)),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE_CATALOG)),
    categories: categories.map((c) => localizeCategory(c, locale)),
    brands,
    priceBounds: {
      min: priceBounds._min.price ? Number(priceBounds._min.price) : 0,
      max: priceBounds._max.price ? Number(priceBounds._max.price) : 1000,
    },
  };
}

export async function getProductBySlug(slug: string) {
  const locale = (await getLocale()) as Locale;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: { include: { parent: true } },
      images: { orderBy: { position: "asc" } },
      videos: { orderBy: { position: "asc" } },
      variants: { where: { isActive: true } },
      attributes: { include: { values: true } },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      tutorials: {
        include: {
          tutorial: {
            select: { id: true, title: true, titleDe: true, titleEn: true, titleIt: true, slug: true, thumbnailUrl: true, durationMinutes: true },
          },
        },
      },
      complementaryTo: {
        where: { kind: "COMPLEMENTARY" },
        orderBy: { position: "asc" },
        include: { relatedProduct: { select: PRODUCT_CARD_SELECT } },
      },
      relatedFrom: {
        where: { kind: "SIMILAR" },
        orderBy: { position: "asc" },
        include: { baseProduct: { select: PRODUCT_CARD_SELECT } },
      },
    },
  });
  if (!product) return null;

  return {
    ...product,
    name: localizedField(product, "name", locale),
    description: localizedField(product, "description", locale),
    shortDescription: product.shortDescription != null ? localizedField(product, "shortDescription", locale) : product.shortDescription,
    category: {
      ...product.category,
      name: localizedFrBasedField(product.category, "name", locale),
      parent: product.category.parent ? localizeCategory(product.category.parent, locale) : product.category.parent,
    },
    // Tutorial's source language is French (unlike Product's German), so
    // "fr" is its own fallback here rather than "de".
    tutorials: product.tutorials.map((tp) => ({
      ...tp,
      tutorial: {
        ...tp.tutorial,
        title:
          locale === "fr"
            ? tp.tutorial.title
            : (tp.tutorial[`title${locale[0].toUpperCase()}${locale.slice(1)}` as "titleDe" | "titleEn" | "titleIt"] ?? tp.tutorial.title),
      },
    })),
    complementaryTo: product.complementaryTo.map((rel) => ({ ...rel, relatedProduct: serializeProductCard(rel.relatedProduct, locale) })),
    relatedFrom: product.relatedFrom.map((rel) => ({ ...rel, baseProduct: serializeProductCard(rel.baseProduct, locale) })),
  };
}

export async function getFeaturedProducts(limit = 8) {
  const locale = (await getLocale()) as Locale;
  const products = await db.product.findMany({
    where: { isActive: true, isFeatured: true },
    select: PRODUCT_CARD_SELECT,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => serializeProductCard(p, locale));
}

export async function getBestSellers(limit = 8) {
  const locale = (await getLocale()) as Locale;
  const products = await db.product.findMany({
    where: { isActive: true, isBestSeller: true },
    select: PRODUCT_CARD_SELECT,
    take: limit,
    orderBy: { reviewCount: "desc" },
  });
  return products.map((p) => serializeProductCard(p, locale));
}

export async function getNewProducts(limit = 8) {
  const locale = (await getLocale()) as Locale;
  const products = await db.product.findMany({
    where: { isActive: true, isNew: true },
    select: PRODUCT_CARD_SELECT,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => serializeProductCard(p, locale));
}

export async function getPromotedProducts(limit = 8) {
  const locale = (await getLocale()) as Locale;
  const products = await db.product.findMany({
    where: { isActive: true, compareAtPrice: { not: null } },
    select: PRODUCT_CARD_SELECT,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => serializeProductCard(p, locale));
}

export async function getPopularCategories(limit = 8) {
  const locale = (await getLocale()) as Locale;
  const categories = await db.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, nameDe: true, nameEn: true, nameIt: true, slug: true, imageUrl: true, _count: { select: { products: true } } },
    orderBy: { order: "asc" },
    take: limit,
  });
  return categories.map((c) => localizeCategory(c, locale));
}

export async function getActiveBrands(limit = 12) {
  return db.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, logoUrl: true },
    orderBy: { name: "asc" },
    take: limit,
  });
}

export type ProductCard = Awaited<ReturnType<typeof getCatalogPage>>["products"][number];

/** "Vous pourriez également avoir besoin de…" — complementary products for
 *  whatever is currently in the cart, excluding items already there. */
export async function getCartRecommendations(productIds: string[], limit = 4) {
  if (productIds.length === 0) return [];
  const locale = (await getLocale()) as Locale;
  const relations = await db.productRelation.findMany({
    where: { baseProductId: { in: productIds }, kind: "COMPLEMENTARY", relatedProductId: { notIn: productIds } },
    select: { relatedProduct: { select: PRODUCT_CARD_SELECT } },
    take: limit * 2,
  });
  const seen = new Set<string>();
  const results: ProductCard[] = [];
  for (const r of relations) {
    if (seen.has(r.relatedProduct.id)) continue;
    seen.add(r.relatedProduct.id);
    results.push(serializeProductCard(r.relatedProduct, locale));
    if (results.length >= limit) break;
  }
  return results;
}

export async function getFavoriteProducts(userId: string) {
  const locale = (await getLocale()) as Locale;
  const favorites = await db.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { productId: true, product: { select: PRODUCT_CARD_SELECT } },
  });
  return favorites.map((f) => serializeProductCard(f.product, locale));
}

/** Global search across products, categories, brands and tutorials — powers the header search. */
export async function searchAll(q: string) {
  if (!q || q.trim().length < 2) {
    return { products: [], categories: [], brands: [], tutorials: [] };
  }
  const query = q.trim();
  const locale = (await getLocale()) as Locale;

  const [products, categories, brands, tutorials] = await Promise.all([
    db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nameFr: { contains: query, mode: "insensitive" } },
          { nameEn: { contains: query, mode: "insensitive" } },
          { nameIt: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
        ],
      },
      select: PRODUCT_CARD_SELECT,
      take: 6,
    }),
    db.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nameDe: { contains: query, mode: "insensitive" } },
          { nameEn: { contains: query, mode: "insensitive" } },
          { nameIt: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, nameDe: true, nameEn: true, nameIt: true, slug: true },
      take: 4,
    }),
    db.brand.findMany({
      where: { isActive: true, name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 4,
    }),
    db.tutorial.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { titleDe: { contains: query, mode: "insensitive" } },
          { titleEn: { contains: query, mode: "insensitive" } },
          { titleIt: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, titleDe: true, titleEn: true, titleIt: true, slug: true, thumbnailUrl: true },
      take: 4,
    }),
  ]);

  return {
    products: products.map((p) => serializeProductCard(p, locale)),
    categories: categories.map((c) => localizeCategory(c, locale)),
    brands,
    tutorials: tutorials.map((t) => ({ ...t, title: localizedFrBasedField(t, "title", locale) })),
  };
}
