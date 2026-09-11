import { z } from "zod";

export const productAttributeInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  values: z.array(z.string().trim().min(1).max(120)).min(1),
});

export const productImageInputSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().max(200).optional().or(z.literal("")),
  position: z.number().int().min(0).default(0),
});

export const productVideoInputSchema = z.object({
  url: z.string().url(),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  position: z.number().int().min(0).default(0),
});

export const productVariantInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().min(1).max(60),
  priceDelta: z.coerce.number().default(0),
  stock: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide (lettres, chiffres, tirets)"),
  sku: z.string().trim().min(1, "SKU requis").max(60),
  description: z.string().trim().min(10, "Description trop courte"),
  shortDescription: z.string().trim().max(300).optional().or(z.literal("")),
  price: z.coerce.number().positive("Le prix doit être positif"),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  weightKg: z.coerce.number().min(0).optional().nullable(),
  categoryId: z.string().min(1, "Catégorie requise"),
  brandId: z.string().min(1, "Marque requise"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("")),
  images: z.array(productImageInputSchema).default([]),
  videos: z.array(productVideoInputSchema).default([]),
  variants: z.array(productVariantInputSchema).default([]),
  attributes: z.array(productAttributeInputSchema).default([]),
})
  .refine((data) => !data.compareAtPrice || data.compareAtPrice > data.price, {
    message: "L'ancien prix doit être supérieur au prix actuel",
    path: ["compareAtPrice"],
  });
export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  parentId: z.string().optional().nullable(),
  order: z.coerce.number().int().default(0),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const brandSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
export type BrandInput = z.infer<typeof brandSchema>;

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN"]),
  quantity: z.coerce.number().int().positive("La quantité doit être positive"),
  reason: z.string().trim().max(300).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().min(10, "Merci de détailler un peu votre avis").max(2000),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
