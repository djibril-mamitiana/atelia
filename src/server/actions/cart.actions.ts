"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrCreateCart } from "@/server/services/cart";

export type CartActionResult = { success: true } | { success: false; error: string };

export async function addToCartAction(
  productId: string,
  quantity: number,
  variantId?: string | null
): Promise<CartActionResult> {
  if (quantity < 1 || quantity > 99) {
    return { success: false, error: "Quantité invalide." };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });
  if (!product || !product.isActive) {
    return { success: false, error: "Ce produit n'est plus disponible." };
  }
  const variant = variantId ? product.variants.find((v) => v.id === variantId) : null;
  if (variantId && !variant) {
    return { success: false, error: "Cette variante n'est plus disponible." };
  }
  const availableStock = variant ? variant.stock : product.stock;
  if (availableStock < 1) {
    return { success: false, error: "Ce produit est en rupture de stock." };
  }

  const cart = await getOrCreateCart();

  await db.$transaction(async (tx) => {
    const existing = await tx.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId ?? null },
    });
    const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, availableStock, 99);
    if (existing) {
      await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } });
    } else {
      await tx.cartItem.create({
        data: { cartId: cart.id, productId, variantId: variantId ?? null, quantity: nextQuantity },
      });
    }
  });

  revalidatePath("/panier");
  revalidatePath("/", "layout"); // header cart count
  return { success: true };
}

export async function updateCartItemQuantityAction(
  cartItemId: string,
  quantity: number
): Promise<CartActionResult> {
  if (quantity < 1 || quantity > 99) {
    return { success: false, error: "Quantité invalide." };
  }

  const item = await db.cartItem.findUnique({
    where: { id: cartItemId },
    include: { product: true, variant: true },
  });
  if (!item) return { success: false, error: "Cet article n'est plus dans le panier." };

  const availableStock = item.variant ? item.variant.stock : item.product.stock;
  const nextQuantity = Math.min(quantity, availableStock);

  await db.cartItem.update({ where: { id: cartItemId }, data: { quantity: nextQuantity } });
  revalidatePath("/panier");
  revalidatePath("/", "layout"); // header cart count
  return { success: true };
}

export async function removeCartItemAction(cartItemId: string): Promise<CartActionResult> {
  await db.cartItem.deleteMany({ where: { id: cartItemId } });
  revalidatePath("/panier");
  revalidatePath("/", "layout"); // header cart count
  return { success: true };
}
