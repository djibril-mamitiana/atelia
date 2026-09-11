"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { inventoryAdjustmentSchema } from "@/validations/product.schema";

export type AdminActionResult = { success: true } | { success: false; error: string };

export async function adjustInventoryAction(input: {
  productId: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  reason?: string;
}): Promise<AdminActionResult> {
  const session = await requireRole(["ADMIN", "STAFF"]);
  const parsed = inventoryAdjustmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const product = await db.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return { success: false, error: "Produit introuvable." };

  const delta = parsed.data.type === "IN" || parsed.data.type === "RETURN" ? parsed.data.quantity : -parsed.data.quantity;
  if (product.stock + delta < 0) {
    return { success: false, error: "Le stock ne peut pas devenir négatif." };
  }

  await db.$transaction([
    db.product.update({ where: { id: product.id }, data: { stock: { increment: delta } } }),
    db.inventoryMovement.create({
      data: {
        productId: product.id,
        type: parsed.data.type,
        quantity: parsed.data.quantity,
        reason: parsed.data.reason || null,
        createdByUserId: session.userId,
      },
    }),
  ]);

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/produits");
  return { success: true };
}
