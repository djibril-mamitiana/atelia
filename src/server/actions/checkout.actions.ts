"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getCurrentCart } from "@/server/services/cart";
import { computeOrderPricing, PricingError, type CartLineInput } from "@/server/services/pricing";
import { applyInventoryMovement } from "@/server/services/inventory";
import { generateOrderNumber } from "@/server/services/order-number";
import { createOrderSchema, type CreateOrderInput } from "@/validations/checkout.schema";

export type CheckoutResult = { success: true; orderId: string } | { success: false; error: string };

/**
 * Creates the order from the current cart and decrements stock — all
 * pricing is recomputed here from the database; nothing from the client is
 * trusted for money math.
 *
 * Payment method: manual bank transfer. The order is created with a
 * PENDING payment; the customer is shown the bank details and the order
 * reference to include on their transfer (see /commande/[id]), and staff
 * mark it as received from the admin order page once the funds land.
 */
export async function createOrderAction(input: CreateOrderInput): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Connectez-vous pour finaliser votre commande." };

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Formulaire de commande invalide." };
  const { shippingAddressId, billingAddressId, shippingMethod, couponCode, customerNote } = parsed.data;

  const [shippingAddress, billingAddress] = await Promise.all([
    db.address.findFirst({ where: { id: shippingAddressId, userId: session.userId } }),
    db.address.findFirst({ where: { id: billingAddressId, userId: session.userId } }),
  ]);
  if (!shippingAddress) return { success: false, error: "Adresse de livraison invalide." };
  if (!billingAddress) return { success: false, error: "Adresse de facturation invalide." };

  const cart = await getCurrentCart();
  if (!cart || cart.items.length === 0) {
    return { success: false, error: "Votre panier est vide." };
  }

  const lineInputs: CartLineInput[] = cart.items.map((i) => ({
    productId: i.productId,
    variantId: i.variantId,
    quantity: i.quantity,
  }));

  let pricing;
  try {
    pricing = await computeOrderPricing(lineInputs, {
      shippingMethod,
      couponCode: couponCode || null,
      userId: session.userId,
    });
  } catch (err) {
    if (err instanceof PricingError) return { success: false, error: err.message };
    throw err;
  }

  const orderNumber = await generateOrderNumber();

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: session.userId,
        status: "PENDING",
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shippingCost: pricing.shippingCost,
        tax: pricing.tax,
        total: pricing.total,
        couponId: pricing.couponId,
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        customerNote: customerNote || null,
        items: {
          create: pricing.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            productName: line.productName,
            sku: line.sku,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            total: line.lineTotal,
          })),
        },
        statusHistory: {
          create: { status: "PENDING", comment: "Commande créée, en attente de virement bancaire." },
        },
        payment: {
          create: {
            provider: "BANK_TRANSFER",
            status: "PENDING",
            amount: pricing.total,
            currency: "EUR",
          },
        },
      },
    });

    for (const line of pricing.lines) {
      await applyInventoryMovement(tx, {
        productId: line.productId,
        variantId: line.variantId,
        type: "OUT",
        quantity: line.quantity,
        reason: `Commande ${orderNumber}`,
        createdByUserId: session.userId,
      });
    }

    if (pricing.couponId) {
      await tx.coupon.update({ where: { id: pricing.couponId }, data: { usageCount: { increment: 1 } } });
      await tx.couponUsage.create({
        data: { couponId: pricing.couponId, userId: session.userId, orderId: created.id },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  return { success: true, orderId: order.id };
}
