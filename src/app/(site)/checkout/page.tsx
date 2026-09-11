import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getCurrentCart } from "@/server/services/cart";
import { db } from "@/lib/db";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata: Metadata = { title: "Finaliser ma commande" };

export default async function CheckoutPage() {
  const session = await requireUser("/checkout");
  const cart = await getCurrentCart();

  if (!cart || cart.items.length === 0) {
    redirect("/panier");
  }

  const addresses = await db.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
  });

  const lines = cart.items.map((item) => ({
    id: item.id,
    name: item.product.name,
    imageUrl: item.product.images[0]?.url,
    quantity: item.quantity,
    unitPrice: Number(item.product.price) + Number(item.variant?.priceDelta ?? 0),
  }));
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">Finaliser ma commande</h1>
      <div className="mt-8">
        <CheckoutClient addresses={addresses} lines={lines} subtotal={Math.round(subtotal * 100) / 100} />
      </div>
    </div>
  );
}
