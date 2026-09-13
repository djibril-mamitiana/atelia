"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { removeCartItemAction, updateCartItemQuantityAction } from "@/server/actions/cart.actions";

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
}) {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

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

  return (
    <div className="flex gap-4 py-5">
      <Link href={`/produits/${productSlug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-paper">
        {imageUrl && <Image src={imageUrl} alt={productName} fill sizes="96px" className="object-cover" />}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-muted">{brandName}</p>
        <Link href={`/produits/${productSlug}`} className="text-sm font-medium text-ink hover:text-accent-dark">
          {productName}
        </Link>
        {variantName && <p className="text-xs text-muted">{variantName}</p>}
        {stock < quantity && <p className="text-xs font-medium text-danger">{t("stockLimited", { stock })}</p>}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper value={quantity} onChange={updateQuantity} max={Math.max(1, stock)} disabled={pending} />
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-ink">{formatPrice(unitPrice * quantity, locale)}</span>
            <button onClick={remove} aria-label={t("removeFromCart")} className="text-muted hover:text-danger">
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
