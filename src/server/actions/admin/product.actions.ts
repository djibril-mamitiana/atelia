"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { productSchema } from "@/validations/product.schema";
import { deleteProduct, saveProduct, setProductActive, type SaveResult } from "@/server/services/admin-product";

export type AdminActionResult = SaveResult;

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

const sizeSchema = z.object({
  id: z.string().optional(),
  sku: z.string(),
  sizeLabel: z.string(),
  sizeSpecs: z.string(),
  price: z.coerce.number(),
  compareAtPrice: z.coerce.number().nullable().optional(),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

const formSchema = z.object({
  slug: z.string(),
  // Source language (German) texts …
  name: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  // … and the fr/en/it overrides the storefront prefers when filled.
  nameFr: z.string().optional(),
  nameEn: z.string().optional(),
  nameIt: z.string().optional(),
  descriptionFr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionIt: z.string().optional(),
  shortDescriptionFr: z.string().optional(),
  shortDescriptionEn: z.string().optional(),
  shortDescriptionIt: z.string().optional(),
  taxRate: z.coerce.number(),
  categoryId: z.string(),
  brandId: z.string(),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  isBestSeller: z.boolean(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  imagesText: z.string().optional(),
  attributesText: z.string().optional(),
  variantsText: z.string().optional(),
  sizes: z.array(sizeSchema).min(1),
});
export type AdminProductFormInput = z.infer<typeof formSchema>;
export type AdminSizeInput = z.infer<typeof sizeSchema>;

/** First non-empty text — the source-language column must never be empty, so it
 *  falls back to whichever language the admin actually filled in. */
function firstFilled(...values: (string | undefined)[]) {
  return values.map((v) => v?.trim()).find(Boolean) ?? "";
}

const orNull = (v: string | undefined) => v?.trim() || null;

/** Validates the form and hands the whole product (all sizes) to the service. */
async function save(input: AdminProductFormInput, familyOf?: string): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const raw = formSchema.safeParse(input);
  if (!raw.success) return { success: false, error: "Formulaire invalide." };
  const f = raw.data;

  const name = firstFilled(f.name, f.nameFr, f.nameEn, f.nameIt);
  const description = firstFilled(f.description, f.descriptionFr, f.descriptionEn, f.descriptionIt);
  const shortDescription = firstFilled(f.shortDescription, f.shortDescriptionFr, f.shortDescriptionEn, f.shortDescriptionIt);
  const first = f.sizes[0];

  // Reuse the catalogue-wide field rules (name/description length, slug format,
  // image URLs…) — the per-size fields are checked by the service.
  const parsed = productSchema.safeParse({
    name,
    slug: f.slug,
    sku: first.sku || "-",
    description,
    shortDescription,
    price: first.price,
    taxRate: f.taxRate,
    categoryId: f.categoryId,
    brandId: f.brandId,
    isFeatured: f.isFeatured,
    isNew: f.isNew,
    isBestSeller: f.isBestSeller,
    seoTitle: f.seoTitle ?? "",
    seoDescription: f.seoDescription ?? "",
    images: parseImageUrls(f.imagesText ?? ""),
    attributes: parseAttributes(f.attributesText ?? ""),
    variants: parseVariants(f.variantsText ?? ""),
    videos: [],
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const data = parsed.data;

  const result = await saveProduct(
    {
      slug: data.slug,
      name: data.name,
      nameFr: orNull(f.nameFr),
      nameEn: orNull(f.nameEn),
      nameIt: orNull(f.nameIt),
      description: data.description,
      descriptionFr: orNull(f.descriptionFr),
      descriptionEn: orNull(f.descriptionEn),
      descriptionIt: orNull(f.descriptionIt),
      shortDescription: data.shortDescription || null,
      shortDescriptionFr: orNull(f.shortDescriptionFr),
      shortDescriptionEn: orNull(f.shortDescriptionEn),
      shortDescriptionIt: orNull(f.shortDescriptionIt),
      taxRate: data.taxRate,
      categoryId: data.categoryId,
      brandId: data.brandId,
      isFeatured: data.isFeatured,
      isNew: data.isNew,
      isBestSeller: data.isBestSeller,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      images: data.images.map((i) => ({ url: i.url, alt: i.alt ?? "", position: i.position })),
      attributes: data.attributes,
      variants: data.variants,
    },
    f.sizes.map((s) => ({
      id: s.id,
      sku: s.sku,
      sizeLabel: s.sizeLabel,
      sizeSpecs: s.sizeSpecs,
      price: s.price,
      compareAtPrice: s.compareAtPrice ?? null,
      stock: s.stock,
      lowStockThreshold: s.lowStockThreshold,
      isActive: s.isActive,
    })),
    familyOf
  );

  if (result.success) {
    revalidatePath("/admin/products");
    revalidatePath("/produits");
  }
  return result;
}

export async function createProductAction(input: AdminProductFormInput): Promise<AdminActionResult> {
  return save(input);
}

/** `id` is any size of the product being edited. */
export async function updateProductAction(id: string, input: AdminProductFormInput): Promise<AdminActionResult> {
  return save(input, id);
}

export async function toggleProductActiveAction(id: string, isActive: boolean): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN", "STAFF"]);
  await setProductActive(id, isActive);
  revalidatePath("/admin/products");
  revalidatePath("/produits");
  return { success: true };
}

export async function deleteProductAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN"]);
  const result = await deleteProduct(id);
  if (result.success) {
    revalidatePath("/admin/products");
    revalidatePath("/produits");
  }
  return result;
}
