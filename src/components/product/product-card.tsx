"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn } from "@/lib/utils";
import { formatPrice, discountPercent } from "@/lib/format";
import { addToCartAction } from "@/server/actions/cart.actions";
import { toggleFavoriteAction } from "@/server/actions/favorite.actions";
import { useToast } from "@/components/ui/toast";
import type { ProductCard as ProductCardData } from "@/server/queries/catalog.queries";

export function ProductCard({
  product,
  isFavorite = false,
  className,
}: {
  product: ProductCardData;
  isFavorite?: boolean;
  className?: string;
}) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [favorite, setFavorite] = useState(isFavorite);

  const grouped = product.groupSize > 1;
  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = discountPercent(price, compareAtPrice);
  const outOfStock = product.stock <= 0;
  const image = product.images[0];

  function handleAddToCart() {
    startTransition(async () => {
      const result = await addToCartAction(product.id, 1);
      toast(result.success ? t("addedToCart") : result.error, result.success ? "success" : "error");
    });
  }

  function handleToggleFavorite() {
    setFavorite((f) => !f); // optimistic
    startTransition(async () => {
      const result = await toggleFavoriteAction(product.id);
      if (!result.success) {
        setFavorite((f) => !f); // revert
        toast(result.error, "error");
      }
    });
  }

  return (
    <div className={cn("group relative flex flex-col", className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-paper">
        <Link href={`/produits/${product.slug}`} className="relative block h-full w-full">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted text-sm">{t("photoUnavailable")}</div>
          )}
        </Link>

        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {product.isNew && <Badge tone="sage">{t("newBadge")}</Badge>}
          {product.isBestSeller && <Badge tone="gold">{t("bestSellerBadge")}</Badge>}
          {discount && <Badge tone="accent">-{discount}%</Badge>}
          {outOfStock && <Badge tone="danger">{t("outOfStockBadge")}</Badge>}
        </div>

        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={favorite ? t("removeFromFavorites") : t("addToFavorites")}
          aria-pressed={favorite}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink-soft shadow-sm transition-colors hover:text-accent"
        >
          <Heart size={17} className={favorite ? "fill-accent text-accent" : ""} />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-muted">{product.brand.name}</p>
        <Link href={`/produits/${product.slug}`} className="line-clamp-2 text-sm font-medium text-ink hover:text-accent-dark">
          {product.name}
        </Link>

        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <RatingStars rating={Number(product.avgRating)} size={12} />
            <span className="text-xs text-muted">{t("reviewsCount", { count: product.reviewCount })}</span>
          </div>
        )}

        {grouped ? (
          <div className="mt-1 flex flex-col">
            <span className="text-base font-semibold text-ink">
              {t("fromPrice", { price: formatPrice(product.fromPrice ?? price, locale) })}
            </span>
            <span className="text-xs text-muted">{t("sizesCount", { count: product.groupSize })}</span>
          </div>
        ) : (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-semibold text-ink">{formatPrice(price, locale)}</span>
            {compareAtPrice && (
              <span className="text-sm text-muted line-through">{formatPrice(compareAtPrice, locale)}</span>
            )}
          </div>
        )}

        {grouped ? (
          // Several sizes: the size has to be picked on the product page.
          <Link
            href={`/produits/${product.slug}`}
            className={cn(
              "mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
              outOfStock ? "pointer-events-none bg-ink text-white opacity-40" : "bg-ink text-white hover:bg-ink-soft"
            )}
          >
            <ShoppingCart size={15} />
            {outOfStock ? t("unavailable") : t("chooseSizeCta")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock || pending}
            className={cn(
              "mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
              "bg-ink text-white hover:bg-ink-soft disabled:opacity-40"
            )}
          >
            <ShoppingCart size={15} />
            {outOfStock ? t("unavailable") : t("addToCart")}
          </button>
        )}
      </div>
    </div>
  );
}
