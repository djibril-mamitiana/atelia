import "server-only";
import { db } from "@/lib/db";
import { PAGE_SIZE_ADMIN_TABLE } from "@/lib/constants";

export async function getUserOrders(userId: string, page = 1) {
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: { take: 3 }, payment: true, shipment: true },
      skip: (page - 1) * PAGE_SIZE_ADMIN_TABLE,
      take: PAGE_SIZE_ADMIN_TABLE,
    }),
    db.order.count({ where: { userId } }),
  ]);
  return { orders, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE_ADMIN_TABLE)) };
}

export async function getOrderForUser(orderId: string, userId: string) {
  return db.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payment: true,
      shipment: true,
      shippingAddress: true,
      billingAddress: true,
      coupon: true,
    },
  });
}

export async function getOrderForAdmin(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: { include: { images: { take: 1 } } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payment: true,
      shipment: true,
      shippingAddress: true,
      billingAddress: true,
      coupon: true,
    },
  });
}
