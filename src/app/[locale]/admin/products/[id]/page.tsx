import { adminTitle } from "@/lib/admin-metadata";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getAdminProductById, getProductFamily } from "@/server/queries/admin.queries";
import { ProductForm } from "@/components/admin/product-form";
import { LinkButton } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export const generateMetadata = () => adminTitle("navProducts");

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("Admin.Products");
  const locale = await getLocale();
  const [product, categories, brands] = await Promise.all([
    getAdminProductById(id),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  const family = await getProductFamily(product.groupKey);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">{t("editTitle", { name: product.name })}</h1>
        <LinkButton href={`/admin/products/new?from=${product.id}`} size="sm" variant="outline">
          <Plus size={15} /> {t("addSize")}
        </LinkButton>
      </div>
      <div className="mt-6 max-w-3xl">
        <ProductForm
          productId={product.id}
          categories={categories}
          brands={brands}
          familyCount={family.length}
          initial={{
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            description: product.description,
            shortDescription: product.shortDescription ?? "",
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            taxRate: Number(product.taxRate),
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold,
            categoryId: product.categoryId,
            brandId: product.brandId,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            isNew: product.isNew,
            isBestSeller: product.isBestSeller,
            seoTitle: product.seoTitle ?? "",
            seoDescription: product.seoDescription ?? "",
            imagesText: product.images.map((i) => i.url).join("\n"),
            attributesText: product.attributes.map((a) => `${a.name}: ${a.values.map((v) => v.value).join(", ")}`).join("\n"),
            variantsText: product.variants.map((v) => `${v.name} | ${v.sku} | ${v.priceDelta} | ${v.stock}`).join("\n"),
            sizeLabel: product.sizeLabel ?? "",
            sizeSpecs: product.sizeSpecs ?? "",
          }}
        />
      </div>

      {family.length > 1 && (
        <div className="mt-8 max-w-3xl">
          <h2 className="mb-3 font-medium text-ink">{t("familyTitle", { count: family.length })}</h2>
          <div className="max-h-72 overflow-auto rounded-md border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-paper text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("colSize")}</th>
                  <th className="px-4 py-2 font-medium">SKU</th>
                  <th className="px-4 py-2 font-medium">{t("colPrice")}</th>
                  <th className="px-4 py-2 font-medium">{t("colStock")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {family.map((f) => (
                  <tr key={f.id} className={f.id === product.id ? "bg-accent-soft" : "hover:bg-paper"}>
                    <td className="px-4 py-2">
                      <Link href={`/admin/products/${f.id}`} className="font-medium text-ink hover:text-accent-dark">
                        {f.sizeLabel ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted">{f.sku}</td>
                    <td className="px-4 py-2 text-ink">{formatPrice(Number(f.price), locale)}</td>
                    <td className="px-4 py-2 text-muted">{f.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
