import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCard as ProductCardData } from "@/server/queries/catalog.queries";

export async function ProductSection({
  eyebrow,
  title,
  subtitle,
  href,
  products,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href: string;
  products: ProductCardData[];
}) {
  if (products.length === 0) return null;
  const t = await getTranslations("Home");

  return (
    <section className="container-page py-20 lg:py-28">
      <div data-reveal className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 lg:mb-14">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="eyebrow mb-4 flex items-center gap-2.5 text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {eyebrow}
            </p>
          )}
          <h2 className="h-section text-ink">{title}</h2>
          {subtitle && <p className="mt-4 max-w-xl text-base text-ink-soft">{subtitle}</p>}
        </div>
        <Link
          href={href}
          className="group inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
        >
          {t("viewAll")}
          <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-14">
        {products.map((p, i) => (
          <div key={p.id} data-reveal data-reveal-delay={(i % 4) * 70}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
