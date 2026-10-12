"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { removeCartItemAction, updateCartItemQuantityAction } from "@/server/actions/cart.actions";
import type { CartItemIssue } from "@/server/services/cart";

export function CartItemRow({
  id,
  productSlug,
  productName,
  brandName,
  imageUrl,
  variantName,
  unitPrice,
  quantity,
  stock,
  issue,
}: {
  id: string;
  productSlug: string;
  productName: string;
  brandName: string;
  imageUrl?: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
  issue: CartItemIssue | null;
}) {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  // Deactivated (its page is gone) or sold out: can only be removed.
  const orderable = issue !== "unavailable" && issue !== "outOfStock";

  function updateQuantity(next: number) {
    startTransition(async () => {
      const result = await updateCartItemQuantityAction(id, next);
      if (!result.success) toast(result.error, "error");
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeCartItemAction(id);
      if (!result.success) toast(result.error, "error");
    });
  }

  const image = imageUrl && <Image src={imageUrl} alt={productName} fill sizes="96px" className="object-cover" />;

  return (
    <div className="flex gap-4 py-5">
      {issue === "unavailable" ? (
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-paper opacity-50">{image}</div>
      ) : (
        <Link href={`/produits/${productSlug}`} className={cn("relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-paper", !orderable && "opacity-50")}>
          {image}
        </Link>
      )}

      <div className="flex flex-1 flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-muted">{brandName}</p>
        {issue === "unavailable" ? (
          <p className="text-sm font-medium text-muted">{productName}</p>
        ) : (
          <Link href={`/produits/${productSlug}`} className="text-sm font-medium text-ink hover:text-accent-dark">
            {productName}
          </Link>
        )}
        {variantName && <p className="text-xs text-muted">{variantName}</p>}
        {issue === "unavailable" && <p className="text-xs font-medium text-danger">{t("itemUnavailable")}</p>}
        {issue === "outOfStock" && <p className="text-xs font-medium text-danger">{t("itemOutOfStock")}</p>}
        {issue === "stockLimited" && <p className="text-xs font-medium text-danger">{t("stockLimited", { stock })}</p>}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          {orderable ? (
            <QuantityStepper value={quantity} onChange={updateQuantity} max={Math.max(1, stock)} disabled={pending} />
          ) : (
            <span />
          )}
          <div className="flex items-center gap-4">
            {orderable && <span className="text-sm font-semibold text-ink">{formatPrice(unitPrice * quantity, locale)}</span>}
            <button onClick={remove} disabled={pending} aria-label={t("removeFromCart")} className="text-muted hover:text-danger">
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
