import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { localizedProductName } from "@/lib/product-name";
import { requireUser } from "@/lib/auth/session";
import { getCurrentCart } from "@/server/services/cart";
import { db } from "@/lib/db";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Checkout");
  return { title: t("title") };
}

export default async function CheckoutPage() {
  const session = await requireUser("/checkout");
  const cart = await getCurrentCart();
  const t = await getTranslations("Checkout");
  const locale = await getLocale();

  if (!cart || cart.items.length === 0) {
    redirect({ href: "/panier", locale });
    throw new Error("unreachable"); // redirect() always throws — this only narrows `cart` for TS
  }

  const addresses = await db.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
  });

  const lines = cart.items.map((item) => ({
    id: item.id,
    name: localizedProductName(item.product, locale),
    imageUrl: item.product.images[0]?.url,
    quantity: item.quantity,
    unitPrice: Number(item.product.price) + Number(item.variant?.priceDelta ?? 0),
  }));
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">{t("title")}</h1>
      <div className="mt-8">
        <CheckoutClient addresses={addresses} lines={lines} subtotal={Math.round(subtotal * 100) / 100} />
      </div>
    </div>
  );
}
