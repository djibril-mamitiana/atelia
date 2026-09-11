"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export type FavoriteActionResult = { success: true; isFavorite: boolean } | { success: false; error: string };

export async function toggleFavoriteAction(productId: string): Promise<FavoriteActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Connectez-vous pour ajouter des favoris." };
  }

  const existing = await db.favorite.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/compte/favoris");
    return { success: true, isFavorite: false };
  }

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { success: false, error: "Produit introuvable." };

  await db.favorite.create({ data: { userId: session.userId, productId } });
  revalidatePath("/compte/favoris");
  return { success: true, isFavorite: true };
}
