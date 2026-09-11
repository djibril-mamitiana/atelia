"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { applyInventoryMovement } from "@/server/services/inventory";
import type { OrderStatus, ShipmentStatus } from "@prisma/client";

export type AdminActionResult = { success: true } | { success: false; error: string };

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

const SHIPMENT_STATUS_FOR: Partial<Record<OrderStatus, ShipmentStatus>> = {
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
};

export async function updateOrderStatusAction(
  orderId: string,
  nextStatus: OrderStatus,
  comment?: string
): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { success: false, error: "Commande introuvable." };

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { success: false, error: `Impossible de passer de ${order.status} à ${nextStatus}.` };
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: nextStatus } });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: nextStatus,
        comment: comment || (nextStatus === "CONFIRMED" ? "Virement bancaire reçu — commande confirmée." : null),
      },
    });

    // Confirming a PENDING order is how a manual bank transfer gets
    // reconciled — mark the payment received in the same step.
    if (nextStatus === "CONFIRMED") {
      await tx.payment.update({ where: { orderId }, data: { status: "PAID", paidAt: new Date() } }).catch(() => {});
    }

    const shipmentStatus = SHIPMENT_STATUS_FOR[nextStatus];
    if (shipmentStatus) {
      await tx.shipment.upsert({
        where: { orderId },
        create: { orderId, status: shipmentStatus, shippedAt: shipmentStatus === "SHIPPED" ? new Date() : undefined, deliveredAt: shipmentStatus === "DELIVERED" ? new Date() : undefined },
        update: { status: shipmentStatus, shippedAt: shipmentStatus === "SHIPPED" ? new Date() : undefined, deliveredAt: shipmentStatus === "DELIVERED" ? new Date() : undefined },
      });
    }

    if (nextStatus === "CANCELLED" || nextStatus === "REFUNDED") {
      for (const item of order.items) {
        await applyInventoryMovement(tx, {
          productId: item.productId,
          variantId: item.variantId,
          type: "RETURN",
          quantity: item.quantity,
          reason: `${nextStatus === "CANCELLED" ? "Annulation" : "Remboursement"} ${order.orderNumber}`,
        });
      }
      if (nextStatus === "REFUNDED") {
        await tx.payment.update({ where: { orderId }, data: { status: "REFUNDED" } }).catch(() => {});
      }
    }
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/compte/commandes/${orderId}`);
  return { success: true };
}

export async function updateTrackingAction(
  orderId: string,
  carrier: string,
  trackingNumber: string
): Promise<AdminActionResult> {
  await requireRole(["ADMIN", "STAFF"]);
  await db.shipment.upsert({
    where: { orderId },
    create: { orderId, carrier, trackingNumber, status: "PREPARING" },
    update: { carrier, trackingNumber },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/compte/commandes/${orderId}`);
  return { success: true };
}
