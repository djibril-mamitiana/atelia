"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast";
import { addToCartAction } from "@/server/actions/cart.actions";
import { formatPrice } from "@/lib/format";

type Variant = { id: string; name: string; sku: string; priceDelta: number; stock: number };

/** One size of a size group — each is its own product row (own SKU, price, stock). */
export type SizeOption = {
  id: string;
  sku: string;
  sizeLabel: string;
  specs: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
};

export function AddToCartPanel({
  productId,
  basePrice,
  baseStock,
  variants,
  sizes = [],
  initialSizeId,
}: {
  productId: string;
  basePrice: number;
  baseStock: number;
  variants: Variant[];
  sizes?: SizeOption[];
  initialSizeId?: string;
}) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);

  const hasSizes = sizes.length > 1;
  const [sizeId, setSizeId] = useState<string>(initialSizeId ?? sizes[0]?.id ?? productId);
  const selectedSize = hasSizes ? (sizes.find((sz) => sz.id === sizeId) ?? sizes[0]) : null;

  // With a size table each size is its own product: it supplies the id,
  // price and stock. Otherwise the (optional) variant chips apply as before.
  const selectedVariant = hasSizes ? null : (variants.find((v) => v.id === variantId) ?? null);
  const targetProductId = selectedSize ? selectedSize.id : productId;
  const stock = selectedSize ? selectedSize.stock : selectedVariant ? selectedVariant.stock : baseStock;
  const price = selectedSize ? selectedSize.price : basePrice + (selectedVariant?.priceDelta ?? 0);
  const compareAtPrice = selectedSize?.compareAtPrice ?? null;
  const outOfStock = stock <= 0;

  const maxQuantity = useMemo(() => Math.max(1, Math.min(stock, 99)), [stock]);

  function add(redirectToCheckout: boolean) {
    startTransition(async () => {
      const result = await addToCartAction(targetProductId, quantity, hasSizes ? null : variantId);
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
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 sm:p-7">
      {hasSizes && (
        <div>
          <p className="eyebrow mb-3 text-muted">{t("sizeTableTitle")}</p>
          <div className="max-h-72 overflow-auto rounded-2xl border border-border">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="sticky top-0 bg-paper text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("colSize")}</th>
                  <th className="px-3 py-2 font-medium">{t("colSpecs")}</th>
                  <th className="px-3 py-2 font-medium">{t("colRef")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("colPrice")}</th>
                  <th className="px-3 py-2 font-medium">{t("colStock")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sizes.map((sz) => {
                  const active = sz.id === selectedSize?.id;
                  return (
                    <tr
                      key={sz.id}
                      onClick={() => {
                        setSizeId(sz.id);
                        setQuantity(1);
                      }}
                      className={`cursor-pointer transition-colors ${active ? "bg-accent-soft" : "hover:bg-paper"}`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-ink">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="size"
                            checked={active}
                            onChange={() => {
                              setSizeId(sz.id);
                              setQuantity(1);
                            }}
                            className="accent-accent"
                          />
                          {sz.sizeLabel}
                        </label>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">{sz.specs ?? "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">{sz.sku}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-ink">{formatPrice(sz.price, locale)}</td>
                      <td className={`whitespace-nowrap px-3 py-2 text-xs ${sz.stock > 0 ? "text-sage" : "text-danger"}`}>
                        {sz.stock > 0 ? t("inStock") : t("outOfStockBadge")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!hasSizes && variants.length > 0 && (
        <div>
          <p className="eyebrow mb-3 text-muted">{t("choice")}</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                disabled={v.stock <= 0}
                className={`rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-40 ${
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
        <span className="font-display text-4xl leading-none text-ink">{formatPrice(price, locale)}</span>
        {compareAtPrice && (
          <span className="text-sm text-muted line-through">{formatPrice(compareAtPrice, locale)}</span>
        )}
        <span className="text-xs text-muted">{t("vatIncluded")}</span>
      </div>
      {selectedSize && (
        <p className="-mt-2 text-xs text-muted">
          {t("selectedSize", { size: selectedSize.sizeLabel })} · {t("ref", { sku: selectedSize.sku })}
        </p>
      )}

      <p className={outOfStock ? "text-sm font-medium text-danger" : "text-sm text-sage"}>
        {outOfStock ? t("outOfStockStatus") : stock <= 5 ? t("lowStock", { count: stock }) : t("inStock")}
      </p>

      <div className="flex items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} disabled={outOfStock} />
      </div>

      <div className="flex flex-col gap-2.5">
        <Button onClick={() => add(false)} disabled={outOfStock || pending} size="lg">
          <ShoppingCart size={17} /> {t("addToCart")}
        </Button>
        <Button onClick={() => add(true)} disabled={outOfStock || pending} variant="outline" size="lg">
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
