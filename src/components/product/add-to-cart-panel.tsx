"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Landmark, Lock, Phone, ShoppingCart, Truck, Zap } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast";
import { addToCartAction } from "@/server/actions/cart.actions";
import { formatPrice } from "@/lib/format";
import { telHref } from "@/lib/contact";
import { localizeSpecValue, type SpecCell } from "@/lib/spec-table";
import { Select } from "@/components/ui/input";
import { useSizeSelection } from "@/components/product/size-selection";

// Money fields are null for signed-out visitors (B2B shop — prices are
// stripped server-side, see lib/auth/access): the panel then still shows
// sizes and stock, but asks to sign in instead of offering the cart.
type Variant = { id: string; name: string; sku: string; priceDelta: number | null; stock: number };

/** One size of a size group — each is its own product row (own SKU, price, stock). */
export type SizeOption = {
  id: string;
  publicSku: string;
  sizeLabel: string;
  specs: string | null;
  /** The same specs under named columns (catalogue-style table), when known. */
  cells: SpecCell[] | null;
  price: number | null;
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
  signInPath,
  contactPhone,
}: {
  productId: string;
  basePrice: number | null;
  baseStock: number;
  variants: Variant[];
  sizes?: SizeOption[];
  initialSizeId?: string;
  /** Where the sign-in link brings the visitor back to. */
  signInPath: string;
  /** From /admin/settings. */
  contactPhone: string;
}) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);

  const hasSizes = sizes.length > 1;
  // Shared with the full-width size table (SizeTable) when the page has one.
  const { sizeId, setSizeId } = useSizeSelection(initialSizeId ?? sizes[0]?.id ?? productId);
  const selectedSize = hasSizes ? (sizes.find((sz) => sz.id === sizeId) ?? sizes[0]) : null;

  // With sizes each size is its own product: it supplies the id, price and
  // stock. Otherwise the (optional) variant chips apply as before.
  const selectedVariant = hasSizes ? null : (variants.find((v) => v.id === variantId) ?? null);
  const targetProductId = selectedSize ? selectedSize.id : productId;
  const stock = selectedSize ? selectedSize.stock : selectedVariant ? selectedVariant.stock : baseStock;
  const price = selectedSize ? selectedSize.price : basePrice != null ? basePrice + (selectedVariant?.priceDelta ?? 0) : null;
  const compareAtPrice = selectedSize?.compareAtPrice ?? null;
  const outOfStock = stock <= 0;

  const maxQuantity = useMemo(() => Math.max(1, Math.min(stock, 99)), [stock]);

  /** "Ø230 · 38x2,4x10 · 22,2 · 16 — 12,50 €": a size, as a line of the drop-down list. */
  const optionLabel = (sz: SizeOption) => {
    const parts = sz.cells
      ? sz.cells.map(([key, value]) => (key === "diameter" ? `Ø${value}` : localizeSpecValue(value, locale as "fr" | "de" | "en" | "it")))
      : [sz.sizeLabel, ...(sz.specs ? [sz.specs] : [])];
    return parts.join(" · ") + (sz.price != null ? ` — ${formatPrice(sz.price, locale)}` : "");
  };

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
    <div id="buy-box" className="flex scroll-mt-28 flex-col gap-5 rounded-3xl border border-border bg-surface p-5 sm:p-7">
      {hasSizes && (
        <div>
          <label htmlFor="size-select" className="eyebrow mb-3 block text-muted">
            {t("sizeTableTitle")}
          </label>
          <Select
            id="size-select"
            value={selectedSize?.id}
            onChange={(e) => {
              setSizeId(e.target.value);
              setQuantity(1);
            }}
          >
            {sizes.map((sz) => (
              <option key={sz.id} value={sz.id}>
                {optionLabel(sz)}
              </option>
            ))}
          </Select>
          <a href="#tailles" className="mt-2 inline-block text-xs font-medium text-accent-dark underline underline-offset-2">
            {t("seeSizeTable", { count: sizes.length })}
          </a>
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

      {price == null ? (
        <>
          {selectedSize && (
            <p className="text-xs text-muted">
              {t("selectedSize", { size: selectedSize.sizeLabel })} · {t("ref", { sku: selectedSize.publicSku })}
            </p>
          )}
          <div className="flex flex-col gap-3 rounded-2xl bg-paper p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Lock size={15} /> {t("pricesForPros")}
            </p>
            <p className="text-sm text-muted">{t("pricesForProsHint")}</p>
            <LinkButton href={`/connexion?next=${encodeURIComponent(signInPath)}`} size="lg">
              {t("signInToSeePrice")}
            </LinkButton>
            <LinkButton href="/inscription" variant="ghost" size="sm">
              {t("requestAccount")}
            </LinkButton>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl leading-none text-ink">{formatPrice(price, locale)}</span>
            {compareAtPrice && (
              <span className="text-sm text-muted line-through">{formatPrice(compareAtPrice, locale)}</span>
            )}
            <span className="text-xs text-muted">{t("vatIncluded")}</span>
          </div>
          {selectedSize && (
            <p className="-mt-2 text-xs text-muted">
              {t("selectedSize", { size: selectedSize.sizeLabel })} · {t("ref", { sku: selectedSize.publicSku })}
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
        </>
      )}

      <div className="mt-1 flex flex-col gap-1.5 border-t border-border pt-4 text-xs text-muted">
        <p className="flex items-center gap-2"><Truck size={14} /> {t("shippingFast")}</p>
        <p className="flex items-center gap-2"><Landmark size={14} /> {t("paymentTransfer")}</p>
        <p className="flex items-center gap-2">
          <Phone size={14} />
          <span>
            {t("questionCallUs")}{" "}
            <a href={telHref(contactPhone)} className="font-medium text-ink hover:text-accent-dark">
              {contactPhone}
            </a>
          </span>
        </p>
      </div>
    </div>
  );
}
