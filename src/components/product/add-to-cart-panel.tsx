"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast";
import { addToCartAction } from "@/server/actions/cart.actions";
import { formatPrice } from "@/lib/format";

type Variant = { id: string; name: string; sku: string; priceDelta: number; stock: number };

export function AddToCartPanel({
  productId,
  basePrice,
  baseStock,
  variants,
}: {
  productId: string;
  basePrice: number;
  baseStock: number;
  variants: Variant[];
}) {
  const t = useTranslations("Product");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;
  const stock = selectedVariant ? selectedVariant.stock : baseStock;
  const price = basePrice + (selectedVariant?.priceDelta ?? 0);
  const outOfStock = stock <= 0;

  const maxQuantity = useMemo(() => Math.max(1, Math.min(stock, 99)), [stock]);

  function add(redirectToCheckout: boolean) {
    startTransition(async () => {
      const result = await addToCartAction(productId, quantity, variantId);
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      if (redirectToCheckout) {
        router.push("/checkout");
      } else {
        toast(t("addedToCart"), "success");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-5">
      {variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">{t("choice")}</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                disabled={v.stock <= 0}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${
                  variantId === v.id ? "border-ink bg-ink text-white" : "border-border-strong text-ink-soft hover:border-ink"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-ink">{formatPrice(price)}</span>
        <span className="text-xs text-muted">{t("vatIncluded")}</span>
      </div>

      <p className={outOfStock ? "text-sm font-medium text-danger" : "text-sm text-sage"}>
        {outOfStock ? t("outOfStockStatus") : stock <= 5 ? t("lowStock", { count: stock }) : t("inStock")}
      </p>

      <div className="flex items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} disabled={outOfStock} />
      </div>

      <div className="flex flex-col gap-2.5">
        <Button onClick={() => add(false)} disabled={outOfStock || pending} variant="outline" size="lg">
          <ShoppingCart size={17} /> {t("addToCart")}
        </Button>
        <Button onClick={() => add(true)} disabled={outOfStock || pending} size="lg">
          <Zap size={17} /> {t("buyNow")}
        </Button>
      </div>

      <div className="mt-1 flex flex-col gap-1.5 border-t border-border pt-4 text-xs text-muted">
        <p>{t("shippingHome")}</p>
        <p>{t("pickupFree")}</p>
      </div>
    </div>
  );
}
