import "server-only";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { PAGE_SIZE_CATALOG } from "@/lib/constants";
import { stripSizeSuffix } from "@/lib/product-grouping";
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
  groupKey: true,
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

// Stats for a size group (several Product rows shown as one card).
type GroupStats = { size: number; fromPrice: number; inStock: boolean; localizedName?: string };

// Server Components may pass this straight into a "use client" component
// (ProductCard) — React's Flight serialization can't cross that boundary
// with Prisma's Decimal instances, so every product-card query converts
// them to plain numbers before returning. Also resolves the localized name
// and drops the raw nameFr/nameEn/nameIt columns from the payload.
//
// When `group` describes a real size group (size > 1) the card represents
// the whole group: name without the size suffix, "from" price, and no
// per-size promo price.
function serializeProductCard(p: RawProductCard, locale: Locale, group?: GroupStats) {
  const { nameFr, nameEn, nameIt, ...rest } = p;
  void nameFr;
  void nameEn;
  void nameIt;
  const grouped = group != null && group.size > 1;
  const localizedName = grouped && group.localizedName ? group.localizedName : localizedField(p, "name", locale);
  return {
    ...rest,
    name: grouped ? stripSizeSuffix(localizedName) : localizedName,
    price: Number(p.price),
    compareAtPrice: grouped ? null : p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    stock: grouped ? (group.inStock ? Math.max(p.stock, 1) : 0) : p.stock,
    avgRating: Number(p.avgRating),
    groupSize: grouped ? group.size : 1,
    fromPrice: grouped ? group.fromPrice : null,
  };
}

// A size added by hand in the admin has no translated name, but its siblings
// do — so a family is titled with the first translated name found in it,
// instead of flipping to German depending on which size happens to lead.
async function loadFamilyNames(keys: string[], locale: Locale): Promise<Map<string, string>> {
  if (locale === "de" || keys.length === 0) return new Map();
  const has = locale === "fr" ? { nameFr: { not: null } } : locale === "en" ? { nameEn: { not: null } } : { nameIt: { not: null } };
  const rows = await db.product.findMany({
    where: { groupKey: { in: keys }, ...has },
    distinct: ["groupKey"],
    select: { groupKey: true, name: true, nameFr: true, nameEn: true, nameIt: true },
  });
  return new Map(rows.map((r) => [r.groupKey as string, localizedField(r, "name", locale)]));
}

async function loadGroupStats(groupKeys: (string | null)[], locale: Locale): Promise<Map<string, GroupStats>> {
  const keys = [...new Set(groupKeys.filter((k): k is string => !!k))];
  if (keys.length === 0) return new Map();
  const [rows, names] = await Promise.all([
    db.product.groupBy({
      by: ["groupKey"],
      where: { groupKey: { in: keys }, isActive: true },
      _count: { _all: true },
      _min: { price: true },
      _sum: { stock: true },
    }),
    loadFamilyNames(keys, locale),
  ]);
  return new Map(
    rows.map((r) => [
      r.groupKey as string,
      {
        size: r._count._all,
        fromPrice: Number(r._min.price ?? 0),
        inStock: (r._sum.stock ?? 0) > 0,
        localizedName: names.get(r.groupKey as string),
      },
    ])
  );
}

/** One row per size group (first occurrence wins, so the best-ranked size that
 *  matched the filters represents its group); ungrouped rows are kept as-is. */
function dedupeByGroup<T extends { id: string; groupKey: string | null }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = r.groupKey ?? r.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function toGroupedCards(rows: RawProductCard[], locale: Locale) {
  const stats = await loadGroupStats(rows.map((r) => r.groupKey), locale);
  return rows.map((r) => serializeProductCard(r, locale, r.groupKey ? stats.get(r.groupKey) : undefined));
}

/** Home-page style shelf: newest/best/… rows, one card per size group. */
async function pickGroupedCards(
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput,
  limit: number,
  locale: Locale
) {
  const rows = await db.product.findMany({ where, select: PRODUCT_CARD_SELECT, orderBy, take: limit * 4 });
  return toGroupedCards(dedupeByGroup(rows).slice(0, limit), locale);
}

/** Number of listing entries (size groups count once) per category id. */
async function countListingEntriesByCategory(): Promise<Map<string, number>> {
  const rows = await db.product.findMany({ where: { isActive: true }, select: { categoryId: true, groupKey: true } });
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.groupKey) {
      if (seen.has(r.groupKey)) continue;
      seen.add(r.groupKey);
    }
    counts.set(r.categoryId, (counts.get(r.categoryId) ?? 0) + 1);
  }
  return counts;
}

export async function getCatalogPage(filters: CatalogFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildWhere(filters);
  const locale = (await getLocale()) as Locale;

  const [ranked, categories, brands, priceBounds, categoryCounts] = await Promise.all([
    // Lightweight ranking pass over every matching row; sizes of one product
    // are folded into a single entry below, then only the current page is
    // loaded in full.
    db.product.findMany({
      where,
      select: { id: true, groupKey: true },
      orderBy: [buildOrderBy(filters.sort), { id: "asc" }],
    }),
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
    countListingEntriesByCategory(),
  ]);

  const entryIds = dedupeByGroup(ranked).map((r) => r.id);
  const total = entryIds.length;
  const pageIds = entryIds.slice((page - 1) * PAGE_SIZE_CATALOG, page * PAGE_SIZE_CATALOG);
  const rows = pageIds.length
    ? await db.product.findMany({ where: { id: { in: pageIds } }, select: PRODUCT_CARD_SELECT })
    : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = pageIds.map((id) => byId.get(id)).filter((r): r is RawProductCard => r != null);

  return {
    products: await toGroupedCards(ordered, locale),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE_CATALOG)),
    // Empty categories (e.g. the "Outils diamant" root, which only groups its
    // children) would show up as a useless "(0)" filter entry.
    categories: categories
      .map((c) => ({ ...localizeCategory(c, locale), _count: { products: categoryCounts.get(c.id) ?? 0 } }))
      .filter((c) => c._count.products > 0),
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

  // Sizes of the same product (same groupKey), ordered small → large. A
  // group with a single active member behaves like a standalone product.
  const siblings = product.groupKey
    ? await db.product.findMany({
        where: { groupKey: product.groupKey, isActive: true },
        orderBy: [{ sizeOrder: "asc" }, { sku: "asc" }],
        select: {
          id: true,
          slug: true,
          sku: true,
          sizeLabel: true,
          sizeSpecs: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          avgRating: true,
          reviewCount: true,
        },
      })
    : [];
  const sizes = siblings.length > 1
    ? siblings.map((s) => ({
        id: s.id,
        slug: s.slug,
        sku: s.sku,
        sizeLabel: s.sizeLabel ?? s.sku,
        specs: s.sizeSpecs,
        price: Number(s.price),
        compareAtPrice: s.compareAtPrice != null ? Number(s.compareAtPrice) : null,
        stock: s.stock,
      }))
    : [];

  // Reviews and rating belong to the product as a whole, not to one size.
  let reviews = product.reviews;
  let reviewCount = product.reviewCount;
  let avgRating = Number(product.avgRating);
  if (sizes.length > 0) {
    reviews = await db.review.findMany({
      where: { status: "APPROVED", product: { groupKey: product.groupKey } },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    reviewCount = siblings.reduce((sum, s) => sum + s.reviewCount, 0);
    avgRating =
      reviewCount > 0
        ? siblings.reduce((sum, s) => sum + Number(s.avgRating) * s.reviewCount, 0) / reviewCount
        : avgRating;
  }

  // Same idea for the product page: if this size has no translation, borrow
  // the name/description of a sibling that does.
  const donor =
    sizes.length > 0 && locale !== "de" && localizedField(product, "name", locale) === product.name
      ? await db.product.findFirst({
          where: {
            groupKey: product.groupKey,
            ...(locale === "fr" ? { nameFr: { not: null } } : locale === "en" ? { nameEn: { not: null } } : { nameIt: { not: null } }),
          },
          select: {
            name: true, nameFr: true, nameEn: true, nameIt: true,
            description: true, descriptionFr: true, descriptionEn: true, descriptionIt: true,
            shortDescription: true, shortDescriptionFr: true, shortDescriptionEn: true, shortDescriptionIt: true,
          },
        })
      : null;
  const source = donor ?? product;
  const localizedName = localizedField(source, "name", locale);

  return {
    ...product,
    sizes,
    reviews,
    reviewCount,
    avgRating,
    name: sizes.length > 0 ? stripSizeSuffix(localizedName) : localizedName,
    // The per-size "Caractéristiques : …" line describes only one size — for a
    // size group those figures live in the size table instead.
    description:
      sizes.length > 0
        ? localizedField(product, "description", locale)
            .split("\n")
            .filter((line) => !/^(Caractéristiques|Features|Caratteristiche)\s*:/i.test(line))
            .join("\n")
        : localizedField(product, "description", locale),
    shortDescription: source.shortDescription != null ? localizedField(source, "shortDescription", locale) : source.shortDescription,
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
  return pickGroupedCards({ isActive: true, isFeatured: true }, { createdAt: "desc" }, limit, locale);
}

export async function getBestSellers(limit = 8) {
  const locale = (await getLocale()) as Locale;
  return pickGroupedCards({ isActive: true, isBestSeller: true }, { reviewCount: "desc" }, limit, locale);
}

export async function getNewProducts(limit = 8) {
  const locale = (await getLocale()) as Locale;
  return pickGroupedCards({ isActive: true, isNew: true }, { createdAt: "desc" }, limit, locale);
}

export async function getPromotedProducts(limit = 8) {
  const locale = (await getLocale()) as Locale;
  return pickGroupedCards({ isActive: true, compareAtPrice: { not: null } }, { createdAt: "desc" }, limit, locale);
}

export async function getPopularCategories(limit = 8) {
  const locale = (await getLocale()) as Locale;
  const categories = await db.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, nameDe: true, nameEn: true, nameIt: true, slug: true, imageUrl: true, _count: { select: { products: true } } },
    orderBy: { order: "asc" },
    take: limit,
  });
  const counts = await countListingEntriesByCategory();
  return categories.map((c) => ({ ...localizeCategory(c, locale), _count: { products: counts.get(c.id) ?? 0 } }));
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
      take: 30,
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
    products: await toGroupedCards(dedupeByGroup(products).slice(0, 6), locale),
    categories: categories.map((c) => localizeCategory(c, locale)),
    brands,
    tutorials: tutorials.map((t) => ({ ...t, title: localizedFrBasedField(t, "title", locale) })),
  };
}
