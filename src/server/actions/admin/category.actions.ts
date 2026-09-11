"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { categorySchema, type CategoryInput } from "@/validations/product.schema";

export type AdminActionResult = { success: true; id: string } | { success: false; error: string };

export async function createCategoryAction(input: CategoryInput): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const taken = await db.category.findUnique({ where: { slug: parsed.data.slug } });
  if (taken) return { success: false, error: "Ce slug est déjà utilisé." };

  const category = await db.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      parentId: parsed.data.parentId || null,
      order: parsed.data.order,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: true, id: category.id };
}

export async function updateCategoryAction(id: string, input: CategoryInput): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Catégorie introuvable." };
  if (input.parentId === id) return { success: false, error: "Une catégorie ne peut pas être son propre parent." };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  if (parsed.data.slug !== existing.slug) {
    const taken = await db.category.findUnique({ where: { slug: parsed.data.slug } });
    if (taken) return { success: false, error: "Ce slug est déjà utilisé." };
  }

  await db.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      parentId: parsed.data.parentId || null,
      order: parsed.data.order,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: true, id };
}

export async function deleteCategoryAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  await requireRole(["ADMIN"]);
  const [hasProducts, hasChildren] = await Promise.all([
    db.product.findFirst({ where: { categoryId: id } }),
    db.category.findFirst({ where: { parentId: id } }),
  ]);
  if (hasProducts) return { success: false, error: "Cette catégorie contient des produits — déplacez-les avant de la supprimer." };
  if (hasChildren) return { success: false, error: "Cette catégorie a des sous-catégories — supprimez-les d'abord." };

  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: true };
}
