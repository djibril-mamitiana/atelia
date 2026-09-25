import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { adminTitle } from "@/lib/admin-metadata";
import { db } from "@/lib/db";
import { stripSizeSuffix, stripSpecLines } from "@/lib/product-grouping";
import { loadFamilyRows } from "@/server/services/admin-product";
import { ProductForm } from "@/components/admin/product-form";

export const generateMetadata = () => adminTitle("navProducts");

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("Admin.Products");
  const [rows, categories, brands] = await Promise.all([
    loadFamilyRows(id),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (rows.length === 0) notFound();

  // Shared fields come from the size that was opened; for a multi-size product
  // the per-size suffix ("… Ø125mm") and per-size spec lines are stripped —
  // saving re-applies them from each row's size label / specs column.
  const lead = rows.find((r) => r.id === id) ?? rows[0];
  const multi = rows.length > 1;
  const base = (n: string | null) => (n ? (multi ? stripSizeSuffix(n, lead.sizeLabel) : n) : "");
  const desc = (d: string | null) => (d ? (multi ? stripSpecLines(d) : d) : "");

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("editTitle", { name: base(lead.name) })}</h1>
      <div className="mt-6 max-w-5xl">
        <ProductForm
          familyOf={lead.id}
          categories={categories}
          brands={brands}
          initial={{
            slug: lead.slug,
            name: base(lead.name),
            nameFr: base(lead.nameFr),
            nameEn: base(lead.nameEn),
            nameIt: base(lead.nameIt),
            description: desc(lead.description),
            descriptionFr: desc(lead.descriptionFr),
            descriptionEn: desc(lead.descriptionEn),
            descriptionIt: desc(lead.descriptionIt),
            shortDescription: lead.shortDescription ?? "",
            shortDescriptionFr: lead.shortDescriptionFr ?? "",
            shortDescriptionEn: lead.shortDescriptionEn ?? "",
            shortDescriptionIt: lead.shortDescriptionIt ?? "",
            taxRate: Number(lead.taxRate),
            categoryId: lead.categoryId,
            brandId: lead.brandId,
            isFeatured: rows.some((r) => r.isFeatured),
            isNew: rows.some((r) => r.isNew),
            isBestSeller: rows.some((r) => r.isBestSeller),
            seoTitle: lead.seoTitle ?? "",
            seoDescription: lead.seoDescription ?? "",
            imagesText: lead.images.map((i) => i.url).join("\n"),
            attributesText: lead.attributes.map((a) => `${a.name}: ${a.values.map((v) => v.value).join(", ")}`).join("\n"),
            variantsText: lead.variants.map((v) => `${v.name} | ${v.sku} | ${v.priceDelta} | ${v.stock}`).join("\n"),
            sizes: rows.map((r) => ({
              id: r.id,
              sku: r.sku,
              sizeLabel: r.sizeLabel ?? "",
              sizeSpecs: r.sizeSpecs ?? "",
              price: Number(r.price),
              compareAtPrice: r.compareAtPrice ? Number(r.compareAtPrice) : null,
              stock: r.stock,
              lowStockThreshold: r.lowStockThreshold,
              isActive: r.isActive,
            })),
          }}
        />
      </div>
    </div>
  );
}
