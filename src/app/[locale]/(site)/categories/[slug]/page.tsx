import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCategoryBySlug } from "@/server/queries/categories.queries";
import { getCatalogPage, type SortOption } from "@/server/queries/catalog.queries";
import { ProductCard } from "@/components/product/product-card";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { PackageSearch } from "lucide-react";

type Params = { slug: string };
type SearchParams = {
  categorie?: string;
  marque?: string;
  prix_min?: string;
  prix_max?: string;
  stock?: string;
  promotion?: string;
  tri?: string;
  page?: string;
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    // category.name/description are already locale-resolved by
    // getCategoryBySlug — seoTitle/seoDescription are French-only.
    title: category.name,
    description: category.description || undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const t = await getTranslations("Catalog");

  const result = await getCatalogPage({
    // The route already scopes to this category; a click on a child in the
    // sidebar filter overrides it via ?categorie=, without leaving the page.
    categorySlug: sp.categorie ?? slug,
    brandSlugs: sp.marque?.split(",").filter(Boolean),
    minPrice: sp.prix_min ? Number(sp.prix_min) : undefined,
    maxPrice: sp.prix_max ? Number(sp.prix_max) : undefined,
    inStockOnly: sp.stock === "1",
    onSaleOnly: sp.promotion === "1",
    sort: (sp.tri as SortOption) ?? "pertinence",
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="container-page py-10">
      {category.parent && (
        <Link href={`/categories/${category.parent.slug}`} className="text-sm text-muted hover:text-ink">
          ← {category.parent.name}
        </Link>
      )}
      <h1 className="mt-1 font-display text-3xl text-ink">{category.name}</h1>
      {category.description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{category.description}</p>}

      {category.children.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="rounded-full border border-border-strong px-3.5 py-1.5 text-sm text-ink-soft hover:border-accent hover:text-accent-dark"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        <CatalogFilters categories={result.categories} brands={result.brands} priceBounds={result.priceBounds} />

        <div>
          {result.products.length === 0 ? (
            <EmptyState icon={PackageSearch} title={t("noResultsCategory")} />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3">
              {result.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <Pagination page={result.page} pageCount={result.pageCount} basePath={`/categories/${slug}`} searchParams={sp} />
        </div>
      </div>
    </div>
  );
}
