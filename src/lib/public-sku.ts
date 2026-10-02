/**
 * Customer-facing reference, distinct from the supplier's own SKU (which
 * must stay hidden from customers — see Product.publicSku comment in
 * schema.prisma). Deterministic from the catalog's file order, so it's
 * stable across reseeds and reusable by one-off backfill scripts.
 */
export function computePublicSkus(items: { sku: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  items.forEach((item, i) => {
    map.set(item.sku, `CTP-${String(i + 1).padStart(5, "0")}`);
  });
  return map;
}
