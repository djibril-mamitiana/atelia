import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Nouveau produit — Admin" };

export default async function NewProductPage() {
  const t = await getTranslations("Admin.Products");
  const [categories, brands] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("newTitle")}</h1>
      <div className="mt-6 max-w-3xl">
        <ProductForm categories={categories} brands={brands} />
      </div>
    </div>
  );
}
