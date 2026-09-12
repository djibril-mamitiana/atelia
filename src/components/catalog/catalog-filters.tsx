"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

type Category = { id: string; name: string; slug: string; _count: { products: number } };
type Brand = { id: string; name: string; slug: string };

export function CatalogFilters({
  categories,
  brands,
  priceBounds,
}: {
  categories: Category[];
  brands: Brand[];
  priceBounds: { min: number; max: number };
}) {
  const t = useTranslations("Catalog");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = searchParams.get("categorie") ?? "";
  const currentBrands = searchParams.get("marque")?.split(",").filter(Boolean) ?? [];
  const currentSort = searchParams.get("tri") ?? "pertinence";
  const inStockOnly = searchParams.get("stock") === "1";
  const onSaleOnly = searchParams.get("promotion") === "1";
  const [minPrice, setMinPrice] = useState(searchParams.get("prix_min") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("prix_max") ?? "");

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function toggleBrand(slug: string) {
    const next = currentBrands.includes(slug) ? currentBrands.filter((b) => b !== slug) : [...currentBrands, slug];
    updateParams({ marque: next.join(",") || null });
  }

  return (
    <aside className="flex flex-col gap-8">
      <div>
        <p className="mb-3 text-sm font-medium text-ink">{t("sortBy")}</p>
        <Select value={currentSort} onChange={(e) => updateParams({ tri: e.target.value })}>
          <option value="pertinence">{t("sortRelevance")}</option>
          <option value="prix-asc">{t("sortPriceAsc")}</option>
          <option value="prix-desc">{t("sortPriceDesc")}</option>
          <option value="nouveaute">{t("sortNewest")}</option>
          <option value="note">{t("sortTopRated")}</option>
        </Select>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-ink">{t("category")}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => updateParams({ categorie: null })}
            className={`text-left text-sm ${!currentCategory ? "font-medium text-accent-dark" : "text-muted hover:text-ink"}`}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParams({ categorie: cat.slug })}
              className={`flex items-center justify-between text-left text-sm ${
                currentCategory === cat.slug ? "font-medium text-accent-dark" : "text-muted hover:text-ink"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-muted">({cat._count.products})</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-ink">{t("brand")}</p>
        <div className="flex flex-col gap-2">
          {brands.map((brand) => (
            <label key={brand.id} className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={currentBrands.includes(brand.slug)}
                onChange={() => toggleBrand(brand.slug)}
                className="h-4 w-4 rounded-sm border-border-strong accent-accent"
              />
              {brand.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-ink">{t("price")}</p>
        <p className="mb-2 text-xs text-muted">
          {formatPrice(priceBounds.min)} — {formatPrice(priceBounds.max)}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={t("minPlaceholder")}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => updateParams({ prix_min: minPrice || null })}
            className="h-9 w-full rounded-md border border-border-strong px-2.5 text-sm"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            placeholder={t("maxPlaceholder")}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => updateParams({ prix_max: maxPrice || null })}
            className="h-9 w-full rounded-md border border-border-strong px-2.5 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => updateParams({ stock: e.target.checked ? "1" : null })}
            className="h-4 w-4 rounded-sm border-border-strong accent-accent"
          />
          {t("inStockOnly")}
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={(e) => updateParams({ promotion: e.target.checked ? "1" : null })}
            className="h-4 w-4 rounded-sm border-border-strong accent-accent"
          />
          {t("onSale")}
        </label>
      </div>

      <Button variant="outline" size="sm" onClick={() => router.push(pathname)}>
        {t("resetFilters")}
      </Button>
    </aside>
  );
}
