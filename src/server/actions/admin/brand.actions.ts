"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { brandSchema, type BrandInput } from "@/validations/product.schema";

export type AdminActionResult = { success: true; id: string } | { success: false; error: string };

export async function createBrandAction(input: BrandInput): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const taken = await db.brand.findUnique({ where: { slug: parsed.data.slug } });
  if (taken) return { success: false, error: "Ce slug est déjà utilisé." };

  const brand = await db.brand.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      logoUrl: parsed.data.logoUrl || null,
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin/brands");
  revalidatePath("/produits");
  return { success: true, id: brand.id };
}

export async function updateBrandAction(id: string, input: BrandInput): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const existing = await db.brand.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Marque introuvable." };

  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  if (parsed.data.slug !== existing.slug) {
    const taken = await db.brand.findUnique({ where: { slug: parsed.data.slug } });
    if (taken) return { success: false, error: "Ce slug est déjà utilisé." };
  }

  await db.brand.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      logoUrl: parsed.data.logoUrl || null,
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin/brands");
  revalidatePath("/produits");
  return { success: true, id };
}

export async function deleteBrandAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN"]);
  const hasProducts = await db.product.findFirst({ where: { brandId: id } });
  if (hasProducts) return { success: false, error: "Cette marque a des produits associés — déplacez-les avant de la supprimer." };

  await db.brand.delete({ where: { id } });
  revalidatePath("/admin/brands");
  return { success: true };
}
