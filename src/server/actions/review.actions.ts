"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { reviewSchema, type ReviewInput } from "@/validations/product.schema";

export type ReviewActionResult = { success: true } | { success: false; error: string };

/** A customer may review a product only once they've received it in a delivered order. */
export async function submitReviewAction(input: ReviewInput): Promise<ReviewActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Connectez-vous pour laisser un avis." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Formulaire invalide." };
  const { productId, rating, title, comment } = parsed.data;

  const purchase = await db.orderItem.findFirst({
    where: {
      productId,
      order: { userId: session.userId, status: "DELIVERED" },
    },
    select: { orderId: true },
    orderBy: { order: { createdAt: "desc" } },
  });

  if (!purchase) {
    return {
      success: false,
      error: "Vous ne pouvez laisser un avis que sur un produit reçu dans une commande livrée.",
    };
  }

  const alreadyReviewed = await db.review.findFirst({
    where: { productId, userId: session.userId, orderId: purchase.orderId },
  });
  if (alreadyReviewed) {
    return { success: false, error: "Vous avez déjà laissé un avis pour cet achat." };
  }

  await db.review.create({
    data: {
      productId,
      userId: session.userId,
      orderId: purchase.orderId,
      rating,
      title: title || null,
      comment,
      status: "PENDING",
    },
  });

  revalidatePath(`/produits`);
  return { success: true };
}
