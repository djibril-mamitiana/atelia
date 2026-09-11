import type { Metadata } from "next";
import { getAdminBrands } from "@/server/queries/admin.queries";
import { BrandManager } from "@/components/admin/brand-manager";

export const metadata: Metadata = { title: "Marques — Admin" };

export default async function AdminBrandsPage() {
  const brands = await getAdminBrands();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Marques</h1>
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
