import { getLocale, getTranslations } from "next-intl/server";
import { adminTitle } from "@/lib/admin-metadata";
import { db } from "@/lib/db";
import { localizedCategoryName } from "@/lib/category-name";
import { ProductForm } from "@/components/admin/product-form";

export const generateMetadata = () => adminTitle("navProducts");

export default async function NewProductPage() {
  const t = await getTranslations("Admin.Products");
  const locale = await getLocale();
  const [categoryRows, brandRows] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, nameDe: true, nameEn: true, nameIt: true } }),
    db.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, nameDe: true, nameEn: true, nameIt: true } }),
  ]);
  // Dropdown option labels only (the value stays the id) — safe to localize.
  const categories = categoryRows.map((c) => ({ id: c.id, name: localizedCategoryName(c, locale) }));
  const brands = brandRows.map((b) => ({ id: b.id, name: localizedCategoryName(b, locale) }));

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("newTitle")}</h1>
      <div className="mt-6 max-w-5xl">
        <ProductForm categories={categories} brands={brands} />
      </div>
    </div>
  );
}
