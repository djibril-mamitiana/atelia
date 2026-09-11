import "server-only";
import { db } from "@/lib/db";

export async function getCategoryTree() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      parentId: true,
      _count: { select: { products: true } },
    },
  });

  const byParent = new Map<string | null, typeof categories>();
  for (const cat of categories) {
    const key = cat.parentId ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), cat]);
  }

  type Node = (typeof categories)[number] & { children: Node[] };
  function build(parentId: string | null): Node[] {
    return (byParent.get(parentId) ?? []).map((cat) => ({ ...cat, children: build(cat.id) }));
  }

  return build(null);
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: { where: { isActive: true }, orderBy: { order: "asc" } },
    },
  });
}
