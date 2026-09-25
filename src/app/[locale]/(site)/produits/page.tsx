import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCatalogPage, type SortOption } from "@/server/queries/catalog.queries";
import { ProductCard } from "@/components/product/product-card";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { PackageSearch } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Catalog");
  return { title: t("allProducts") };
}

type SearchParams = {
  q?: string;
  categorie?: string;
  marque?: string;
  prix_min?: string;
  prix_max?: string;
  stock?: string;
  promotion?: string;
  tri?: string;
  page?: string;
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const t = await getTranslations("Catalog");

  const result = await getCatalogPage({
    q: sp.q,
    categorySlug: sp.categorie,
    brandSlugs: sp.marque?.split(",").filter(Boolean),
    minPrice: sp.prix_min ? Number(sp.prix_min) : undefined,
    maxPrice: sp.prix_max ? Number(sp.prix_max) : undefined,
    inStockOnly: sp.stock === "1",
    onSaleOnly: sp.promotion === "1",
    sort: (sp.tri as SortOption) ?? "pertinence",
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="container-page py-10 lg:py-16">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div>
          <p className="eyebrow text-accent-dark">{t("catalogEyebrow")}</p>
          <h1 className="h-section mt-4">{t("allProducts")}</h1>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted">{t("productsCount", { count: result.total })}</p>
      </header>

      <div className="mt-8 grid gap-6 lg:mt-12 lg:grid-cols-[260px_1fr] lg:gap-12">
        <CatalogFilters categories={result.categories} brands={result.brands} priceBounds={result.priceBounds} />

        <div>
          {result.products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={t("noResultsTitle")}
              description={t("noResultsDescription")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
              {result.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            basePath="/produits"
            searchParams={sp}
          />
        </div>
      </div>
    </div>
  );
}
