import { adminTitle } from "@/lib/admin-metadata";
import { getTranslations } from "next-intl/server";
import { getAdminBrands } from "@/server/queries/admin.queries";
import { BrandManager } from "@/components/admin/brand-manager";

export const generateMetadata = () => adminTitle("navBrands");

export default async function AdminBrandsPage() {
  const t = await getTranslations("Admin.Brands");
  const brands = await getAdminBrands();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("title")}</h1>
      <div className="mt-6 max-w-2xl">
        <BrandManager
          initialBrands={brands.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            logoUrl: b.logoUrl ?? "",
            description: b.description ?? "",
            website: b.website ?? "",
            isActive: b.isActive,
            productCount: b._count.products,
          }))}
        />
      </div>
    </div>
  );
}
