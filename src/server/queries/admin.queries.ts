import "server-only";
import { db } from "@/lib/db";
import { PAGE_SIZE_ADMIN_TABLE } from "@/lib/constants";
import type { Prisma, OrderStatus } from "@prisma/client";

export async function getAdminProducts(opts: { q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.ProductWhereInput = opts.q
    ? {
        OR: [
          { name: { contains: opts.q, mode: "insensitive" } },
          { sku: { contains: opts.q, mode: "insensitive" } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: { select: { name: true } }, brand: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE_ADMIN_TABLE,
      take: PAGE_SIZE_ADMIN_TABLE,
    }),
    db.product.count({ where }),
  ]);

  return { products, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE_ADMIN_TABLE)) };
}

export async function getAdminProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, attributes: { include: { values: true } }, variants: true },
  });
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
