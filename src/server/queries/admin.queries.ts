import "server-only";
import { db } from "@/lib/db";
import { PAGE_SIZE_ADMIN_TABLE } from "@/lib/constants";
import type { Prisma, OrderStatus } from "@prisma/client";

/**
 * Admin product list: one entry per product — the sizes of a product (rows
 * sharing a groupKey) are folded into a single row, like on the storefront.
 */
export async function getAdminProducts(opts: { q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.ProductWhereInput = opts.q
    ? {
        OR: [
          { name: { contains: opts.q, mode: "insensitive" } },
          { nameFr: { contains: opts.q, mode: "insensitive" } },
          { sku: { contains: opts.q, mode: "insensitive" } },
        ],
      }
    : {};

  // Rank every matching row cheaply, fold sizes together, then load only the page.
  const ranked = await db.product.findMany({ where, select: { id: true, groupKey: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }] });
  const seen = new Set<string>();
  const entries = ranked.filter((r) => {
    const key = r.groupKey ?? r.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const pageIds = entries.slice((page - 1) * PAGE_SIZE_ADMIN_TABLE, page * PAGE_SIZE_ADMIN_TABLE).map((e) => e.id);

  const rows = pageIds.length
    ? await db.product.findMany({
        where: { id: { in: pageIds } },
        include: { category: { select: { name: true } }, brand: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" } } },
      })
    : [];
  const byId = new Map(rows.map((r) => [r.id, r]));

  const keys = rows.map((r) => r.groupKey).filter((k): k is string => !!k);
  const [totals, actives] = keys.length
    ? await Promise.all([
        db.product.groupBy({ by: ["groupKey"], where: { groupKey: { in: keys } }, _count: { _all: true }, _min: { price: true }, _max: { price: true }, _sum: { stock: true } }),
        db.product.groupBy({ by: ["groupKey"], where: { groupKey: { in: keys }, isActive: true }, _count: { _all: true } }),
      ])
    : [[], []];
  const totalByKey = new Map(totals.map((t) => [t.groupKey as string, t]));
  const activeByKey = new Map(actives.map((a) => [a.groupKey as string, a._count._all]));

  const products = pageIds.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    const t = row.groupKey ? totalByKey.get(row.groupKey) : undefined;
    return [
      {
        ...row,
        family: {
          sizes: t?._count._all ?? 1,
          minPrice: Number(t?._min.price ?? row.price),
          maxPrice: Number(t?._max.price ?? row.price),
          stock: t?._sum.stock ?? row.stock,
          active: row.groupKey ? (activeByKey.get(row.groupKey) ?? 0) > 0 : row.isActive,
        },
      },
    ];
  });

  return { products, total: entries.length, page, pageCount: Math.max(1, Math.ceil(entries.length / PAGE_SIZE_ADMIN_TABLE)) };
}

export async function getAdminCategories() {
  return db.category.findMany({
    orderBy: [{ parentId: "asc" }, { order: "asc" }],
    include: { parent: { select: { name: true } }, _count: { select: { products: true, children: true } } },
  });
}

export async function getAdminBrands() {
  return db.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getAdminInventory(opts: { q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.ProductWhereInput = opts.q
    ? { OR: [{ name: { contains: opts.q, mode: "insensitive" } }, { sku: { contains: opts.q, mode: "insensitive" } }] }
    : {};

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true, isActive: true },
      orderBy: { stock: "asc" },
      skip: (page - 1) * PAGE_SIZE_ADMIN_TABLE,
      take: PAGE_SIZE_ADMIN_TABLE,
    }),
    db.product.count({ where }),
  ]);

  return { products, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE_ADMIN_TABLE)) };
}

export async function getInventoryMovements(productId: string) {
  return db.inventoryMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { createdByUser: { select: { firstName: true, lastName: true } } },
  });
}

export async function getAdminOrders(opts: { q?: string; status?: OrderStatus; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.OrderWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.q
      ? {
          OR: [
            { orderNumber: { contains: opts.q, mode: "insensitive" } },
            { user: { email: { contains: opts.q, mode: "insensitive" } } },
            { user: { lastName: { contains: opts.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, email: true } }, payment: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE_ADMIN_TABLE,
      take: PAGE_SIZE_ADMIN_TABLE,
    }),
    db.order.count({ where }),
  ]);

  return { orders, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE_ADMIN_TABLE)) };
}

export async function getAdminCustomers(opts: { q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(opts.q
      ? {
          OR: [
            { email: { contains: opts.q, mode: "insensitive" } },
            { lastName: { contains: opts.q, mode: "insensitive" } },
            { firstName: { contains: opts.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        isActive: true,
        orders: { select: { total: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE_ADMIN_TABLE,
      take: PAGE_SIZE_ADMIN_TABLE,
    }),
    db.user.count({ where }),
  ]);

  return {
    customers: customers.map((c) => ({
      ...c,
      orderCount: c.orders.length,
      totalSpent: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
      lastOrderAt: c.orders.length > 0 ? c.orders.map((o) => o.createdAt).sort((a, b) => b.getTime() - a.getTime())[0] : null,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE_ADMIN_TABLE)),
  };
}

export async function getAdminCustomerById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
    },
  });
}

export async function getAdminCoupons() {
  return db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } }, product: { select: { name: true } } },
  });
}

export async function getAdminReviews(opts: { status?: "PENDING" | "APPROVED" | "REJECTED" }) {
  return db.review.findMany({
    where: opts.status ? { status: opts.status } : {},
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } }, user: { select: { firstName: true, lastName: true } } },
    take: 100,
  });
}

export async function getAdminTutorials() {
  return db.tutorial.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } }, _count: { select: { products: true } } },
  });
}

export async function getAdminTutorialById(id: string) {
  return db.tutorial.findUnique({ where: { id }, include: { products: { include: { product: { select: { id: true, name: true } } } } } });
}
