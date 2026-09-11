"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { productSchema } from "@/validations/product.schema";
import { z } from "zod";

export type AdminActionResult = { success: true; id: string } | { success: false; error: string };

/** Text-area shorthand parsers — keep the admin product form simple
 *  (no dynamic field arrays) while still writing real, structured rows. */
function parseImageUrls(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((url, i) => ({ url, alt: "", position: i }));
}

function parseAttributes(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, valuesPart] = line.split(":");
      const values = (valuesPart ?? "").split(",").map((v) => v.trim()).filter(Boolean);
      return { name: (name ?? "").trim(), values: values.length > 0 ? values : ["-"] };
    })
    .filter((a) => a.name);
}

function parseVariants(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, sku, priceDelta, stock] = line.split("|").map((p) => p.trim());
      return {
        name: name ?? "",
        sku: sku ?? "",
        priceDelta: Number(priceDelta ?? 0) || 0,
        stock: Number(stock ?? 0) || 0,
        isActive: true,
      };
    })
    .filter((v) => v.name && v.sku);
}

const formSchema = z.object({
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  price: z.coerce.number(),
  compareAtPrice: z.coerce.number().optional().nullable(),
  taxRate: z.coerce.number().optional(),
  stock: z.coerce.number().optional(),
  lowStockThreshold: z.coerce.number().optional(),
  categoryId: z.string(),
  brandId: z.string(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  imagesText: z.string().optional(),
  attributesText: z.string().optional(),
  variantsText: z.string().optional(),
});
export type AdminProductFormInput = z.infer<typeof formSchema>;

export async function createProductAction(input: AdminProductFormInput): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const raw = formSchema.safeParse(input);
  if (!raw.success) return { success: false, error: "Formulaire invalide." };

  const parsed = productSchema.safeParse({
    ...raw.data,
    images: parseImageUrls(raw.data.imagesText ?? ""),
    attributes: parseAttributes(raw.data.attributesText ?? ""),
    variants: parseVariants(raw.data.variantsText ?? ""),
    videos: [],
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const data = parsed.data;

  const [slugTaken, skuTaken] = await Promise.all([
    db.product.findUnique({ where: { slug: data.slug } }),
    db.product.findUnique({ where: { sku: data.sku } }),
  ]);
  if (slugTaken) return { success: false, error: "Ce slug est déjà utilisé." };
  if (skuTaken) return { success: false, error: "Ce SKU est déjà utilisé." };

  const product = await db.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      description: data.description,
      shortDescription: data.shortDescription || null,
      price: data.price,
      compareAtPrice: data.compareAtPrice || null,
      taxRate: data.taxRate ?? 20,
      stock: data.stock ?? 0,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      categoryId: data.categoryId,
      brandId: data.brandId,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      isNew: data.isNew ?? false,
      isBestSeller: data.isBestSeller ?? false,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      images: { create: data.images },
      attributes: {
        create: data.attributes.map((a) => ({ name: a.name, values: { create: a.values.map((v) => ({ value: v })) } })),
      },
      variants: { create: data.variants },
    },
  });

  if (data.stock > 0) {
    await db.inventoryMovement.create({
      data: { productId: product.id, type: "IN", quantity: data.stock, reason: "Stock initial à la création du produit" },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/produits");
  return { success: true, id: product.id };
}

export async function updateProductAction(id: string, input: AdminProductFormInput): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Produit introuvable." };

  const raw = formSchema.safeParse(input);
  if (!raw.success) return { success: false, error: "Formulaire invalide." };

  const parsed = productSchema.safeParse({
    ...raw.data,
    images: parseImageUrls(raw.data.imagesText ?? ""),
    attributes: parseAttributes(raw.data.attributesText ?? ""),
    variants: parseVariants(raw.data.variantsText ?? ""),
    videos: [],
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const data = parsed.data;

  if (data.slug !== existing.slug) {
    const taken = await db.product.findUnique({ where: { slug: data.slug } });
    if (taken) return { success: false, error: "Ce slug est déjà utilisé." };
  }
  if (data.sku !== existing.sku) {
    const taken = await db.product.findUnique({ where: { sku: data.sku } });
    if (taken) return { success: false, error: "Ce SKU est déjà utilisé." };
  }

  const stockDelta = data.stock - existing.stock;

  await db.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productAttribute.deleteMany({ where: { productId: id } });
    await tx.productVariant.deleteMany({ where: { productId: id } });

    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        description: data.description,
        shortDescription: data.shortDescription || null,
        price: data.price,
        compareAtPrice: data.compareAtPrice || null,
        taxRate: data.taxRate ?? 20,
        stock: data.stock ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? 5,
        categoryId: data.categoryId,
        brandId: data.brandId,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        isNew: data.isNew ?? false,
        isBestSeller: data.isBestSeller ?? false,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        images: { create: data.images },
        attributes: {
          create: data.attributes.map((a) => ({ name: a.name, values: { create: a.values.map((v) => ({ value: v })) } })),
        },
        variants: { create: data.variants },
      },
    });

    if (stockDelta !== 0) {
      await tx.inventoryMovement.create({
        data: {
          productId: id,
          type: "ADJUSTMENT",
          quantity: Math.abs(stockDelta),
          reason: `Ajustement manuel via la fiche produit (${stockDelta > 0 ? "+" : ""}${stockDelta})`,
        },
      });
    }
  });

  revalidatePath("/admin/products");
  revalidatePath(`/produits/${data.slug}`);
  revalidatePath("/produits");
  return { success: true, id };
}

export async function toggleProductActiveAction(id: string, isActive: boolean): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN", "STAFF"]);
  await db.product.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/products");
  revalidatePath("/produits");
  return { success: true };
}

export async function deleteProductAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN"]);
  const usedInOrder = await db.orderItem.findFirst({ where: { productId: id } });
  if (usedInOrder) {
    return { success: false, error: "Ce produit a déjà été commandé et ne peut pas être supprimé — désactivez-le plutôt." };
  }
  await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/produits");
  return { success: true };
}
