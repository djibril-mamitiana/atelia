import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { getCurrentCart } from "@/server/services/cart";
import { getSession } from "@/lib/auth/session";
import { computeOrderPricing, PricingError } from "@/server/services/pricing";
import { getCartRecommendations } from "@/server/queries/catalog.queries";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { CouponForm } from "@/components/cart/coupon-form";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export const metadata: Metadata = { title: "Mon panier" };

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string }>;
}) {
  const { promo } = await searchParams;
  const [cart, session] = await Promise.all([getCurrentCart(), getSession()]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page py-10">
        <h1 className="font-display text-3xl text-ink">Mon panier</h1>
        <div className="mt-8">
          <EmptyState
            icon={ShoppingCart}
            title="Votre panier est vide"
            description="Parcourez notre catalogue pour trouver le matériel de votre prochain projet."
            action={<LinkButton href="/produits" className="mt-2">Découvrir les produits</LinkButton>}
          />
        </div>
      </div>
    );
  }

  const lines = cart.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
  }));

  let pricing;
  let couponError: string | undefined;
  try {
    pricing = await computeOrderPricing(lines, {
      shippingMethod: "STANDARD",
      couponCode: promo || null,
      userId: session?.userId,
    });
  } catch (err) {
    if (err instanceof PricingError && err.code === "INVALID_COUPON") {
      couponError = err.message;
      pricing = await computeOrderPricing(lines, { shippingMethod: "STANDARD", userId: session?.userId });
    } else {
      throw err;
    }
  }

  const recommendations = await getCartRecommendations(cart.items.map((i) => i.productId));
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - pricing.subtotal);

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">Mon panier</h1>

      {remainingForFreeShipping > 0 ? (
        <p className="mt-3 rounded-md bg-sage-soft px-4 py-2.5 text-sm text-sage">
          Encore {formatPrice(remainingForFreeShipping)} d&apos;achat pour bénéficier de la livraison offerte.
        </p>
      ) : (
        <p className="mt-3 rounded-md bg-sage-soft px-4 py-2.5 text-sm text-sage">Livraison offerte 🎉</p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-border">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              id={item.id}
              productSlug={item.product.slug}
              productName={item.product.name}
              brandName={item.product.brand.name}
              imageUrl={item.product.images[0]?.url}
              variantName={item.variant?.name}
              unitPrice={Number(item.product.price) + Number(item.variant?.priceDelta ?? 0)}
              quantity={item.quantity}
              stock={item.variant ? item.variant.stock : item.product.stock}
            />
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-border p-5">
            <p className="mb-4 font-medium text-ink">Résumé</p>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Sous-total</dt>
                <dd className="text-ink">{formatPrice(pricing.subtotal)}</dd>
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-sage">
                  <dt>Réduction</dt>
                  <dd>-{formatPrice(pricing.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Livraison estimée</dt>
                <dd className="text-ink">{pricing.shippingCost === 0 ? "Offerte" : formatPrice(pricing.shippingCost)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>dont TVA</dt>
                <dd>{formatPrice(pricing.tax)}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-3 text-base font-semibold text-ink">
                <dt>Total</dt>
                <dd>{formatPrice(pricing.total)}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <CouponForm error={couponError} />
            </div>

            <LinkButton href="/checkout" size="lg" className="mt-5 w-full">
              Passer la commande
            </LinkButton>
            <LinkButton href="/produits" variant="ghost" size="sm" className="mt-2 w-full">
              Continuer mes achats
            </LinkButton>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 font-display text-2xl text-ink">Vous pourriez également avoir besoin de…</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-4">
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
