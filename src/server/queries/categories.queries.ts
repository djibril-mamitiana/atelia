import "server-only";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";

// `name`/`description` are French (the source language for categories,
// same as Tutorial) — see the schema comment on Category. `locale` picks
// the matching nullable override column, falling back to French for "fr"
// or when a translation is missing.
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

const CATEGORY_TREE_SELECT = {
  id: true,
  name: true,
  nameDe: true,
  nameEn: true,
  nameIt: true,
  slug: true,
  imageUrl: true,
  parentId: true,
  _count: { select: { products: true } },
} as const;

export async function getCategoryTree() {
  const locale = (await getLocale()) as Locale;
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: CATEGORY_TREE_SELECT,
  });
  const localized = categories.map((cat) => ({ ...cat, name: localizedField(cat, "name", locale) }));

  const byParent = new Map<string | null, typeof localized>();
  for (const cat of localized) {
    const key = cat.parentId ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), cat]);
  }

  type Node = (typeof localized)[number] & { children: Node[] };
  function build(parentId: string | null): Node[] {
    return (byParent.get(parentId) ?? []).map((cat) => ({ ...cat, children: build(cat.id) }));
  }

  return build(null);
}

export async function getCategoryBySlug(slug: string) {
  const locale = (await getLocale()) as Locale;
  const category = await db.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: { where: { isActive: true }, orderBy: { order: "asc" } },
    },
  });
  if (!category) return null;

  return {
    ...category,
    name: localizedField(category, "name", locale),
    description: category.description != null ? localizedField(category, "description", locale) : category.description,
    parent: category.parent ? { ...category.parent, name: localizedField(category.parent, "name", locale) } : null,
    children: category.children.map((c) => ({ ...c, name: localizedField(c, "name", locale) })),
  };
}
