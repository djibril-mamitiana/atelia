import "server-only";
import { randomUUID } from "node:crypto";
import slugify from "slugify";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { nameWithSize, parseSizeOrder, stripSizeSuffix } from "@/lib/product-grouping";

/**
 * Admin view of a product = one entry with N sizes. Storage stays one Product
 * row per size (that is what carts, orders, stock, reviews and favourites
 * reference); rows of the same product share a `groupKey`. This service is the
 * only place that knows that: it loads a whole family, writes the shared
 * fields to every row, and creates/updates/removes size rows to match what the
 * admin form submitted.
 */

/** Per-size fields (each becomes its own Product row). */
export type SizeInput = {
  id?: string;
  sku: string;
  sizeLabel: string;
  sizeSpecs: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};

/** Fields shared by every size of the product. */
export type SharedInput = {
  slug: string;
  name: string;
  nameFr: string | null;
  nameEn: string | null;
  nameIt: string | null;
  description: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  descriptionIt: string | null;
  shortDescription: string | null;
  shortDescriptionFr: string | null;
  shortDescriptionEn: string | null;
  shortDescriptionIt: string | null;
  taxRate: number;
  categoryId: string;
  brandId: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  images: { url: string; alt: string; position: number }[];
  attributes: { name: string; values: string[] }[];
  variants: { name: string; sku: string; priceDelta: number; stock: number; isActive: boolean }[];
};

export type SaveResult = { success: true; id: string } | { success: false; error: string };

/** Every Product row of the product `id` belongs to, small → large. */
export async function loadFamilyRows(id: string) {
  const product = await db.product.findUnique({ where: { id }, select: { id: true, groupKey: true } });
  if (!product) return [];
  return db.product.findMany({
    where: product.groupKey ? { groupKey: product.groupKey } : { id },
    orderBy: [{ sizeOrder: "asc" }, { sku: "asc" }],
    include: { images: { orderBy: { position: "asc" } }, attributes: { include: { values: true } }, variants: true },
  });
}

async function orderedProductIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await db.orderItem.groupBy({ by: ["productId"], where: { productId: { in: ids } } });
  return new Set(rows.map((r) => r.productId));
}

async function uniqueSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const root = slugify(base, { lower: true, strict: true, locale: "fr" }) || "produit";
  const taken = new Set((await tx.product.findMany({ where: { slug: { startsWith: root } }, select: { slug: true } })).map((r) => r.slug));
  let slug = root;
  let i = 2;
  while (taken.has(slug)) slug = `${root}-${i++}`;
  return slug;
}

export async function saveProduct(shared: SharedInput, sizes: SizeInput[], familyOf?: string): Promise<SaveResult> {
  if (sizes.length === 0) return { success: false, error: "Ajoutez au moins une taille (ou une référence)." };

  const multi = sizes.length > 1;
  if (multi && sizes.some((s) => !s.sizeLabel.trim())) {
    return { success: false, error: "Indiquez la taille de chaque ligne (ex. Ø125 mm)." };
  }
  const skus = sizes.map((s) => s.sku.trim());
  if (skus.some((s) => !s)) return { success: false, error: "Chaque ligne doit avoir un SKU." };
  if (new Set(skus.map((s) => s.toLowerCase())).size !== skus.length) {
    return { success: false, error: "Deux tailles ont le même SKU." };
  }
  if (sizes.some((s) => !(s.price > 0))) return { success: false, error: "Le prix de chaque taille doit être positif." };
  if (sizes.some((s) => s.compareAtPrice != null && s.compareAtPrice <= s.price)) {
    return { success: false, error: "L'ancien prix doit être supérieur au prix actuel." };
  }

  const existing = familyOf ? await loadFamilyRows(familyOf) : [];
  const existingById = new Map(existing.map((e) => [e.id, e]));
  if (sizes.some((s) => s.id && !existingById.has(s.id))) return { success: false, error: "Une des tailles n'existe plus — rechargez la page." };

  // SKUs are unique across the whole catalogue.
  const keepIds = sizes.flatMap((s) => (s.id ? [s.id] : []));
  const clashes = await db.product.findMany({
    where: { sku: { in: skus }, id: { notIn: keepIds } },
    select: { sku: true },
  });
  if (clashes.length > 0) return { success: false, error: `Le SKU « ${clashes[0].sku} » est déjà utilisé.` };

  // Sizes removed from the form are deleted — unless they were ordered.
  const removed = existing.filter((e) => !keepIds.includes(e.id));
  const ordered = await orderedProductIds(removed.map((r) => r.id));
  const blocked = removed.find((r) => ordered.has(r.id));
  if (blocked) {
    return {
      success: false,
      error: `La taille « ${blocked.sizeLabel ?? blocked.sku} » a déjà été commandée et ne peut pas être supprimée — décochez « Actif » à la place.`,
    };
  }

  const leadId = familyOf && existingById.has(familyOf) ? familyOf : sizes.find((s) => s.id)?.id;
  // The form's slug belongs to the size that was opened (or the first one when creating).
  const wantedSlug = shared.slug.trim();
  const slugClash = await db.product.findFirst({
    where: { slug: wantedSlug, ...(leadId ? { id: { not: leadId } } : {}) },
    select: { id: true },
  });
  if (slugClash) return { success: false, error: "Ce slug est déjà utilisé." };

  const groupKey = multi ? (existing.find((e) => e.groupKey)?.groupKey ?? `manual:${randomUUID()}`) : null;
  const baseName = (n: string | null) => (n ? stripSizeSuffix(n) : n);

  try {
    const firstId = await db.$transaction(async (tx) => {
      if (removed.length > 0) await tx.product.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } });

      const ids: string[] = [];
      for (const [index, size] of sizes.entries()) {
        const label = size.sizeLabel.trim() || null;
        const current = size.id ? existingById.get(size.id) : undefined;
        const withSize = (n: string | null) => (n && label && multi ? nameWithSize(baseName(n) as string, label) : n);

        const slug = current
          ? current.id === leadId
            ? wantedSlug
            : current.slug
          : !leadId && index === 0
            ? wantedSlug
            : await uniqueSlug(tx, `${wantedSlug}-${label ?? size.sku}`);

        const data: Prisma.ProductUncheckedUpdateInput = {
          name: withSize(shared.name) as string,
          nameFr: withSize(shared.nameFr),
          nameEn: withSize(shared.nameEn),
          nameIt: withSize(shared.nameIt),
          description: shared.description,
          descriptionFr: shared.descriptionFr,
          descriptionEn: shared.descriptionEn,
          descriptionIt: shared.descriptionIt,
          shortDescription: shared.shortDescription,
          shortDescriptionFr: shared.shortDescriptionFr,
          shortDescriptionEn: shared.shortDescriptionEn,
          shortDescriptionIt: shared.shortDescriptionIt,
          taxRate: shared.taxRate,
          categoryId: shared.categoryId,
          brandId: shared.brandId,
          isFeatured: shared.isFeatured,
          isNew: shared.isNew,
          isBestSeller: shared.isBestSeller,
          seoTitle: shared.seoTitle,
          seoDescription: shared.seoDescription,
          slug,
          sku: size.sku.trim(),
          price: size.price,
          compareAtPrice: size.compareAtPrice,
          stock: size.stock,
          lowStockThreshold: size.lowStockThreshold,
          isActive: size.isActive,
          groupKey,
          sizeLabel: multi ? label : null,
          sizeOrder: multi && label ? (parseSizeOrder(label) ?? index) : null,
          sizeSpecs: multi ? size.sizeSpecs.trim() || null : null,
        };

        let id: string;
        if (current) {
          await tx.productImage.deleteMany({ where: { productId: current.id } });
          await tx.productAttribute.deleteMany({ where: { productId: current.id } });
          if (!multi) await tx.productVariant.deleteMany({ where: { productId: current.id } });
          await tx.product.update({ where: { id: current.id }, data });
          id = current.id;
          const delta = size.stock - current.stock;
          if (delta !== 0) {
            await tx.inventoryMovement.create({
              data: {
                productId: id,
                type: "ADJUSTMENT",
                quantity: Math.abs(delta),
                reason: `Ajustement manuel via la fiche produit (${delta > 0 ? "+" : ""}${delta})`,
              },
            });
          }
        } else {
          const created = await tx.product.create({
            data: data as Prisma.ProductUncheckedCreateInput,
            select: { id: true },
          });
          id = created.id;
          if (size.stock > 0) {
            await tx.inventoryMovement.create({
              data: { productId: id, type: "IN", quantity: size.stock, reason: "Stock initial à la création du produit" },
            });
          }
        }

        if (shared.images.length > 0) await tx.productImage.createMany({ data: shared.images.map((i) => ({ ...i, productId: id })) });
        for (const attr of shared.attributes) {
          await tx.productAttribute.create({
            data: { productId: id, name: attr.name, values: { create: attr.values.map((v) => ({ value: v })) } },
          });
        }
        if (!multi && shared.variants.length > 0) {
          await tx.productVariant.createMany({ data: shared.variants.map((v) => ({ ...v, productId: id })) });
        }
        ids.push(id);
      }
      return leadId && ids.includes(leadId) ? leadId : ids[0];
    });
    return { success: true, id: firstId };
  } catch (err) {
    console.error("saveProduct failed", err);
    return { success: false, error: "Enregistrement impossible — vérifiez les SKU et le slug." };
  }
}

/** Deletes every size of the product — refused if any of them was ever ordered. */
export async function deleteProduct(id: string): Promise<{ success: true } | { success: false; error: string }> {
  const rows = await loadFamilyRows(id);
  if (rows.length === 0) return { success: true };
  const ordered = await orderedProductIds(rows.map((r) => r.id));
  if (ordered.size > 0) {
    return { success: false, error: "Ce produit a déjà été commandé et ne peut pas être supprimé — désactivez-le plutôt." };
  }
  await db.product.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  return { success: true };
}

/** Shows or hides every size of the product at once. */
export async function setProductActive(id: string, isActive: boolean) {
  const rows = await loadFamilyRows(id);
  await db.product.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { isActive } });
}
