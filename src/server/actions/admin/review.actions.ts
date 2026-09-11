"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import type { ReviewStatus } from "@prisma/client";

export type AdminActionResult = { success: true } | { success: false; error: string };

async function recomputeProductRating(productId: string) {
  const agg = await db.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await db.product.update({
    where: { id: productId },
    data: { avgRating: Math.round((agg._avg.rating ?? 0) * 100) / 100, reviewCount: agg._count.rating },
  });
}

export async function moderateReviewAction(reviewId: string, status: ReviewStatus): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return { success: false, error: "Avis introuvable." };

  await db.review.update({ where: { id: reviewId }, data: { status } });
  await recomputeProductRating(review.productId);

  revalidatePath("/admin/reviews");
  revalidatePath("/produits");
  return { success: true };
}
