import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getAdminProductById } from "@/server/queries/admin.queries";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Modifier le produit — Admin" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    getAdminProductById(id),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Modifier « {product.name} »</h1>
      <div className="mt-6 max-w-3xl">
        <ProductForm
          productId={product.id}
          categories={categories}
          brands={brands}
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
          }}
        />
      </div>
    </div>
  );
}
