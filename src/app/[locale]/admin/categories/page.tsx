import { adminTitle } from "@/lib/admin-metadata";
import { getTranslations } from "next-intl/server";
import { getAdminCategories } from "@/server/queries/admin.queries";
import { CategoryManager } from "@/components/admin/category-manager";

export const generateMetadata = () => adminTitle("navCategories");

export default async function AdminCategoriesPage() {
  const t = await getTranslations("Admin.Categories");
  const categories = await getAdminCategories();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("title")}</h1>
      <div className="mt-6 max-w-3xl">
        <CategoryManager
          initialCategories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description ?? "",
            imageUrl: c.imageUrl ?? "",
            parentId: c.parentId,
            order: c.order,
            isActive: c.isActive,
            parentName: c.parent?.name,
            productCount: c._count.products,
          }))}
        />
      </div>
    </div>
  );
}
