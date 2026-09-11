import "server-only";
import { db } from "@/lib/db";
import { computeShippingCost, type ShippingMethod } from "@/lib/shipping";
import type { Coupon, CouponType } from "@prisma/client";

/**
 * Authoritative, server-side price computation.
 *
 * Every value here is derived from what is currently in the database —
 * never from anything the browser sends. Call this both to preview the
 * cart total and (again, inside the order-creation transaction) as the
 * final source of truth before charging the customer.
 */

export type { ShippingMethod };

export type CartLineInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export class PricingError extends Error {
  code: "OUT_OF_STOCK" | "PRODUCT_UNAVAILABLE" | "INVALID_COUPON" | "EMPTY_CART";
  details?: unknown;
  constructor(code: PricingError["code"], message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export type PricedLine = {
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
};

export type OrderPricing = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  couponId: string | null;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function findActiveCoupon(code: string): Promise<Coupon | null> {
  const now = new Date();
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.isActive) return null;
  if (coupon.startsAt > now || coupon.endsAt < now) return null;
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) return null;
  return coupon;
}

function couponDiscountAmount(
  type: CouponType,
  value: number,
  subtotal: number
): number {
  if (type === "PERCENT") return round2((subtotal * value) / 100);
  return round2(Math.min(value, subtotal));
}

export async function computeOrderPricing(
  items: CartLineInput[],
  opts: { shippingMethod: ShippingMethod; couponCode?: string | null; userId?: string | null }
): Promise<OrderPricing> {
  if (items.length === 0) {
    throw new PricingError("EMPTY_CART", "Le panier est vide.");
  }

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const outOfStock: string[] = [];
  const lines: PricedLine[] = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      throw new PricingError(
        "PRODUCT_UNAVAILABLE",
        `Le produit demandé n'est plus disponible.`,
        { productId: item.productId }
      );
    }
    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId)
      : null;
    if (item.variantId && (!variant || !variant.isActive)) {
      throw new PricingError("PRODUCT_UNAVAILABLE", "Cette variante n'est plus disponible.", {
        productId: item.productId,
        variantId: item.variantId,
      });
    }

    const availableStock = variant ? variant.stock : product.stock;
    if (item.quantity > availableStock) {
      outOfStock.push(product.name);
    }

    const unitPrice = round2(Number(product.price) + Number(variant?.priceDelta ?? 0));
    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name,
      sku: variant?.sku ?? product.sku,
      unitPrice,
      quantity: item.quantity,
      lineTotal: round2(unitPrice * item.quantity),
      availableStock,
    };
  });

  if (outOfStock.length > 0) {
    throw new PricingError(
      "OUT_OF_STOCK",
      `Stock insuffisant pour : ${outOfStock.join(", ")}.`,
      { products: outOfStock }
    );
  }

  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));

  // Informational VAT breakdown — prices are stored tax-inclusive (TTC),
  // so tax is a component of subtotal, not added on top of it.
  const tax = round2(
    lines.reduce((sum, l) => {
      const product = productMap.get(l.productId)!;
      const rate = Number(product.taxRate);
      return sum + l.lineTotal * (rate / (100 + rate));
    }, 0)
  );

  let discount = 0;
  let couponId: string | null = null;

  if (opts.couponCode) {
    const coupon = await findActiveCoupon(opts.couponCode);
    if (!coupon) {
      throw new PricingError("INVALID_COUPON", "Ce code promo n'est pas valide ou a expiré.");
    }
    if (coupon.minPurchase && subtotal < Number(coupon.minPurchase)) {
      throw new PricingError(
        "INVALID_COUPON",
        `Ce code nécessite un minimum d'achat de ${coupon.minPurchase} €.`
      );
    }
    if (coupon.productId && !lines.some((l) => l.productId === coupon.productId)) {
      throw new PricingError("INVALID_COUPON", "Ce code ne s'applique pas à votre panier.");
    }
    if (coupon.categoryId) {
      const productsInCategory = await db.product.findMany({
        where: { id: { in: lines.map((l) => l.productId) }, categoryId: coupon.categoryId },
        select: { id: true },
      });
      if (productsInCategory.length === 0) {
        throw new PricingError("INVALID_COUPON", "Ce code ne s'applique pas à votre panier.");
      }
    }
    if (opts.userId && coupon.usageLimitPerUser != null) {
      const used = await db.couponUsage.count({
        where: { couponId: coupon.id, userId: opts.userId },
      });
      if (used >= coupon.usageLimitPerUser) {
        throw new PricingError("INVALID_COUPON", "Vous avez déjà utilisé ce code promo.");
      }
    }

    discount = couponDiscountAmount(coupon.type, Number(coupon.value), subtotal);
    couponId = coupon.id;
  }

  const shippingCost = computeShippingCost(opts.shippingMethod, subtotal - discount);
  const total = round2(subtotal - discount + shippingCost);

  return { lines, subtotal, discount, shippingCost, tax, total, couponId };
}
