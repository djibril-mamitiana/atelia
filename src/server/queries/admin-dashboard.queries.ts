import "server-only";
import { db } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

const PAID_STATUSES: OrderStatus[] = ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export async function getDashboardKpis() {
  // Prisma can't compare two columns (stock <= lowStockThreshold) in a
  // `where` filter, so the low-stock count is computed in application code.
  const [revenueAgg, orderCount, customerCount, productCount, outOfStock, stockLevels, toProcess] = await Promise.all([
    db.order.aggregate({ where: { status: { in: PAID_STATUSES } }, _sum: { total: true }, _avg: { total: true } }),
    db.order.count({ where: { status: { in: PAID_STATUSES } } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: { isActive: true, stock: 0 } }),
    db.product.findMany({ where: { isActive: true, stock: { gt: 0 } }, select: { stock: true, lowStockThreshold: true } }),
    db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
  ]);

  const lowStockCount = stockLevels.filter((p) => p.stock <= p.lowStockThreshold).length;

  return {
    revenue: Number(revenueAgg._sum?.total ?? 0),
    averageBasket: Number(revenueAgg._avg?.total ?? 0),
    orderCount,
    customerCount,
    productCount,
    outOfStockCount: outOfStock,
    lowStockCount,
    ordersToProcess: toProcess,
  };
}

export async function getSalesByDay(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await db.order.findMany({
    where: { status: { in: PAID_STATUSES }, createdAt: { gte: since } },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(order.total));
  }

  return Array.from(buckets.entries()).map(([date, total]) => ({ date, total }));
}

export async function getSalesByMonth(months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);

  const orders = await db.order.findMany({
    where: { status: { in: PAID_STATUSES }, createdAt: { gte: since } },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const order of orders) {
    const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(order.total));
  }

  return Array.from(buckets.entries()).map(([month, total]) => ({ month, total }));
}

export async function getTopProducts(limit = 5) {
  const items = await db.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, name: true, sku: true },
  });
  const map = new Map(products.map((p) => [p.id, p]));
  return items.map((i) => ({
    product: map.get(i.productId),
    quantity: i._sum.quantity ?? 0,
    revenue: Number(i._sum.total ?? 0),
  }));
}

export async function getTopCategories(limit = 5) {
  const items = await db.orderItem.findMany({
    select: { total: true, product: { select: { categoryId: true, category: { select: { name: true } } } } },
  });
  const byCategory = new Map<string, { name: string; revenue: number }>();
  for (const item of items) {
    const id = item.product.categoryId;
    const name = item.product.category.name;
    const existing = byCategory.get(id) ?? { name, revenue: 0 };
    existing.revenue += Number(item.total);
    byCategory.set(id, existing);
  }
  return Array.from(byCategory.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
