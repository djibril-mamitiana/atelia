import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCard as ProductCardData } from "@/server/queries/catalog.queries";

export async function ProductSection({
  title,
  subtitle,
  href,
  products,
}: {
  title: string;
  subtitle?: string;
  href: string;
  products: ProductCardData[];
}) {
  if (products.length === 0) return null;
  const t = await getTranslations("Home");

  return (
    <section className="container-page py-12 lg:py-16">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-ink lg:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <Link href={href} className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-accent-dark hover:underline sm:flex">
          {t("viewAll")} <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <Link href={href} className="mt-7 flex items-center justify-center gap-1.5 text-sm font-medium text-accent-dark sm:hidden">
        {t("viewAll")} <ArrowRight size={15} />
      </Link>
    </section>
  );
}
