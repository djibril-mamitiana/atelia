"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
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
  const locale = useLocale();
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
  const [open, setOpen] = useState(false);
  const activeCount =
    (currentCategory ? 1 : 0) + currentBrands.length + (inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + (searchParams.get("prix_min") ? 1 : 0) + (searchParams.get("prix_max") ? 1 : 0);

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
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between rounded-full border border-ink/20 bg-surface px-5 text-sm font-medium text-ink lg:hidden"
      >
        <span className="flex items-center gap-2.5">
          <SlidersHorizontal size={17} />
          {t("filters")}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-mono text-[10.5px] font-semibold text-graphite">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown size={18} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        className={`${open ? "flex" : "hidden"} mt-3 flex-col gap-8 rounded-3xl border border-border bg-surface p-6 lg:mt-0 lg:flex`}
      >
      <div>
        <p className="eyebrow mb-3 text-muted">{t("sortBy")}</p>
        <Select value={currentSort} onChange={(e) => updateParams({ tri: e.target.value })}>
          <option value="pertinence">{t("sortRelevance")}</option>
          <option value="prix-asc">{t("sortPriceAsc")}</option>
          <option value="prix-desc">{t("sortPriceDesc")}</option>
          <option value="nouveaute">{t("sortNewest")}</option>
          <option value="note">{t("sortTopRated")}</option>
        </Select>
      </div>

      <div>
        <p className="eyebrow mb-3 text-muted">{t("category")}</p>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
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
        <p className="eyebrow mb-3 text-muted">{t("brand")}</p>
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
        <p className="eyebrow mb-3 text-muted">{t("price")}</p>
        <p className="mb-2 text-xs text-muted">
          {formatPrice(priceBounds.min, locale)} — {formatPrice(priceBounds.max, locale)}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={t("minPlaceholder")}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => updateParams({ prix_min: minPrice || null })}
            className="h-10 w-full rounded-xl border border-border-strong bg-paper px-3 text-sm"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            placeholder={t("maxPlaceholder")}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => updateParams({ prix_max: maxPrice || null })}
            className="h-10 w-full rounded-xl border border-border-strong bg-paper px-3 text-sm"
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
      </div>
    </aside>
  );
}
