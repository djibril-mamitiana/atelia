import { adminTitle } from "@/lib/admin-metadata";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const generateMetadata = () => adminTitle("navProducts");

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const t = await getTranslations("Admin.Products");
  const { from } = await searchParams;
  const [categories, brands, source] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // "Add a size": start from an existing product so only what differs
    // (size, SKU, price, stock) has to be typed.
    from ? db.product.findUnique({ where: { id: from }, include: { images: { orderBy: { position: "asc" } } } }) : null,
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{source ? t("newSizeTitle", { name: source.name }) : t("newTitle")}</h1>
      <div className="mt-6 max-w-3xl">
        <ProductForm
          categories={categories}
          brands={brands}
          initial={
            source
              ? {
                  name: source.name,
                  description: source.description,
                  shortDescription: source.shortDescription ?? "",
                  price: Number(source.price),
                  taxRate: Number(source.taxRate),
                  lowStockThreshold: source.lowStockThreshold,
                  categoryId: source.categoryId,
                  brandId: source.brandId,
                  imagesText: source.images.map((i) => i.url).join("\n"),
                  groupWithSku: source.sku,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
