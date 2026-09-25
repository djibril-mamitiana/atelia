"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
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

  const ctaBase =
    "mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition-[background-color,color,border-color,transform] duration-300 active:scale-[0.98]";

  return (
    <div className={cn("group relative flex h-full flex-col", className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#e8e4db] ring-1 ring-inset ring-black/[0.04]">
        <Link href={`/produits/${product.slug}`} className="relative block h-full w-full" tabIndex={-1} aria-hidden="true">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">{t("photoUnavailable")}</div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-4.25rem)] flex-col items-start gap-1.5">
          {product.isNew && <Badge tone="dark">{t("newBadge")}</Badge>}
          {discount && <Badge tone="accent">-{discount}%</Badge>}
          {product.isBestSeller && !discount && <Badge tone="gold" className="max-w-full">{t("bestSellerBadge")}</Badge>}
          {outOfStock && <Badge tone="danger">{t("outOfStockBadge")}</Badge>}
        </div>

        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={favorite ? t("removeFromFavorites") : t("addToFavorites")}
          aria-pressed={favorite}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition-[transform,color] duration-300 hover:scale-105 hover:text-accent-dark"
        >
          <Heart size={17} className={favorite ? "fill-accent text-accent" : ""} />
        </button>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="eyebrow text-muted">{product.brand.name}</p>
        <Link
          href={`/produits/${product.slug}`}
          className="mt-1.5 line-clamp-2 text-[15px] font-medium leading-snug text-ink transition-colors hover:text-accent-dark"
        >
          {product.name}
        </Link>

        {product.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <RatingStars rating={Number(product.avgRating)} size={12} />
            <span className="text-xs text-muted">{t("reviewsCount", { count: product.reviewCount })}</span>
          </div>
        )}

        <div className="mt-auto pt-3">
          {grouped ? (
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[17px] font-semibold tabular-nums text-ink">
                {t("fromPrice", { price: formatPrice(product.fromPrice ?? price, locale) })}
              </span>
              <span className="font-mono text-[11px] text-muted">{t("sizesCount", { count: product.groupSize })}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-[17px] font-semibold tabular-nums text-ink">{formatPrice(price, locale)}</span>
              {compareAtPrice && (
                <span className="text-sm tabular-nums text-muted line-through">{formatPrice(compareAtPrice, locale)}</span>
              )}
            </div>
          )}
        </div>

        {grouped ? (
          // Several sizes: the size has to be picked on the product page.
          <Link
            href={`/produits/${product.slug}`}
            className={cn(
              ctaBase,
              outOfStock
                ? "pointer-events-none border border-ink/15 text-muted"
                : "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-white"
            )}
          >
            {outOfStock ? t("unavailable") : t("chooseSizeCta")}
            {!outOfStock && <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />}
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock || pending}
            className={cn(ctaBase, "bg-graphite text-white hover:bg-accent hover:text-graphite disabled:opacity-40")}
          >
            <ShoppingBag size={15} />
            {outOfStock ? t("unavailable") : t("addToCart")}
          </button>
        )}
      </div>
    </div>
  );
}
