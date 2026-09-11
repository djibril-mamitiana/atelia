import "server-only";
import type { Prisma, InventoryMovementType } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Applies a stock movement to a product (or one of its variants) and logs it
 * to InventoryMovement. Must be called within a transaction so the stock
 * read-modify-write and the order/order-item writes stay atomic.
 */
export async function applyInventoryMovement(
  tx: Tx,
  params: {
    productId: string;
    variantId?: string | null;
    type: InventoryMovementType;
    quantity: number;
    reason?: string;
    createdByUserId?: string | null;
  }
) {
  const { productId, variantId, type, quantity, reason, createdByUserId } = params;
  const delta = type === "IN" || type === "RETURN" ? quantity : -quantity;

  if (variantId) {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: delta } },
    });
  } else {
    await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: delta } },
    });
  }

  await tx.inventoryMovement.create({
    data: { productId, type, quantity, reason, createdByUserId },
  });
}
